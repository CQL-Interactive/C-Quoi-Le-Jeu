const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: "./.env" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

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
                await prisma.$executeRawUnsafe(command);
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

prisma.initializeDatabase = initializeDatabase;
module.exports = prisma;