const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mentor_hub'
    });

    try {
        const [columns] = await pool.query('SHOW COLUMNS FROM company_interview_attempts LIKE "interview_progress"');
        if (columns.length === 0) {
            console.log('Adding interview_progress column...');
            await pool.query('ALTER TABLE company_interview_attempts ADD COLUMN interview_progress INT DEFAULT 0');
            console.log('Migration successful.');
        } else {
            console.log('Column already exists.');
        }
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        process.exit(0);
    }
}

migrate();
