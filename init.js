const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'users.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        return console.error("Erreur ouverture DB :", err.message);
    }
    console.log("Base SQLite ouverte avec succès.");
});

function createTables() {
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )
        `, (err) => {
            if (err) {
                console.error("Erreur création table users :", err.message);
            } else {
                console.log("Table users créée ou déjà existante.");
            }
        });

        db.run(`
            CREATE TABLE IF NOT EXISTS games_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                game_name TEXT,
                score INTEGER,
                played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `, (err) => {
            if (err) {
                console.error("Erreur création table games_history :", err.message);
            } else {
                console.log("Table games_history créée ou déjà existante.");
            }
        });
    });
}

createTables();

setTimeout(() => {
    db.close((err) => {
        if (err) {
            console.error("Erreur fermeture DB :", err.message);
        } else {
            console.log("Base SQLite fermée.");
        }
    });
}, 1000);
