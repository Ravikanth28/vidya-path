const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixSchema() {
    const dbUrl = new URL(process.env.DATABASE_URL);
    const pool = mysql.createPool({
        host: dbUrl.hostname,
        user: dbUrl.username,
        password: dbUrl.password,
        database: dbUrl.pathname.slice(1),
        port: Number(dbUrl.port) || 4000,
        ssl: {},
        waitForConnections: true,
        connectionLimit: 1
    });

    try {
        console.log('🔄 Fixing AI Review table schemas...');

        // 1. Alter ai_code_reviews to allow NULL for submission_id
        console.log('Altering ai_code_reviews...');
        await pool.query('ALTER TABLE ai_code_reviews MODIFY submission_id VARCHAR(36) NULL');

        // 2. Alter ai_code_review_comments to allow NULL for submission_id
        console.log('Altering ai_code_review_comments...');
        await pool.query('ALTER TABLE ai_code_review_comments MODIFY submission_id VARCHAR(36) NULL');

        console.log('✅ Schema fix completed successfully!');

    } catch (err) {
        console.error('❌ Fix failed:', err.message);
    } finally {
        await pool.end();
    }
}

fixSchema();
