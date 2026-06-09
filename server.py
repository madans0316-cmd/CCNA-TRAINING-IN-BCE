import os
import sqlite3
from datetime import datetime
from flask import Flask, request, jsonify, g

app = Flask(__name__, static_folder='.', static_url_path='')

# Configuration
DATABASE = 'database.db'
MENTOR_USER = 'deepak.bce'
MENTOR_PASS = 'ccna2026'

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    with app.app_context():
        db = get_db()
        cursor = db.cursor()
        
        # Create Registrations Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS registrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                reg_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT NOT NULL,
                role TEXT NOT NULL,
                college TEXT NOT NULL,
                department TEXT NOT NULL,
                payment_status TEXT NOT NULL DEFAULT 'Unpaid',
                payment_method TEXT,
                timestamp TEXT NOT NULL
            )
        ''')
        
        # Create Inquiries Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS inquiries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                message TEXT NOT NULL,
                timestamp TEXT NOT NULL
            )
        ''')
        
        db.commit()

def seed_mock_data(db):
    cursor = db.cursor()
    print("Database empty. Seeding mock registrations and inquiries...")
    
    mock_regs = [
        ("BCE-CCNA-34982", "Rahul Sharma", "rahul.s@gmail.com", "9876543210", "student", "Bahubali College of Engineering", "ECE", "Paid", "card", "2026-06-08T10:15:30Z"),
        ("BCE-CCNA-78210", "Priya Patel", "priya.patel@yahoo.com", "8765432109", "student", "BCE Shravanabelagola", "CSE", "Paid", "upi", "2026-06-08T12:44:12Z"),
        ("BCE-CCNA-12098", "Prof. Amit Verma", "averma.ece@bce.edu", "7654321098", "faculty", "Bahubali College of Engineering", "ECE", "Paid", "banking", "2026-06-08T14:20:00Z"),
        ("BCE-CCNA-98421", "Vikram Gowda", "vikram.g@outlook.com", "9543210987", "jobseeker", "Visvesvaraya Tech University", "ISE", "Unpaid", None, "2026-06-08T15:02:18Z")
    ]
    
    cursor.executemany('''
        INSERT INTO registrations (reg_id, name, email, phone, role, college, department, payment_status, payment_method, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', mock_regs)
    
    mock_inquiries = [
        ("Suresh Kumar", "suresh.k@gmail.com", "Is hostel accommodation available at BCE for outstation students during the training?", "2026-06-08T11:05:00Z"),
        ("Divya H.R.", "divya.hr@gmail.com", "Can you please share details on placement drives after getting this CCNA certification?", "2026-06-08T13:30:45Z")
    ]
    
    cursor.executemany('''
        INSERT INTO inquiries (name, email, message, timestamp)
        VALUES (?, ?, ?, ?)
    ''', mock_inquiries)
    
    db.commit()

# --- Serve Frontend Routes ---

@app.route('/')
def index():
    return app.send_static_file('index.html')

# --- CORS preflight options & response headers ---

@app.before_request
def handle_options():
    if request.method == 'OPTIONS':
        response = jsonify({"success": True})
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
        response.headers['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS'
        return response

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS'
    return response

# --- Public API Routes ---

@app.route('/api/register', methods=['POST'])
def api_register():
    data = request.json
    if not data:
        return jsonify({"success": False, "error": "Invalid request body"}), 400
        
    try:
        db = get_db()
        cursor = db.cursor()
        
        reg_id = data.get('reg_id')
        name = data.get('name')
        email = data.get('email')
        phone = data.get('phone')
        role = data.get('role')
        college = data.get('college')
        department = data.get('department')
        timestamp = datetime.utcnow().isoformat() + 'Z'
        
        # Check duplicate email, name, or phone number
        cursor.execute("SELECT COUNT(*) FROM registrations WHERE email = ? OR name = ? OR phone = ?", (email, name, phone))
        if cursor.fetchone()[0] > 0:
            return jsonify({"success": False, "error": "This email, name, or mobile number is already registered. Please sign in to proceed.", "code": "DUPLICATE_EMAIL"}), 409
            
        cursor.execute('''
            INSERT INTO registrations (reg_id, name, email, phone, role, college, department, payment_status, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Unpaid', ?)
        ''', (reg_id, name, email, phone, role, college, department, timestamp))
        
        db.commit()
        return jsonify({"success": True, "reg_id": reg_id})
    except sqlite3.IntegrityError:
        return jsonify({"success": False, "error": "Registration ID conflict"}), 409
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/pay', methods=['POST'])
def api_pay():
    data = request.json
    if not data:
        return jsonify({"success": False, "error": "Invalid payload"}), 400
        
    reg_id = data.get('reg_id')
    payment_method = data.get('payment_method')
    
    if not reg_id or not payment_method:
        return jsonify({"success": False, "error": "Missing parameters"}), 400

    # Enforce UPI-only payment options permanently
    if payment_method != 'upi':
        return jsonify({"success": False, "error": "Only UPI payment option is available."}), 400
        
    try:
        db = get_db()
        cursor = db.cursor()
        
        cursor.execute('''
            UPDATE registrations
            SET payment_status = 'Paid', payment_method = ?
            WHERE reg_id = ?
        ''', (payment_method, reg_id))
        
        db.commit()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/student/login', methods=['POST'])
def api_student_login():
    data = request.json
    if not data:
        return jsonify({"success": False, "error": "Invalid payload"}), 400
        
    email = data.get('email')
    phone = data.get('phone')
    
    if not email or not phone:
        return jsonify({"success": False, "error": "Missing parameters"}), 400
        
    try:
        db = get_db()
        cursor = db.cursor()
        
        cursor.execute('''
            SELECT reg_id, name, email, phone, role, college, department, payment_status, payment_method, timestamp
            FROM registrations
            WHERE email = ? AND phone = ?
        ''', (email, phone))
        
        row = cursor.fetchone()
        if row:
            return jsonify({
                "success": True,
                "reg_id": row['reg_id'],
                "name": row['name'],
                "email": row['email'],
                "phone": row['phone'],
                "role": row['role'],
                "college": row['college'],
                "department": row['department'],
                "payment_status": row['payment_status'],
                "payment_method": row['payment_method'],
                "timestamp": row['timestamp']
            })
        else:
            return jsonify({"success": False, "error": "No registration found with this email and mobile number combination."}), 401
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/inquiry', methods=['POST'])
def api_inquiry():
    data = request.json
    if not data:
        return jsonify({"success": False, "error": "Invalid payload"}), 400
        
    try:
        db = get_db()
        cursor = db.cursor()
        
        name = data.get('name')
        email = data.get('email')
        message = data.get('message')
        timestamp = datetime.utcnow().isoformat() + 'Z'
        
        cursor.execute('''
            INSERT INTO inquiries (name, email, message, timestamp)
            VALUES (?, ?, ?, ?)
        ''', (name, email, message, timestamp))
        
        db.commit()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# --- Secure Mentor Dashboard API Routes ---

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.json
    if not data:
        return jsonify({"success": False, "error": "Invalid payload"}), 400
        
    username = data.get('username')
    password = data.get('password')
    
    if username == MENTOR_USER and password == MENTOR_PASS:
        # Simplistic authorization response - returning a token mock
        return jsonify({"success": True, "token": "BCE-DEEPAK-ADMIN-SECURE-KEY"})
    else:
        return jsonify({"success": False, "error": "Invalid username or password"}), 401

def check_auth():
    auth_header = request.headers.get('Authorization')
    return auth_header == "Bearer BCE-DEEPAK-ADMIN-SECURE-KEY"

@app.route('/api/mentor/stats', methods=['GET'])
def api_mentor_stats():
    if not check_auth():
        return jsonify({"error": "Unauthorized Access"}), 401
        
    try:
        db = get_db()
        cursor = db.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM registrations")
        registered = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM registrations WHERE payment_status = 'Paid'")
        paid = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM registrations WHERE payment_status = 'Unpaid'")
        unpaid = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM inquiries")
        inquiries = cursor.fetchone()[0]
        
        return jsonify({
            "registered": registered,
            "paid": paid,
            "unpaid": unpaid,
            "inquiries": inquiries
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/mentor/data', methods=['GET'])
def api_mentor_data():
    if not check_auth():
        return jsonify({"error": "Unauthorized Access"}), 401
        
    try:
        db = get_db()
        cursor = db.cursor()
        
        # Get Registrations
        cursor.execute("SELECT reg_id, name, email, phone, role, college, department, payment_status, payment_method, timestamp FROM registrations ORDER BY id DESC")
        regs = [dict(row) for row in cursor.fetchall()]
        
        # Get Inquiries
        cursor.execute("SELECT name, email, message, timestamp FROM inquiries ORDER BY id DESC")
        inquiries = [dict(row) for row in cursor.fetchall()]
        
        return jsonify({
            "registrations": regs,
            "inquiries": inquiries
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Initialize Server
if __name__ == '__main__':
    init_db()
    print("Bahubali College of Engineering - CCNA Training Server Started.")
    print("Serving on http://127.0.0.1:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
