from flask import Flask, jsonify, render_template, request, redirect, url_for, session, flash, g, send_from_directory
import random
import sqlite3
import os
import logging
import bcrypt
from datetime import datetime, timedelta
from functools import wraps

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev_key_123')
app.permanent_session_lifetime = timedelta(days=30)  # Sessions durent 30 jours

DATABASE = 'users.db'
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'username' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

def init_db():
    with app.app_context():
        db = get_db()
        with app.open_resource('schema.sql', mode='r') as f:
            db.cursor().executescript(f.read())
        db.commit()

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def query_db(query, args=(), one=False):
    cur = get_db().execute(query, args)
    rv = cur.fetchall()
    cur.close()
    return (rv[0] if rv else None) if one else rv

def save_user(username, password):
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    db = get_db()
    try:
        db.execute('INSERT INTO users (username, password, created_at) VALUES (?, ?, ?)', 
                  (username, hashed_password, datetime.now()))
        db.commit()
        return True
    except sqlite3.IntegrityError:
        return False

def check_user(username, password):
    user = query_db('SELECT * FROM users WHERE username = ?', [username], one=True)
    if user:
        hashed_password = user['password']
        if isinstance(hashed_password, str):
            hashed_password = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password)
    return False

def get_user_id_by_username(username):
    user = query_db('SELECT id FROM users WHERE username = ?', [username], one=True)
    return user['id'] if user else None

def save_game_result(user_id, game_name, score):
    db = get_db()
    db.execute('''INSERT INTO games_history 
                  (user_id, game_name, score, played_at) 
                  VALUES (?, ?, ?, ?)''',
               (user_id, game_name, score, datetime.now()))
    db.commit()

def get_user_games(user_id):
    return query_db('''SELECT game_name, score, played_at, 
                      (SELECT COUNT(*) + 1 
                       FROM games_history gh2 
                       WHERE gh2.score > gh1.score) as rank
                    FROM games_history gh1 
                    WHERE user_id = ? 
                    ORDER BY played_at DESC 
                    LIMIT 50''', [user_id])

def get_user_stats(user_id):
    stats = query_db('''SELECT 
                        COUNT(*) as total_games,
                        MAX(score) as highest_score,
                        AVG(score) as average_score
                        FROM games_history 
                        WHERE user_id = ?''', [user_id], one=True)
    return stats

def get_leaderboard():
    return query_db('''SELECT u.username, 
                        MAX(gh.score) as best_score,
                        COUNT(*) as games_played,
                        AVG(gh.score) as avg_score
                      FROM users u
                      JOIN games_history gh ON u.id = gh.user_id
                      GROUP BY u.id
                      ORDER BY best_score DESC
                      LIMIT 10''')

full_games_list = [
    {
        "name": "The Legend of Zelda : Tears of the Kingdom",
        "image": "images/IMG_001.webp",
        "answers": [
            "the legend of zelda : tears of the kingdom",
            "the legend of zelda: tears of the kingdom",
            "totk",
            "tears of the kingdom",
            "zelda totk",
            "zelda: totk",
            "zelda : totk"
        ]
    },
    {
        "name": "Pikmin 4",
        "image": "images/IMG_002.webp",
        "answers": [
            "pikmin 4",
            "pikmin4",
            "pikmin"
        ]
    },
    {
        "name": "Minecraft",
        "image": "images/IMG_003.webp",
        "answers": [
            "minecraft",
            "mc"
        ]
    },
    {
        "name": "Mario Kart 8 Deluxe",
        "image": "images/IMG_004.webp",
        "answers": [
            "mario kart 8 deluxe",
            "mk 8 deluxe",
            "mario kart",
            "mk",
            "mk8d",
            "mk 8 d",
            "mk8",
            "mk 8"
        ]
    },
    {
        "name": "Pokémon Rouge et Bleu",
        "image": "images/IMG_005.webp",
        "answers": [
            "pokemon rouge et bleu",
            "pokémon rouge et bleu",
            "pokemon rouge",
            "pokemon bleu",
            "pokemon",
            "pokémon"
        ]
    },
    {
        "name": "GTA 5",
        "image": "images/IMG_006.webp",
        "answers": [
            "grand theft auto 5",
            "grand theft auto V",
            "grand theft auto",
            "gta 5",
            "gta5",
            "gta V",
            "gta"
        ]
    },
    {
        "name": "Slime Rancher",
        "image": "images/IMG_007.webp",
        "answers": [
            "slime rancher",
            "sr"
        ]
    },
    {
        "name": "Spider-Man 2",
        "image": "images/IMG_008.webp",
        "answers": [
            "spider man 2",
            "spider-man 2",
            "spiderman 2",
            "spider man",
            "spider-man",
            "spiderman"
        ]
    },
    {
        "name": "Paper Mario : La Porte Millénaire",
        "image": "images/IMG_009.webp",
        "answers": [
            "paper mario : la porte millénaire",
            "paper mario: la porte millénaire",
            "paper mario"
        ]
    },
    {
        "name": "Clash of Clans",
        "image": "images/IMG_010.webp",
        "answers": [
            "clash of clans",
            "coc"
        ]
    },
    {
        "name": "World of Warcraft",
        "image": "images/IMG_011.webp",
        "answers": [
            "world of warcraft",
            "wow"
        ]
    },
    {
      "name": "League of Legends",
      "image": "images/IMG_012.webp",
      "answers": [
          "league of legends",
          "lol"
        ]
    },
    {
        "name": "Overwatch",
        "image": "images/IMG_013.webp",
        "answers": [
            "overwatch",
            "ow"
        ]
    },
    {
        "name": "Genshin Impact",
        "image": "images/IMG_014.webp",
        "answers": [
            "genshin impact",
            "gi"
        ]
    },
    {
        "name": "Rocket League",
        "image": "images/IMG_015.webp",
        "answers": [
            "rocket league",
            "rl"
        ]
    },
    {
        "name": "Elden Ring",
        "image": "images/IMG_016.webp",
        "answers": [
            "elden ring"
        ]
    },
    {
        "name": "FIFA 21",
        "image": "images/IMG_017.webp",
        "answers": [
            "fifa 21",
            "fifa"
        ]
    },
    {
        "name": "Animal Crossing : New Horizons",
        "image": "images/IMG_018.webp",
        "answers": [
            "animal crossing : new horizons",
            "animal crossing: new horizons",
            "animal crossing new horizons",
            "acnh",
            "animal crossing"
        ]
    },
    {
        "name": "Boomerang Fu",
        "image": "images/IMG_019.webp",
        "answers": [
            "boomerang fu",
            "boomerangfu"
        ]
    },
    {
        "name": "Deltarune",
        "image": "images/IMG_020.webp",
        "answers": [
            "deltarune",
            "delta rune",
            "dtrn",
            "dr"
        ]
    },
    {
        "name": "Hades",
        "image": "images/IMG_021.webp",
        "answers": [
            "hades",
            "hadès"
        ]
    },
    {
        "name": "It Takes Two",
        "image": "images/IMG_022.webp",
        "answers": [
            "it takes two",
            "it takes 2",
            "itt",
            "it2"
        ]
    },
    {
        "name": "Mini Motorways",
        "image": "images/IMG_023.webp",
        "answers": [
            "mini motorways",
            "minimotorways",
            "mmtw",
            "mmw"
        ]
    },
    {
        "name": "Rayman Legends : Definitive Edition",
        "image": "images/IMG_024.webp",
        "answers": [
            "rayman legends : definitive edition",
            "rayman legends: definitive edition",
            "rayman legends",
            "rayman",
            "rlde",
            "rayman definitive edition"
        ]
    },
    {
        "name": "Super Smash Bros. Ultimate",
        "image": "images/IMG_025.webp",
        "answers": [
            "super smash bros. ultimate",
            "super smash bros ultimate",
            "smash bros ultimate",
            "super smash bros",
            "ssbu",
            "ssb"
        ]
    },
    {
        "name": "Splatoon 3",
        "image": "images/IMG_026.webp",
        "answers": [
            "splatoon 3",
            "splatoon3",
            "splatoon"
        ]
    },
    {
        "name": "Undertale",
        "image": "images/IMG_027.webp",
        "answers": [
            "undertale",
            "under tale",
            "udtl",
            "ut"
        ]
    }
]

games = []
current_game_index = 0
lock_file = ".url_opened_lock"
score = 0

def reset_game():
    global current_game_index, score
    current_game_index = 0
    score = 0

@app.route('/')
@login_required
def index():
    return render_template('index.html', 
                         username=session['username'])

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        remember = request.form.get('remember', False)
        
        if check_user(username, password):
            session.permanent = remember
            session['username'] = username
            session['last_activity'] = datetime.now().timestamp()
            return redirect(url_for('index'))
            
        flash("Nom d'utilisateur ou mot de passe incorrect.")
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        email = request.form.get('email', '')

        if len(password) < 6:
            flash("Le mot de passe doit contenir au moins 6 caractères.")
            return render_template('register.html')

        if len(username) > 20:
            flash("Le nom d'utilisateur doit contenir au maximum 20 caractères.")
            return render_template('register.html')

        if not save_user(username, password):
            flash("Nom d'utilisateur déjà existant.")
            return render_template('register.html')

        session['username'] = username
        session['last_activity'] = datetime.now().timestamp()
        return redirect(url_for('index'))

    return render_template('register.html')

@app.route('/logout')
def logout():
    session.clear()
    flash("Vous avez été déconnecté.")
    return redirect(url_for('login'))

@app.route('/leaderboard')
@login_required
def leaderboard():
    leaders = get_leaderboard()
    return render_template('leaderboard.html', leaders=leaders)

@app.route('/profile')
@login_required
def profile():
    user_id = get_user_id_by_username(session['username'])
    stats = get_user_stats(user_id)
    recent_games = get_user_games(user_id)
    return render_template('profile.html', 
                         stats=stats, 
                         recent_games=recent_games)

@app.route('/settings', methods=['GET', 'POST'])
@login_required
def settings():
    if request.method == 'POST':
        new_password = request.form['new_password']
        if len(new_password) < 6:
            flash("Le mot de passe doit contenir au moins 6 caractères.")
            return render_template('settings.html')
            
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
        db = get_db()
        db.execute('UPDATE users SET password = ? WHERE username = ?', 
                  (hashed_password, session['username']))
        db.commit()
        flash("Mot de passe mis à jour avec succès.")
        
    return render_template('settings.html')

@app.route('/delete_account', methods=['POST'])
@login_required
def delete_account():
    password = request.form['password']
    if not check_user(session['username'], password):
        flash("Mot de passe incorrect.")
        return redirect(url_for('settings'))

    db = get_db()
    user_id = get_user_id_by_username(session['username'])
    db.execute('DELETE FROM games_history WHERE user_id = ?', (user_id,))
    db.execute('DELETE FROM users WHERE username = ?', (session['username'],))
    db.commit()
    
    session.clear()
    flash("Votre compte a été supprimé avec succès.")
    return redirect(url_for('login'))

@app.route('/get-game', methods=['GET'])
def get_game():
    global current_game_index
    if current_game_index >= len(games):
        return jsonify({"name": "Finished", "image": ""})
    game = games[current_game_index]
    return jsonify(game)

@app.route('/next-game', methods=['POST'])
def next_game():
    global current_game_index, score
    user_id = get_user_id_by_username(session['username'])
    game = games[current_game_index]
    save_game_result(user_id, game["name"], score)
    current_game_index += 1
    score = 0
    return get_game()

@app.route('/skip-game', methods=['POST'])
def skip_game():
    global current_game_index, score
    score -= 50
    current_game_index += 1
    return get_game()

@app.route('/check-answer', methods=['POST'])
def check_answer():
    global score
    data = request.json
    user_answer = data.get('answer', '').strip().lower()
    game = games[current_game_index]
    is_correct = user_answer in [answer.lower() for answer in game["answers"]]
    if is_correct:
        score += 100
    return jsonify({"is_correct": is_correct})

@app.route('/set-game-count', methods=['POST'])
def set_game_count():
    global games
    data = request.json
    count = int(data.get('count', 10))
    games = random.sample(full_games_list, min(count, len(full_games_list)))
    reset_game()
    return '', 204

@app.route('/delete-lock', methods=['POST'])
def delete_lock():
    if os.path.exists(lock_file):
        os.remove(lock_file)
    return '', 204

@app.route('/reset-game', methods=['POST'])
def reset_game_route():
    reset_game()
    return '', 204

@app.route('/get-games-list', methods=['GET'])
def get_games_list():
    return jsonify(full_games_list)

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.before_request
def check_session_expiry():
    if 'username' in session:
        last_activity = session.get('last_activity', 0)
        now = datetime.now().timestamp()
        
        if now - last_activity > 3600:  # 1 heure
            session.clear()
            flash("Session expirée. Veuillez vous reconnecter.")
            return redirect(url_for('login'))
            
        session['last_activity'] = now

if __name__ == '__main__':
    with app.app_context():
        init_db()
    if not os.path.exists(lock_file):
        open_browser()
    app.run(debug=False, host='0.0.0.0')