const mysql = require('mysql2/promise');
const { URL } = require('url');
const fs = require('fs');
require('dotenv').config();

(async () => {
    try {
        const dbUrl = new URL(process.env.DATABASE_URL);
        const pool = mysql.createPool({
            host: dbUrl.hostname,
            user: dbUrl.username,
            password: dbUrl.password,
            database: dbUrl.pathname.slice(1),
            port: Number(dbUrl.port) || 4000,
            ssl: { rejectUnauthorized: true }
        });

        const [batches] = await pool.query('SELECT * FROM student_batches');
        const [users] = await pool.query('SELECT id, name, email FROM users WHERE role = "student"');

        const output = {
            batches: batches.map(b => ({ ...b, student_ids: JSON.parse(b.student_ids) })),
            users_count: users.length,
            sample_users: users.slice(0, 5)
        };

        fs.writeFileSync('debug_final.json', JSON.stringify(output, null, 2));
        console.log('Done writing debug_final.json');

        await pool.end();
    } catch (e) {
        fs.writeFileSync('debug_error.txt', e.stack);
        console.error(e);
    }
})();
