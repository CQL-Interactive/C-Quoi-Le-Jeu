// Script pour initialiser la base de données
const pool = require('./db.js');

(async () => {
    try {
        await pool.initializeDatabase();
        console.log('✅ Initialisation terminée. Le serveur peut maintenant être lancé.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Impossible d\'initialiser la base de données :', error);
        process.exit(1);
    }
})();
