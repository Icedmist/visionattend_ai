import sqlite3
import os
import json
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'data', 'visionattend.db')

def get_db_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create Admins table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        )
    ''')
    
    # Create Students table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            matric_number TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            department TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create Student Faces table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS student_faces (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            image_path TEXT NOT NULL,
            encoding TEXT NOT NULL, -- JSON serialized list of 128 floats
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
        )
    ''')
    
    # Create Attendance table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            date TEXT NOT NULL, -- YYYY-MM-DD
            timestamp TEXT NOT NULL, -- YYYY-MM-DD HH:MM:SS
            confidence REAL NOT NULL,
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
            UNIQUE(student_id, date) -- Prevent duplicates within the same day
        )
    ''')
    
    # Create Unknown Detections table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS unknown_detections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            image_path TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    ''')
    
    # Seed default admin if it doesn't exist
    cursor.execute("SELECT id FROM admins WHERE username = 'admin'")
    if not cursor.fetchone():
        default_pwd_hash = generate_password_hash('adminpassword123')
        cursor.execute("INSERT INTO admins (username, password_hash) VALUES (?, ?)", ('admin', default_pwd_hash))
        
    conn.commit()
    conn.close()
    print("Database initialized successfully.")

# Admins operations
def verify_admin(username, password):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT password_hash FROM admins WHERE username = ?", (username,))
    row = cursor.fetchone()
    conn.close()
    if row and check_password_hash(row['password_hash'], password):
        return True
    return False

# Students operations
def add_student(matric_number, name, department):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO students (matric_number, name, department) VALUES (?, ?, ?)",
            (matric_number.strip().upper(), name.strip(), department.strip())
        )
        student_id = cursor.lastrowid
        conn.commit()
        return student_id, None
    except sqlite3.IntegrityError:
        return None, "Matric number already exists"
    finally:
        conn.close()

def get_student_by_matric(matric_number):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM students WHERE matric_number = ?", (matric_number.strip().upper(),))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_all_students():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM students ORDER BY name ASC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

# Student Faces operations
def add_student_face(student_id, image_path, encoding_list):
    conn = get_db_connection()
    cursor = conn.cursor()
    encoding_json = json.dumps(encoding_list)
    cursor.execute(
        "INSERT INTO student_faces (student_id, image_path, encoding) VALUES (?, ?, ?)",
        (student_id, image_path, encoding_json)
    )
    conn.commit()
    conn.close()

def get_all_student_faces():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT sf.student_id, sf.image_path, sf.encoding, s.name, s.matric_number, s.department 
        FROM student_faces sf 
        JOIN students s ON sf.student_id = s.id
    """)
    rows = cursor.fetchall()
    conn.close()
    
    faces = []
    for row in rows:
        faces.append({
            'student_id': row['student_id'],
            'image_path': row['image_path'],
            'encoding': json.loads(row['encoding']),
            'name': row['name'],
            'matric_number': row['matric_number'],
            'department': row['department']
        })
    return faces

# Attendance operations
def mark_attendance(student_id, confidence):
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.now()
    current_date = now.strftime('%Y-%m-%d')
    current_time = now.strftime('%Y-%m-%d %H:%M:%S')
    
    try:
        cursor.execute(
            "INSERT INTO attendance (student_id, date, timestamp, confidence) VALUES (?, ?, ?, ?)",
            (student_id, current_date, current_time, confidence)
        )
        conn.commit()
        marked = True
        status = "Attendance marked successfully"
    except sqlite3.IntegrityError:
        marked = False
        status = "Attendance already marked for today"
    finally:
        conn.close()
    return marked, status

def get_attendance_records(date_filter=None, department_filter=None, search_query=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
        SELECT a.id, a.date, a.timestamp, a.confidence, s.name, s.matric_number, s.department
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        WHERE 1=1
    """
    params = []
    
    if date_filter:
        query += " AND a.date = ?"
        params.append(date_filter)
        
    if department_filter:
        query += " AND s.department = ?"
        params.append(department_filter)
        
    if search_query:
        query += " AND (s.name LIKE ? OR s.matric_number LIKE ?)"
        search_val = f"%{search_query}%"
        params.extend([search_val, search_val])
        
    query += " ORDER BY a.timestamp DESC"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

# Unknown detection operations
def log_unknown_face(image_path):
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.now()
    current_time = now.strftime('%Y-%m-%d %H:%M:%S')
    
    cursor.execute(
        "INSERT INTO unknown_detections (image_path, timestamp) VALUES (?, ?)",
        (image_path, current_time)
    )
    conn.commit()
    conn.close()

def get_unknown_detections():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM unknown_detections ORDER BY timestamp DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

# Dashboard Analytics
def get_dashboard_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.now()
    today_date = now.strftime('%Y-%m-%d')
    
    # 1. Total Students
    cursor.execute("SELECT COUNT(*) FROM students")
    total_students = cursor.fetchone()[0]
    
    # 2. Total Present Today
    cursor.execute("SELECT COUNT(*) FROM attendance WHERE date = ?", (today_date,))
    present_today = cursor.fetchone()[0]
    
    # 3. Attendance Rate Today (percentage)
    attendance_rate = 0
    if total_students > 0:
        attendance_rate = round((present_today / total_students) * 100, 2)
        
    # 4. Unknown faces count today
    cursor.execute("SELECT COUNT(*) FROM unknown_detections WHERE timestamp LIKE ?", (f"{today_date}%",))
    unknown_today = cursor.fetchone()[0]
    
    # 5. Daily Attendance Trends for the last 7 days
    # Let's get the counts dynamically
    cursor.execute("""
        SELECT date, COUNT(*) as count 
        FROM attendance 
        GROUP BY date 
        ORDER BY date DESC 
        LIMIT 7
    """)
    daily_trends_raw = cursor.fetchall()
    daily_trends = [{'date': r['date'], 'count': r['count']} for r in reversed(daily_trends_raw)]
    
    # 6. Department wise distribution (Students vs Present Today)
    cursor.execute("""
        SELECT department, COUNT(*) as count 
        FROM students 
        GROUP BY department
    """)
    dept_distribution_raw = cursor.fetchall()
    dept_distribution = []
    
    for row in dept_distribution_raw:
        dept = row['department']
        cursor.execute("""
            SELECT COUNT(*) 
            FROM attendance a
            JOIN students s ON a.student_id = s.id
            WHERE a.date = ? AND s.department = ?
        """, (today_date, dept))
        present = cursor.fetchone()[0]
        dept_distribution.append({
            'department': dept,
            'total': row['count'],
            'present': present
        })
        
    conn.close()
    
    return {
        'total_students': total_students,
        'present_today': present_today,
        'attendance_rate': attendance_rate,
        'unknown_today': unknown_today,
        'daily_trends': daily_trends,
        'department_distribution': dept_distribution
    }
