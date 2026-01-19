const { Pool } = require('pg');
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

module.exports = pool