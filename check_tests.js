const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
    const dbUrl = new URL(process.env.DATABASE_URL);
    const pool = mysql.createPool({
        host: dbUrl.hostname,
        user: dbUrl.username,
        password: dbUrl.password,
        database: dbUrl.pathname.slice(1),
        port: Number(dbUrl.port) || 4000,
        ssl: { rejectUnauthorized: true }
    });

    try {
        const [tests] = await pool.query('SELECT id, title, is_active FROM company_interviews');
        console.log('TESTS:', JSON.stringify(tests, null, 2));
    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await pool.end();
    }
}

check();
