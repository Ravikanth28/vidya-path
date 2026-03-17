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

        const output = batches.map(b => ({
            id: b.id,
            name: b.batch_name,
            student_ids_raw: b.student_ids,
            type: typeof b.student_ids
        }));

        fs.writeFileSync('debug_raw.json', JSON.stringify(output, null, 2));
        console.log('Done');
        await pool.end();
    } catch (e) {
        console.error(e);
    }
})();
