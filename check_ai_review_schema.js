const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSchema() {
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
        console.log('🔍 Checking AI Review tables...');
        const [reviewCols] = await pool.query('DESCRIBE ai_code_reviews');
        console.log('\nTable: ai_code_reviews');
        reviewCols.forEach(col => {
            console.log(`${col.Field}: Null=${col.Null}, Key=${col.Key}, Default=${col.Default}`);
        });

        const [commentCols] = await pool.query('DESCRIBE ai_code_review_comments');
        console.log('\nTable: ai_code_review_comments');
        commentCols.forEach(col => {
            console.log(`${col.Field}: Null=${col.Null}, Key=${col.Key}, Default=${col.Default}`);
        });

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}

checkSchema();
