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
        console.log('🔄 Fixing AI Review table schemas...\n');

        // 1. Make submission_id nullable in ai_code_reviews
        console.log('1. Making ai_code_reviews.submission_id nullable...');
        await pool.query('ALTER TABLE ai_code_reviews MODIFY submission_id VARCHAR(100) NULL');
        console.log('   ✅ Done');

        // 2. Add test_submission_id column if missing
        console.log('2. Adding test_submission_id column if missing...');
        try {
            await pool.query('ALTER TABLE ai_code_reviews ADD COLUMN test_submission_id VARCHAR(100) NULL AFTER submission_id');
            await pool.query('ALTER TABLE ai_code_reviews ADD INDEX idx_test_submission (test_submission_id)');
            console.log('   ✅ Column added');
        } catch (e) {
            if (e.message.includes('Duplicate column')) console.log('   ⏭️  Already exists');
            else console.log('   ⚠️', e.message);
        }

        // 3. Add test_type column if missing
        console.log('3. Adding test_type column if missing...');
        try {
            await pool.query('ALTER TABLE ai_code_reviews ADD COLUMN test_type VARCHAR(50) NULL AFTER test_submission_id');
            console.log('   ✅ Column added');
        } catch (e) {
            if (e.message.includes('Duplicate column')) console.log('   ⏭️  Already exists');
            else console.log('   ⚠️', e.message);
        }

        // 4. Add retry_count column if missing
        console.log('4. Adding retry_count column if missing...');
        try {
            await pool.query('ALTER TABLE ai_code_reviews ADD COLUMN retry_count INT DEFAULT 0');
            console.log('   ✅ Column added');
        } catch (e) {
            if (e.message.includes('Duplicate column')) console.log('   ⏭️  Already exists');
            else console.log('   ⚠️', e.message);
        }

        // 5. Add error_message column if missing
        console.log('5. Adding error_message column if missing...');
        try {
            await pool.query('ALTER TABLE ai_code_reviews ADD COLUMN error_message TEXT NULL');
            console.log('   ✅ Column added');
        } catch (e) {
            if (e.message.includes('Duplicate column')) console.log('   ⏭️  Already exists');
            else console.log('   ⚠️', e.message);
        }

        // 6. Make ai_code_review_comments.submission_id nullable
        console.log('6. Making ai_code_review_comments.submission_id nullable...');
        await pool.query('ALTER TABLE ai_code_review_comments MODIFY submission_id VARCHAR(100) NULL');
        console.log('   ✅ Done');

        // 7. Add test_submission_id to comments table if missing
        console.log('7. Adding test_submission_id to comments table if missing...');
        try {
            await pool.query('ALTER TABLE ai_code_review_comments ADD COLUMN test_submission_id VARCHAR(100) NULL AFTER submission_id');
            await pool.query('ALTER TABLE ai_code_review_comments ADD INDEX idx_test_submission (test_submission_id)');
            console.log('   ✅ Column added');
        } catch (e) {
            if (e.message.includes('Duplicate column')) console.log('   ⏭️  Already exists');
            else console.log('   ⚠️', e.message);
        }

        // 8. Relax ENUM constraint on overall_quality to VARCHAR (AI may return unexpected values)
        console.log('8. Relaxing overall_quality to VARCHAR...');
        try {
            await pool.query("ALTER TABLE ai_code_reviews MODIFY overall_quality VARCHAR(50) DEFAULT NULL");
            console.log('   ✅ Done');
        } catch (e) {
            console.log('   ⚠️', e.message);
        }

        // 9. Relax ENUM constraint on status to VARCHAR
        console.log('9. Relaxing status to VARCHAR...');
        try {
            await pool.query("ALTER TABLE ai_code_reviews MODIFY status VARCHAR(20) DEFAULT 'pending'");
            console.log('   ✅ Done');
        } catch (e) {
            console.log('   ⚠️', e.message);
        }

        // 10. Relax ENUM constraints on comments table
        console.log('10. Relaxing comment_type and severity to VARCHAR...');
        try {
            await pool.query("ALTER TABLE ai_code_review_comments MODIFY comment_type VARCHAR(50) DEFAULT 'suggestion'");
            await pool.query("ALTER TABLE ai_code_review_comments MODIFY severity VARCHAR(20) DEFAULT 'minor'");
            await pool.query("ALTER TABLE ai_code_review_comments MODIFY line_number INT DEFAULT 1");
            await pool.query("ALTER TABLE ai_code_review_comments MODIFY message TEXT NULL");
            console.log('   ✅ Done');
        } catch (e) {
            console.log('   ⚠️', e.message);
        }

        console.log('\n🎉 Schema fix completed successfully!');

    } catch (err) {
        console.error('❌ Fix failed:', err.message);
    } finally {
        await pool.end();
    }
}

fixSchema();
