import os
import re
import cv2
import numpy as np
import base64
import uuid
from datetime import datetime
import face_recognition
import database

# Paths setup
STATIC_DIR = os.path.join(os.path.dirname(__file__), 'static')
REGISTERED_DIR = os.path.join(STATIC_DIR, 'registered_faces')
UNKNOWN_DIR = os.path.join(STATIC_DIR, 'unknown_faces')

# Ensure directories exist
os.makedirs(REGISTERED_DIR, exist_ok=True)
os.makedirs(UNKNOWN_DIR, exist_ok=True)

# In-memory cache for registered faces to ensure real-time scaling performance
KNOWN_ENCODINGS = []
KNOWN_METADATA = [] # List of dicts matching KNOWN_ENCODINGS indices: {'student_id': id, 'name': name, 'matric_number': matric, 'department': dept}

def load_known_faces():
    """Load all registered face encodings from database into memory."""
    global KNOWN_ENCODINGS, KNOWN_METADATA
    try:
        faces = database.get_all_student_faces()
        encodings = []
        metadata = []
        
        for face in faces:
            encodings.append(np.array(face['encoding']))
            metadata.append({
                'student_id': face['student_id'],
                'name': face['name'],
                'matric_number': face['matric_number'],
                'department': face['department']
            })
            
        KNOWN_ENCODINGS = encodings
        KNOWN_METADATA = metadata
        print(f"Loaded {len(KNOWN_ENCODINGS)} registered face encodings into cache.")
    except Exception as e:
        print(f"Error loading registered faces: {e}")

def decode_base64_image(base64_str):
    """Decode base64 image data URI to BGR OpenCV image."""
    try:
        # Check if the string has data uri prefix like "data:image/jpeg;base64,"
        if ',' in base64_str:
            base64_str = base64_str.split(',')[1]
            
        img_data = base64.b64decode(base64_str)
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        print(f"Failed to decode base64 image: {e}")
        return None

def register_student_with_faces(matric_number, name, department, base64_images):
    """
    Registers a student and their face encodings.
    Saves face images to disk and face encodings to SQLite database.
    """
    matric_upper = matric_number.strip().upper()
    
    # 1. Insert student metadata in SQLite
    student_id, error = database.add_student(matric_upper, name, department)
    if error:
        return False, error
        
    faces_saved = 0
    errors = []
    
    # 2. Process and save each face image
    for idx, b64_img in enumerate(base64_images):
        img = decode_base64_image(b64_img)
        if img is None:
            errors.append(f"Image {idx+1} could not be decoded.")
            continue
            
        # Convert to RGB for face_recognition
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Detect face locations and encodings
        face_locations = face_recognition.face_locations(rgb_img)
        face_encodings = face_recognition.face_encodings(rgb_img, face_locations)
        
        if len(face_encodings) == 0:
            errors.append(f"No face detected in photo {idx+1}. Please look directly at the camera.")
            continue
        elif len(face_encodings) > 1:
            errors.append(f"Multiple faces detected in photo {idx+1}. Only one person should be in the frame.")
            continue
            
        # Extract the single face encoding (numpy array of 128 elements)
        encoding = face_encodings[0].tolist()
        
        # Save image file to disk
        filename = f"{matric_upper}_{idx}_{uuid.uuid4().hex[:8]}.jpg"
        file_path = os.path.join(REGISTERED_DIR, filename)
        
        # Let's save a clean JPEG
        cv2.imwrite(file_path, img)
        
        # Store face record in database (save path relative to backend root)
        relative_path = f"static/registered_faces/{filename}"
        database.add_student_face(student_id, relative_path, encoding)
        faces_saved += 1

    # 3. Handle registration outcomes
    if faces_saved == 0:
        # Rollback student registration since no valid face could be captured
        conn = database.get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM students WHERE id = ?", (student_id,))
        conn.commit()
        conn.close()
        
        err_msg = "; ".join(errors) if errors else "Failed to capture any valid face scans."
        return False, f"Registration failed: {err_msg}"
        
    # Reload known faces into memory cache to include the newly registered student
    load_known_faces()
    
    msg = f"Registered {name} successfully with {faces_saved} face profiles."
    if errors:
        msg += f" Note: {len(errors)} photos were skipped due to: {', '.join(errors)}"
    return True, msg

def recognize_faces_in_frame(base64_image):
    """
    Scans a webcam frame for faces. Compares with in-memory cached encodings.
    Marks attendance automatically for matches, and logs unrecognized faces.
    """
    img = decode_base64_image(base64_image)
    if img is None:
        return {'error': 'Invalid image data'}
        
    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # Run face detection and encoding extraction
    face_locations = face_recognition.face_locations(rgb_img)
    face_encodings = face_recognition.face_encodings(rgb_img, face_locations)
    
    detections = []
    
    for face_loc, face_enc in zip(face_locations, face_encodings):
        top, right, bottom, left = face_loc
        box = [top, right, bottom, left]
        
        # Match against our in-memory cache
        matched = False
        student_id = None
        name = "Unknown User"
        matric_number = ""
        department = ""
        confidence = 0.0
        marked = False
        attendance_status = ""
        
        if len(KNOWN_ENCODINGS) > 0:
            # Calculate Euclidean distances to all registered encodings
            distances = face_recognition.face_distance(KNOWN_ENCODINGS, face_enc)
            best_idx = np.argmin(distances)
            min_dist = distances[best_idx]
            
            # Standard face recognition matching threshold is 0.6
            if min_dist < 0.6:
                matched = True
                meta = KNOWN_METADATA[best_idx]
                student_id = meta['student_id']
                name = meta['name']
                matric_number = meta['matric_number']
                department = meta['department']
                # Scale confidence percentage dynamically based on face distance
                confidence = round((1.0 - min_dist) * 100, 1)
                
                # Automatically mark attendance in database
                marked, attendance_status = database.mark_attendance(student_id, confidence)
                
        if matched:
            detections.append({
                'matched': True,
                'student_id': student_id,
                'name': name,
                'matric_number': matric_number,
                'department': department,
                'confidence': confidence,
                'box': box,
                'marked': marked,
                'attendance_status': attendance_status
            })
        else:
            # 1. Unrecognized face: Save screenshot to static/unknown_faces
            filename = f"unknown_{uuid.uuid4().hex[:12]}.jpg"
            file_path = os.path.join(UNKNOWN_DIR, filename)
            
            # We can crop the face or save the entire screenshot. Whole frame is better for contextual logs!
            cv2.imwrite(file_path, img)
            
            # 2. Log in database
            relative_path = f"static/unknown_faces/{filename}"
            database.log_unknown_face(relative_path)
            
            detections.append({
                'matched': False,
                'name': "Unknown User",
                'box': box,
                'image_path': relative_path,
                'confidence': 0.0
            })
            
    return {'detections': detections}
