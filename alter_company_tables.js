const mysql = require('mysql2/promise');
require('dotenv').config();

async function alter() {
    const dbUrl = new URL(process.env.DATABASE_URL);
    const pool = mysql.createPool({
        host: dbUrl.hostname,
        user: dbUrl.username,
        password: dbUrl.password,
        database: dbUrl.pathname.slice(1),
        port: Number(dbUrl.port) || 4000,
        ssl: { rejectUnauthorized: true }
    });

    console.log('Altering company tables...');

    try {
        await pool.query(`ALTER TABLE company_interviews MODIFY created_by VARCHAR(50)`);
        console.log('✅ Altered company_interviews.created_by');
    } catch (e) { console.error(e.message); }

    try {
        await pool.query(`ALTER TABLE company_interview_attempts MODIFY student_id VARCHAR(50)`);
        console.log('✅ Altered company_interview_attempts.student_id');
    } catch (e) { console.error(e.message); }

    process.exit(0);
}

alter();
