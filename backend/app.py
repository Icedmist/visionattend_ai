import os
import io
import csv
from datetime import datetime
from flask import Flask, request, jsonify, make_response, send_from_directory
from flask_cors import CORS
import database
import face_handler

app = Flask(__name__, static_folder='static')
CORS(app) # Enable CORS for all routes (to support React frontend at localhost:5173)

# Simple Admin Token storage in memory
ACTIVE_TOKENS = set()

def admin_required(f):
    """Decorator to require admin authentication."""
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'success': False, 'message': 'Authorization header is missing'}), 401
        
        # Strip 'Bearer ' if present
        if token.startswith('Bearer '):
            token = token[7:]
            
        if token not in ACTIVE_TOKENS:
            return jsonify({'success': False, 'message': 'Invalid or expired admin session token'}), 401
        return f(*args, **kwargs)
    return decorated

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'success': False, 'message': 'Username and password are required'}), 400
        
    if database.verify_admin(username, password):
        import uuid
        token = f"va_token_{uuid.uuid4().hex}"
        ACTIVE_TOKENS.add(token)
        return jsonify({
            'success': True,
            'token': token,
            'username': username,
            'message': 'Welcome to VisionAttend AI Admin Console!'
        })
    else:
        return jsonify({'success': False, 'message': 'Invalid username or password'}), 401

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    token = request.headers.get('Authorization')
    if token:
        if token.startswith('Bearer '):
            token = token[7:]
        ACTIVE_TOKENS.discard(token)
    return jsonify({'success': True, 'message': 'Logged out successfully.'})

@app.route('/api/auth/verify', methods=['GET'])
def verify():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'valid': False}), 401
    if token.startswith('Bearer '):
        token = token[7:]
    if token in ACTIVE_TOKENS:
        return jsonify({'valid': True})
    return jsonify({'valid': False}), 401

@app.route('/api/students/register', methods=['POST'])
@admin_required
def register_student():
    data = request.get_json() or {}
    matric_number = data.get('matric_number')
    name = data.get('name')
    department = data.get('department')
    images = data.get('images') # List of Base64 data URLs
    
    if not matric_number or not name or not department:
        return jsonify({'success': False, 'message': 'Name, Matric Number, and Department are required.'}), 400
        
    if not images or len(images) == 0:
        return jsonify({'success': False, 'message': 'At least one face snapshot is required.'}), 400
        
    success, message = face_handler.register_student_with_faces(matric_number, name, department, images)
    
    if success:
        return jsonify({'success': True, 'message': message})
    else:
        return jsonify({'success': False, 'message': message}), 400

@app.route('/api/attendance/detect', methods=['POST'])
def detect_attendance():
    data = request.get_json() or {}
    image = data.get('image') # Base64 frame
    
    if not image:
        return jsonify({'success': False, 'message': 'No video frame data received.'}), 400
        
    results = face_handler.recognize_faces_in_frame(image)
    return jsonify(results)

@app.route('/api/dashboard/stats', methods=['GET'])
def get_stats():
    stats = database.get_dashboard_stats()
    return jsonify(stats)

@app.route('/api/attendance/records', methods=['GET'])
def get_attendance():
    date_filter = request.args.get('date') # YYYY-MM-DD
    dept_filter = request.args.get('department')
    search_query = request.args.get('search')
    
    records = database.get_attendance_records(
        date_filter=date_filter, 
        department_filter=dept_filter, 
        search_query=search_query
    )
    return jsonify(records)

@app.route('/api/attendance/export', methods=['GET'])
def export_attendance():
    date_filter = request.args.get('date')
    dept_filter = request.args.get('department')
    search_query = request.args.get('search')
    
    records = database.get_attendance_records(
        date_filter=date_filter,
        department_filter=dept_filter,
        search_query=search_query
    )
    
    # Generate CSV in memory
    si = io.StringIO()
    cw = csv.writer(si)
    
    # Write header
    cw.writerow(['Record ID', 'Date', 'Scan Time', 'Student Name', 'Matric Number', 'Department', 'Confidence (%)'])
    
    # Write rows
    for r in records:
        cw.writerow([
            r['id'],
            r['date'],
            r['timestamp'],
            r['name'],
            r['matric_number'],
            r['department'],
            f"{r['confidence']}%"
        ])
        
    output = si.getvalue()
    response = make_response(output)
    
    # Set headers for attachment download
    filename = f"VisionAttend_Export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    response.headers["Content-Disposition"] = f"attachment; filename={filename}"
    response.headers["Content-type"] = "text/csv"
    return response

@app.route('/api/students', methods=['GET'])
def get_students_list():
    students = database.get_all_students()
    return jsonify(students)

@app.route('/api/unknown/records', methods=['GET'])
def get_unknown_logs():
    logs = database.get_unknown_detections()
    return jsonify(logs)

# Serve static uploads
@app.route('/static/registered_faces/<path:filename>')
def serve_registered(filename):
    return send_from_directory(os.path.join(app.static_folder, 'registered_faces'), filename)

@app.route('/static/unknown_faces/<path:filename>')
def serve_unknown(filename):
    return send_from_directory(os.path.join(app.static_folder, 'unknown_faces'), filename)

if __name__ == '__main__':
    # Initialize DB schemas
    database.init_db()
    # Cache faces on startup
    face_handler.load_known_faces()
    # Run server
    app.run(host='0.0.0.0', port=5000, debug=True)
