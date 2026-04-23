#!/usr/bin/env python3
"""
Fit2BU Backend — Flask + SQLite
Run: python app.py
"""
import sqlite3, os, hashlib, hmac, base64, json, time, datetime
from flask import Flask, request, jsonify, g
from flask_cors import CORS
import bcrypt, jwt as pyjwt

app = Flask(__name__)
CORS(app, origins="*")

DB_PATH = os.path.join(os.path.dirname(__file__), 'fit2bu.db')
JWT_SECRET = 'fit2bu_secret_key_2026'

# ── DB helpers ────────────────────────────────────────────────────────────────
def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
        g.db.execute("PRAGMA journal_mode = WAL")
    return g.db

@app.teardown_appcontext
def close_db(e=None):
    db = g.pop('db', None)
    if db: db.close()

def query(sql, args=(), one=False):
    cur = get_db().execute(sql, args)
    rv = cur.fetchall()
    return (rv[0] if rv else None) if one else rv

def execute(sql, args=()):
    db = get_db()
    cur = db.execute(sql, args)
    db.commit()
    return cur

def row_to_dict(row):
    return dict(row) if row else None

def rows_to_list(rows):
    return [dict(r) for r in rows]

# ── Auth helper ───────────────────────────────────────────────────────────────
def require_auth():
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return None, jsonify({'error': 'No token provided'}), 401
    token = auth.split(' ', 1)[1]
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return payload, None, None
    except pyjwt.ExpiredSignatureError:
        return None, jsonify({'error': 'Token expired'}), 401
    except Exception:
        return None, jsonify({'error': 'Invalid token'}), 401

# ── DB init + seed ────────────────────────────────────────────────────────────
def init_db():
    db = sqlite3.connect(DB_PATH)
    db.execute("PRAGMA foreign_keys = ON")
    db.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            display_name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            activity_type TEXT NOT NULL,
            description TEXT,
            location TEXT NOT NULL,
            start_time DATETIME NOT NULL,
            end_time DATETIME NOT NULL,
            max_capacity INTEGER NOT NULL,
            current_count INTEGER DEFAULT 0,
            organizer_id INTEGER NOT NULL,
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (organizer_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS roster_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(session_id, user_id),
            FOREIGN KEY (session_id) REFERENCES sessions(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS waitlist_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            position INTEGER NOT NULL,
            added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(session_id, user_id),
            FOREIGN KEY (session_id) REFERENCES sessions(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS workout_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            notes TEXT,
            logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS workout_sets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            log_id INTEGER NOT NULL,
            exercise_name TEXT NOT NULL,
            set_number INTEGER NOT NULL,
            reps INTEGER,
            weight REAL,
            duration INTEGER,
            FOREIGN KEY (log_id) REFERENCES workout_logs(id) ON DELETE CASCADE
        );
    """)

    # Seed only if empty
    count = db.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    if count == 0:
        def hash_pw(pw): return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()
        pw = hash_pw('Password1!')

        cur = db.execute("INSERT INTO users (email, display_name, password_hash) VALUES (?,?,?)", ('testuser@bu.edu', 'Alex Johnson', pw))
        u1 = cur.lastrowid
        cur = db.execute("INSERT INTO users (email, display_name, password_hash) VALUES (?,?,?)", ('testuser2@bu.edu', 'Sam Rivera', pw))
        u2 = cur.lastrowid
        cur = db.execute("INSERT INTO users (email, display_name, password_hash) VALUES (?,?,?)", ('organizer@bu.edu', 'Coach Mike', pw))
        org = cur.lastrowid
        cur = db.execute("INSERT INTO users (email, display_name, password_hash) VALUES (?,?,?)", ('waitlistuser@bu.edu', 'Jordan Lee', pw))
        u4 = cur.lastrowid

        def future(days, hour, minute=0):
            dt = datetime.datetime.now() + datetime.timedelta(days=days)
            dt = dt.replace(hour=hour, minute=minute, second=0, microsecond=0)
            return dt.isoformat()

        sessions_data = [
            ('Pickup Basketball', 'Courts', 'Basketball', 'Casual pickup basketball game. All skill levels welcome. Bring your own water bottle.', 'FitRec Court 2', future(1,18), future(1,20), 10, 0),
            ('3v3 Basketball', 'Courts', 'Basketball', 'Competitive 3v3 tournament style. Teams of 3.', 'FitRec Court 1', future(2,17), future(2,19), 6, 0),
            ('Swim Lanes', 'Pool', 'Swimming', 'Open swim lanes for lap swimming. All paces welcome.', 'FitRec Pool', future(1,7), future(1,9), 8, 0),
            ('Weightlifting Session', 'Training', 'Weightlifting', 'Group weightlifting session. Spotter pairs encouraged.', 'FitRec Gym Floor 3', future(1,17,30), future(1,19), 12, 0),
            ('Morning Run Club', 'Training', 'Running', 'Easy 5K run around campus. Meet at FitRec entrance.', 'FitRec Entrance', future(2,7), future(2,8), 20, 0),
            ('Yoga Flow', 'Classes', 'Yoga', 'Beginner-friendly yoga flow. Mats provided.', 'FitRec Studio A', future(3,9), future(3,10), 15, 0),
            ('HIIT Cardio', 'Classes', 'Cardio', 'High-intensity interval training. Be ready to sweat.', 'FitRec Studio B', future(3,18), future(3,19), 10, 0),
            ('Tennis Doubles', 'Courts', 'Tennis', 'Doubles match, intermediate level.', 'FitRec Tennis Court', future(2,16), future(2,18), 2, 2),
        ]
        for s in sessions_data:
            cur = db.execute(
                "INSERT INTO sessions (title,category,activity_type,description,location,start_time,end_time,max_capacity,current_count,organizer_id) VALUES (?,?,?,?,?,?,?,?,?,?)",
                (*s, org)
            )
            if s[0] == 'Tennis Doubles':
                sid = cur.lastrowid
                db.execute("INSERT INTO roster_entries (session_id, user_id) VALUES (?,?)", (sid, u1))
                db.execute("INSERT INTO roster_entries (session_id, user_id) VALUES (?,?)", (sid, u2))

        db.commit()
        print("✅ Database seeded")

    db.close()
    print("✅ Database ready")

# ── AUTH ROUTES ───────────────────────────────────────────────────────────────
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    email = (data.get('email') or '').strip().lower()
    display_name = (data.get('display_name') or '').strip()
    password = data.get('password') or ''

    if not email or not display_name or not password:
        return jsonify({'error': 'All fields are required'}), 400
    if not email.endswith('@bu.edu'):
        return jsonify({'error': 'Please use a valid BU email address (e.g., user@bu.edu)'}), 400
    if len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400

    existing = query("SELECT id FROM users WHERE email=?", (email,), one=True)
    if existing:
        return jsonify({'error': 'An account with this email already exists'}), 409

    pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    cur = execute("INSERT INTO users (email, display_name, password_hash) VALUES (?,?,?)", (email, display_name, pw_hash))
    uid = cur.lastrowid
    token = pyjwt.encode({'id': uid, 'email': email, 'display_name': display_name, 'exp': time.time() + 86400}, JWT_SECRET, algorithm='HS256')
    return jsonify({'token': token, 'user': {'id': uid, 'email': email, 'display_name': display_name}})

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = query("SELECT * FROM users WHERE email=?", (email,), one=True)
    if not user or not bcrypt.checkpw(password.encode(), user['password_hash'].encode()):
        return jsonify({'error': 'Invalid email or password'}), 401

    token = pyjwt.encode({'id': user['id'], 'email': user['email'], 'display_name': user['display_name'], 'exp': time.time() + 86400}, JWT_SECRET, algorithm='HS256')
    return jsonify({'token': token, 'user': {'id': user['id'], 'email': user['email'], 'display_name': user['display_name']}})

# ── SESSION ROUTES ────────────────────────────────────────────────────────────
@app.route('/api/sessions', methods=['GET'])
def get_sessions():
    user, err, code = require_auth()
    if err: return err, code

    category = request.args.get('category')
    time_filter = request.args.get('time_filter')

    sql = """
        SELECT s.*, u.display_name as organizer_name,
            (SELECT COUNT(*) FROM roster_entries WHERE session_id=s.id) as roster_count
        FROM sessions s JOIN users u ON s.organizer_id=u.id
        WHERE s.status='active' AND s.start_time > datetime('now')
    """
    args = []
    if category and category != 'All':
        sql += " AND s.category=?"; args.append(category)
    if time_filter == 'morning':
        sql += " AND time(s.start_time)>='06:00' AND time(s.start_time)<'12:00'"
    elif time_filter == 'afternoon':
        sql += " AND time(s.start_time)>='12:00' AND time(s.start_time)<'17:00'"
    elif time_filter == 'evening':
        sql += " AND time(s.start_time)>='17:00' AND time(s.start_time)<'22:00'"
    sql += " ORDER BY s.start_time ASC"

    return jsonify(rows_to_list(query(sql, args)))

@app.route('/api/sessions', methods=['POST'])
def create_session():
    user, err, code = require_auth()
    if err: return err, code
    data = request.get_json()
    title = (data.get('title') or '').strip()
    category = (data.get('category') or '').strip()
    activity_type = (data.get('activity_type') or '').strip()
    description = (data.get('description') or '').strip()
    location = (data.get('location') or '').strip()
    start_time = (data.get('start_time') or '').strip()
    end_time = (data.get('end_time') or '').strip()
    max_capacity = data.get('max_capacity')

    if not all([title, category, activity_type, location, start_time, end_time, max_capacity]):
        return jsonify({'error': 'All fields are required'}), 400
    if category not in ('Courts', 'Pool', 'Training', 'Classes'):
        return jsonify({'error': 'Invalid category'}), 400
    try:
        max_capacity = int(max_capacity)
        if max_capacity < 1 or max_capacity > 500:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({'error': 'Max capacity must be between 1 and 500'}), 400
    try:
        datetime.datetime.fromisoformat(start_time)
        datetime.datetime.fromisoformat(end_time)
    except ValueError:
        return jsonify({'error': 'Invalid date/time format'}), 400
    if end_time <= start_time:
        return jsonify({'error': 'End time must be after start time'}), 400

    cur = execute(
        "INSERT INTO sessions (title, category, activity_type, description, location, start_time, end_time, max_capacity, current_count, organizer_id, status) VALUES (?,?,?,?,?,?,?,?,0,?,'active')",
        (title, category, activity_type, description, location, start_time, end_time, max_capacity, user['id'])
    )
    return jsonify({'id': cur.lastrowid, 'message': 'Session created.'}), 201

@app.route('/api/sessions/my', methods=['GET'])
def my_sessions():
    user, err, code = require_auth()
    if err: return err, code
    uid = user['id']

    joined = rows_to_list(query(
        "SELECT s.*, u.display_name as organizer_name FROM sessions s JOIN users u ON s.organizer_id=u.id JOIN roster_entries r ON r.session_id=s.id WHERE r.user_id=? ORDER BY s.start_time",
        (uid,)
    ))
    organised = rows_to_list(query(
        "SELECT s.*, u.display_name as organizer_name FROM sessions s JOIN users u ON s.organizer_id=u.id WHERE s.organizer_id=? ORDER BY s.start_time",
        (uid,)
    ))
    waitlisted = rows_to_list(query(
        "SELECT s.*, u.display_name as organizer_name, w.position as waitlist_position FROM sessions s JOIN users u ON s.organizer_id=u.id JOIN waitlist_entries w ON w.session_id=s.id WHERE w.user_id=? ORDER BY s.start_time",
        (uid,)
    ))
    return jsonify({'joined': joined, 'organised': organised, 'waitlisted': waitlisted})

@app.route('/api/sessions/<int:sid>/cancel', methods=['POST'])
def cancel_session(sid):
    user, err, code = require_auth()
    if err: return err, code
    session = query("SELECT * FROM sessions WHERE id=?", (sid,), one=True)
    if not session: return jsonify({'error': 'Session not found'}), 404
    if session['organizer_id'] != user['id']:
        return jsonify({'error': 'Only the organizer can cancel this session'}), 403
    execute("UPDATE sessions SET status='cancelled' WHERE id=?", (sid,))
    return jsonify({'message': 'Session cancelled.'})

@app.route('/api/sessions/<int:sid>', methods=['GET'])
def get_session(sid):
    user, err, code = require_auth()
    if err: return err, code

    session = query("SELECT s.*, u.display_name as organizer_name FROM sessions s JOIN users u ON s.organizer_id=u.id WHERE s.id=?", (sid,), one=True)
    if not session: return jsonify({'error': 'Session not found'}), 404

    roster = rows_to_list(query("SELECT u.display_name, re.joined_at FROM roster_entries re JOIN users u ON re.user_id=u.id WHERE re.session_id=? ORDER BY re.joined_at", (sid,)))
    waitlist = rows_to_list(query("SELECT u.display_name, we.position, we.added_at FROM waitlist_entries we JOIN users u ON we.user_id=u.id WHERE we.session_id=? ORDER BY we.position", (sid,)))

    on_roster = query("SELECT id FROM roster_entries WHERE session_id=? AND user_id=?", (sid, user['id']), one=True)
    on_waitlist = query("SELECT position FROM waitlist_entries WHERE session_id=? AND user_id=?", (sid, user['id']), one=True)

    result = dict(session)
    result['roster'] = roster
    result['waitlist'] = waitlist
    result['user_on_roster'] = bool(on_roster)
    result['user_on_waitlist'] = on_waitlist['position'] if on_waitlist else None
    return jsonify(result)

@app.route('/api/sessions/<int:sid>/join', methods=['POST'])
def join_session(sid):
    user, err, code = require_auth()
    if err: return err, code
    uid = user['id']

    session = query("SELECT * FROM sessions WHERE id=? AND status='active'", (sid,), one=True)
    if not session: return jsonify({'error': 'Session not found or cancelled'}), 404

    if query("SELECT id FROM roster_entries WHERE session_id=? AND user_id=?", (sid, uid), one=True):
        return jsonify({'error': 'You are already joined to this session'}), 409
    if query("SELECT id FROM waitlist_entries WHERE session_id=? AND user_id=?", (sid, uid), one=True):
        return jsonify({'error': 'You are already on the waitlist for this session'}), 409

    count = query("SELECT COUNT(*) as c FROM roster_entries WHERE session_id=?", (sid,), one=True)['c']

    if count < session['max_capacity']:
        execute("INSERT INTO roster_entries (session_id, user_id) VALUES (?,?)", (sid, uid))
        execute("UPDATE sessions SET current_count=current_count+1 WHERE id=?", (sid,))
        return jsonify({'status': 'joined', 'message': 'You have joined successfully.'})
    else:
        max_pos = query("SELECT MAX(position) as m FROM waitlist_entries WHERE session_id=?", (sid,), one=True)['m'] or 0
        pos = max_pos + 1
        execute("INSERT INTO waitlist_entries (session_id, user_id, position) VALUES (?,?,?)", (sid, uid, pos))
        return jsonify({'status': 'waitlisted', 'position': pos, 'message': f'Session full. You are #{pos} on the waitlist.'})

@app.route('/api/sessions/<int:sid>/leave', methods=['POST'])
def leave_session(sid):
    user, err, code = require_auth()
    if err: return err, code
    uid = user['id']

    on_roster = query("SELECT id FROM roster_entries WHERE session_id=? AND user_id=?", (sid, uid), one=True)
    if on_roster:
        execute("DELETE FROM roster_entries WHERE session_id=? AND user_id=?", (sid, uid))
        execute("UPDATE sessions SET current_count=MAX(0,current_count-1) WHERE id=?", (sid,))

        first = query("SELECT * FROM waitlist_entries WHERE session_id=? ORDER BY position ASC LIMIT 1", (sid,), one=True)
        if first:
            execute("INSERT INTO roster_entries (session_id, user_id) VALUES (?,?)", (sid, first['user_id']))
            execute("UPDATE sessions SET current_count=current_count+1 WHERE id=?", (sid,))
            execute("DELETE FROM waitlist_entries WHERE id=?", (first['id'],))
            remaining = query("SELECT id FROM waitlist_entries WHERE session_id=? ORDER BY position ASC", (sid,))
            for i, w in enumerate(remaining):
                execute("UPDATE waitlist_entries SET position=? WHERE id=?", (i+1, w['id']))
            return jsonify({'status': 'left', 'promoted': True, 'message': 'You left the session. The first waitlisted user has been promoted.'})
        return jsonify({'status': 'left', 'promoted': False, 'message': 'You have left the session.'})

    on_waitlist = query("SELECT position FROM waitlist_entries WHERE session_id=? AND user_id=?", (sid, uid), one=True)
    if on_waitlist:
        leaving_pos = on_waitlist['position']
        execute("DELETE FROM waitlist_entries WHERE session_id=? AND user_id=?", (sid, uid))
        execute("UPDATE waitlist_entries SET position=position-1 WHERE session_id=? AND position>?", (sid, leaving_pos))
        return jsonify({'status': 'left_waitlist', 'message': 'You have left the waitlist.'})

    return jsonify({'error': 'You are not on the roster or waitlist for this session'}), 400

# ── WORKOUT ROUTES ────────────────────────────────────────────────────────────
@app.route('/api/workouts/stats', methods=['GET'])
def workout_stats():
    user, err, code = require_auth()
    if err: return err, code
    uid = user['id']

    total = query("SELECT COUNT(*) as c FROM workout_logs WHERE user_id=? AND logged_at>=datetime('now','-30 days')", (uid,), one=True)['c']
    weekly = rows_to_list(query("SELECT strftime('%w',logged_at) as day_of_week, COUNT(*) as count FROM workout_logs WHERE user_id=? AND logged_at>=datetime('now','-7 days') GROUP BY day_of_week", (uid,)))

    daily = query("SELECT DISTINCT date(logged_at) as workout_date FROM workout_logs WHERE user_id=? ORDER BY workout_date DESC", (uid,))
    streak = 0
    check = datetime.date.today()
    for row in daily:
        if row['workout_date'] == str(check):
            streak += 1
            check -= datetime.timedelta(days=1)
        else:
            break

    return jsonify({'total_workouts': total, 'streak': streak, 'weekly_data': weekly})

@app.route('/api/workouts', methods=['GET'])
def get_workouts():
    user, err, code = require_auth()
    if err: return err, code
    logs = rows_to_list(query("SELECT * FROM workout_logs WHERE user_id=? ORDER BY logged_at DESC", (user['id'],)))
    for log in logs:
        log['sets'] = rows_to_list(query("SELECT * FROM workout_sets WHERE log_id=? ORDER BY exercise_name, set_number", (log['id'],)))
    return jsonify(logs)

@app.route('/api/workouts', methods=['POST'])
def save_workout():
    user, err, code = require_auth()
    if err: return err, code

    data = request.get_json()
    title = (data.get('title') or '').strip()
    notes = data.get('notes') or ''
    exercises = data.get('exercises') or []

    if not title: return jsonify({'error': 'Workout title is required'}), 400
    if not exercises: return jsonify({'error': 'At least one exercise is required'}), 400

    for ex in exercises:
        if not (ex.get('exercise_name') or '').strip():
            return jsonify({'error': 'Exercise name is required for all entries'}), 400
        for s in ex.get('sets', []):
            w = s.get('weight')
            if w not in (None, ''):
                try:
                    wf = float(w)
                    if wf < 0: return jsonify({'error': f"Invalid weight for {ex['exercise_name']}"}), 400
                    if wf > 2000: return jsonify({'error': f"Weight value seems unreasonably high for {ex['exercise_name']}. Please check your entry."}), 400
                except ValueError:
                    return jsonify({'error': f"Invalid weight for {ex['exercise_name']}"}), 400
            r = s.get('reps')
            if r not in (None, ''):
                try:
                    ri = int(r)
                    if ri < 0 or ri > 10000: return jsonify({'error': f"Invalid reps for {ex['exercise_name']}"}), 400
                except ValueError:
                    return jsonify({'error': f"Invalid reps for {ex['exercise_name']}"}), 400

    cur = execute("INSERT INTO workout_logs (user_id, title, notes) VALUES (?,?,?)", (user['id'], title, notes))
    log_id = cur.lastrowid
    for ex in exercises:
        for i, s in enumerate(ex.get('sets', [])):
            execute("INSERT INTO workout_sets (log_id, exercise_name, set_number, reps, weight, duration) VALUES (?,?,?,?,?,?)",
                (log_id, ex['exercise_name'].strip(), i+1, s.get('reps') or None, s.get('weight') or None, s.get('duration') or None))

    return jsonify({'id': log_id, 'message': 'Workout saved.'})

@app.route('/api/workouts/<int:wid>', methods=['DELETE'])
def delete_workout(wid):
    user, err, code = require_auth()
    if err: return err, code
    log = query("SELECT id FROM workout_logs WHERE id=? AND user_id=?", (wid, user['id']), one=True)
    if not log: return jsonify({'error': 'Workout not found'}), 404
    execute("DELETE FROM workout_logs WHERE id=?", (wid,))
    return jsonify({'message': 'Workout deleted.'})

@app.route('/api/health')
def health(): return jsonify({'status': 'ok', 'app': 'Fit2BU'})

init_db()

if __name__ == '__main__':
    print("\n🏋️  Fit2BU backend running on http://localhost:3001")
    print("   Seed accounts: testuser@bu.edu / Password1!")
    print("                  organizer@bu.edu / Password1!\n")
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 3001)), debug=False)
