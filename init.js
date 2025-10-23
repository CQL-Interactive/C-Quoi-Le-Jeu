const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'users.db');

console.log('--- CREATION BDD CQLJ ---')

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        return console.error("❌ Erreur ouverture DB :", err.message);
    }
    console.log("🔓 Base SQLite ouverte avec succès.");
});

function createTables() {
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                patch INTEGER NOT NULL DEFAULT 0
            )
        `, (err) => {
            if (err) {
                console.error("❌ Erreur création table users :", err.message);
            } else {
                console.log("✅ Table users créée ou déjà existante.");
            }
        });

        db.run(`
            CREATE TABLE IF NOT EXISTS new_game (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                nom TEXT,
                site TEXT,
                accept INTEGER,
                post_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `, (err) => {
            if (err) {
                console.error("❌ Erreur création table new_game :", err.message);
            } else {
                console.log("✅ Table new_game créée ou déjà existante.");
            }
        });

        db.run(`
            CREATE TABLE IF NOT EXISTS games_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                score INTEGER,
                end_date TIMESTAMP,
                end_lives,
                begin_lives,
                nbGames,
                played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `, (err) => {
            if (err) {
                console.error("❌ Erreur création table games_history :", err.message);
            } else {
                console.log("✅ Table games_history créée ou déjà existante.");
            }
        });

        db.run(`
            CREATE TABLE IF NOT EXISTS users_admin (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                admin_level INTEGER,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `, (err) => {
            if (err) {
                console.error("❌ Erreur création table users_admin :", err.message);
            } else {
                console.log("✅ Table users_admin créée ou déjà existante.");
            }
            setTimeout(() => {
                db.close((err) => {
                    if (err) {
                        console.error("❌ Erreur fermeture DB :", err.message);
                    } else {
                        console.log("🔒 Base SQLite fermée.");
                    }
                });
            }, 500);
        });        
    });
}

setTimeout(() => {
    console.log("⚙️ Chargement...");
}, 1000)
setTimeout(() => {
    createTables();
}, 3000)

