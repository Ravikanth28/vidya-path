const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');

async function debug() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mentor_hub'
    });

    try {
        const [tests] = await pool.query('SELECT * FROM company_interviews');
        fs.writeFileSync('db_debug.json', JSON.stringify(tests, null, 2));
        console.log('Results written to db_debug.json');
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

debug();
