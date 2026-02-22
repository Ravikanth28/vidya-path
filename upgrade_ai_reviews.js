const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const dbUrl = new URL(process.env.DATABASE_URL);
    const pool = mysql.createPool({
        host: dbUrl.hostname,
        user: dbUrl.username,
        password: dbUrl.password,
        database: dbUrl.pathname.slice(1),
        port: Number(dbUrl.port) || 4000,
        ssl: {},
        waitForConnections: true,
        connectionLimit: 5,
        timezone: '+00:00'
    });

    try {
        console.log('🔄 Upgrading ai_code_reviews table...');

        // Try to add retry_count column if it doesn't exist
        try {
            await pool.query(`
                ALTER TABLE ai_code_reviews 
                ADD COLUMN retry_count INT DEFAULT 0
            `);
            console.log('✅ Added retry_count column');
        } catch (err) {
            if (err.message.includes('Duplicate column')) {
                console.log('ℹ️  retry_count column already exists');
            } else {
                throw err;
            }
        }

        // Try to add error_message column if it doesn't exist
        try {
            await pool.query(`
                ALTER TABLE ai_code_reviews 
                ADD COLUMN error_message TEXT
            `);
            console.log('✅ Added error_message column');
        } catch (err) {
            if (err.message.includes('Duplicate column')) {
                console.log('ℹ️  error_message column already exists');
            } else {
                throw err;
            }
        }

        pool.end();
        console.log('🎉 AI Code Reviews upgrade completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

migrate();
