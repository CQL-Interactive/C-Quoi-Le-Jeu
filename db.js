const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: "./config.env" })

const pool = new Pool({
    user: process.env.user_db,
    host: process.env.host_db,
    database: process.env.database,
    password: process.env.password,
    port: process.env.port_db,
    max: process.env.max,
    idleTimeoutMillis: process.env.idleTimeoutMillis,
    connectionTimeoutMillis: process.env.connectionTimeoutMillis
});

async function initializeDatabase() {
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        const commands = schema
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd && cmd !== 'BEGIN' && cmd !== 'END');
        
        for (const command of commands) {
            try {
                await pool.query(command);
            } catch (error) {
                if (error.code === '42710' || error.code === '42P07') {
                    console.log(`⚠️  ${error.message}`);
                } else {
                    throw error;
                }
            }
        }
        
        console.log('✅ Base de données initialisée avec succès');
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de la base de données :', error);
        throw error;
    }
}

pool.initializeDatabase = initializeDatabase;
module.exports = pool