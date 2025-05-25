-- Mise à jour du schéma de la base de données
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    games_played INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS games_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    game_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attempts INTEGER DEFAULT 0,
    time_taken INTEGER,  -- en secondes
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    condition_type TEXT NOT NULL,
    condition_value INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS user_achievements (
    user_id INTEGER,
    achievement_id INTEGER,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, achievement_id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements (id) ON DELETE CASCADE
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_games_history_user_id ON games_history(user_id);
CREATE INDEX IF NOT EXISTS idx_games_history_score ON games_history(score DESC);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

-- Insertion des achievements de base
INSERT OR IGNORE INTO achievements (name, description, condition_type, condition_value) VALUES
    ('Débutant', 'Jouer votre première partie', 'games_played', 1),
    ('Amateur', 'Jouer 10 parties', 'games_played', 10),
    ('Expert', 'Jouer 50 parties', 'games_played', 50),
    ('Score parfait', 'Obtenir un score de 1000 points', 'score', 1000),
    ('Maître du jeu', 'Obtenir 5000 points au total', 'total_score', 5000);