from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token,
    jwt_required, get_jwt_identity
)
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import os
from datetime import datetime

# תיקיית dist של React (נוצרת אחרי npm run build)
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist')

app = Flask(__name__, static_folder=FRONTEND_DIST, static_url_path='')
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'blog-secret-key-2026')
CORS(app)
jwt = JWTManager(app)

DB_PATH = os.path.join(os.path.dirname(__file__), 'blog.db')


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    # טבלת משתמשים
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id       INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    ''')
    # טבלת פוסטים
    conn.execute('''
        CREATE TABLE IF NOT EXISTS posts (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            title      TEXT NOT NULL,
            content    TEXT NOT NULL,
            author_id  INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (author_id) REFERENCES users(id)
        )
    ''')
    conn.commit()
    conn.close()


# קריאה ל-init_db בטעינת המודול — עובד גם עם gunicorn
init_db()


# ─── Auth ────────────────────────────────────────────────

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return jsonify({'error': 'שם משתמש וסיסמה הם שדות חובה'}), 400
    if len(password) < 4:
        return jsonify({'error': 'הסיסמה חייבת להכיל לפחות 4 תווים'}), 400

    conn = get_db()
    existing = conn.execute(
        'SELECT id FROM users WHERE username = ?', (username,)
    ).fetchone()

    if existing:
        conn.close()
        return jsonify({'error': 'שם המשתמש כבר תפוס'}), 409

    hashed = generate_password_hash(password)
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    conn.execute(
        'INSERT INTO users (username, password, created_at) VALUES (?, ?, ?)',
        (username, hashed, now)
    )
    conn.commit()
    conn.close()

    token = create_access_token(identity=username)
    return jsonify({'token': token, 'username': username}), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    conn = get_db()
    user = conn.execute(
        'SELECT * FROM users WHERE username = ?', (username,)
    ).fetchone()
    conn.close()

    if not user or not check_password_hash(user['password'], password):
        return jsonify({'error': 'שם משתמש או סיסמה שגויים'}), 401

    token = create_access_token(identity=username)
    return jsonify({'token': token, 'username': username})


# ─── Posts ───────────────────────────────────────────────

@app.route('/api/posts', methods=['GET'])
def get_posts():
    """כל הפוסטים — ציבורי, לא צריך התחברות"""
    conn = get_db()
    posts = conn.execute('''
        SELECT posts.*, users.username as author
        FROM posts
        JOIN users ON posts.author_id = users.id
        ORDER BY posts.created_at DESC
    ''').fetchall()
    conn.close()
    return jsonify([dict(p) for p in posts])


@app.route('/api/posts/<int:post_id>', methods=['GET'])
def get_post(post_id):
    conn = get_db()
    post = conn.execute('''
        SELECT posts.*, users.username as author
        FROM posts
        JOIN users ON posts.author_id = users.id
        WHERE posts.id = ?
    ''', (post_id,)).fetchone()
    conn.close()

    if not post:
        return jsonify({'error': 'פוסט לא נמצא'}), 404
    return jsonify(dict(post))


@app.route('/api/posts', methods=['POST'])
@jwt_required()   # ← רק משתמש מחובר יכול ליצור פוסט!
def create_post():
    username = get_jwt_identity()
    data = request.get_json()

    title   = data.get('title', '').strip()
    content = data.get('content', '').strip()

    if not title or not content:
        return jsonify({'error': 'כותרת ותוכן הם שדות חובה'}), 400

    conn = get_db()
    user = conn.execute(
        'SELECT id FROM users WHERE username = ?', (username,)
    ).fetchone()

    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    cursor = conn.execute(
        'INSERT INTO posts (title, content, author_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        (title, content, user['id'], now, now)
    )
    conn.commit()

    post = conn.execute('''
        SELECT posts.*, users.username as author
        FROM posts JOIN users ON posts.author_id = users.id
        WHERE posts.id = ?
    ''', (cursor.lastrowid,)).fetchone()
    conn.close()

    return jsonify(dict(post)), 201


@app.route('/api/posts/<int:post_id>', methods=['PUT'])
@jwt_required()
def update_post(post_id):
    username = get_jwt_identity()
    conn = get_db()

    post = conn.execute(
        'SELECT posts.*, users.username as author FROM posts JOIN users ON posts.author_id = users.id WHERE posts.id = ?',
        (post_id,)
    ).fetchone()

    if not post:
        conn.close()
        return jsonify({'error': 'פוסט לא נמצא'}), 404
    if post['author'] != username:
        conn.close()
        return jsonify({'error': 'אין הרשאה לערוך פוסט זה'}), 403

    data = request.get_json()
    title   = data.get('title', post['title']).strip()
    content = data.get('content', post['content']).strip()
    now     = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    conn.execute(
        'UPDATE posts SET title=?, content=?, updated_at=? WHERE id=?',
        (title, content, now, post_id)
    )
    conn.commit()

    updated = conn.execute('''
        SELECT posts.*, users.username as author
        FROM posts JOIN users ON posts.author_id = users.id
        WHERE posts.id = ?
    ''', (post_id,)).fetchone()
    conn.close()

    return jsonify(dict(updated))


@app.route('/api/posts/<int:post_id>', methods=['DELETE'])
@jwt_required()
def delete_post(post_id):
    username = get_jwt_identity()
    conn = get_db()

    post = conn.execute(
        'SELECT posts.*, users.username as author FROM posts JOIN users ON posts.author_id = users.id WHERE posts.id = ?',
        (post_id,)
    ).fetchone()

    if not post:
        conn.close()
        return jsonify({'error': 'פוסט לא נמצא'}), 404
    if post['author'] != username:
        conn.close()
        return jsonify({'error': 'אין הרשאה למחוק פוסט זה'}), 403

    conn.execute('DELETE FROM posts WHERE id = ?', (post_id,))
    conn.commit()
    conn.close()

    return jsonify({'message': 'הפוסט נמחק'})


# ─── הגשת React ──────────────────────────────────────────

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    """מגיש את קבצי React לכל URL שאינו API"""
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')


if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PORT', 5002))
    print(f"שרת הבלוג פועל על http://localhost:{port}")
    app.run(debug=False, port=port, host='0.0.0.0')
