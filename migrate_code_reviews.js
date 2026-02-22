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
        console.log('🔄 Starting code reviews migration...');

        // Create code_reviews table for Feature #9
        await pool.query(`
            CREATE TABLE IF NOT EXISTS code_reviews (
                id VARCHAR(36) PRIMARY KEY,
                submission_id VARCHAR(36) NOT NULL,
                author_id VARCHAR(36) NOT NULL,
                line_number INT NOT NULL,
                comment TEXT NOT NULL,
                code_snippet TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
                FOREIGN KEY (author_id) REFERENCES users(id),
                INDEX idx_submission (submission_id),
                INDEX idx_author (author_id)
            )
        `);

        console.log('✅ code_reviews table created');

        // Create notification_digests table for digest emails
        await pool.query(`
            CREATE TABLE IF NOT EXISTS notification_digests (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                digest_type VARCHAR(50) DEFAULT 'daily',
                notifications_count INT,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                INDEX idx_user (user_id)
            )
        `);

        console.log('✅ notification_digests table created');

        // Create ai_code_reviews and ai_code_review_comments tables for AI reviews
        await pool.query(`
            CREATE TABLE IF NOT EXISTS ai_code_reviews (
                id VARCHAR(36) PRIMARY KEY,
                submission_id VARCHAR(36),
                test_submission_id VARCHAR(36),
                test_type VARCHAR(50),
                student_id VARCHAR(36) NOT NULL,
                language VARCHAR(50),
                status VARCHAR(20) DEFAULT 'pending',
                overall_quality VARCHAR(50),
                overall_feedback TEXT,
                ai_score INT,
                total_issues INT DEFAULT 0,
                bug_count INT DEFAULT 0,
                performance_count INT DEFAULT 0,
                style_count INT DEFAULT 0,
                security_count INT DEFAULT 0,
                mentor_approved BOOLEAN DEFAULT 0,
                mentor_id VARCHAR(36),
                retry_count INT DEFAULT 0,
                error_message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP NULL,
                INDEX idx_submission (submission_id),
                INDEX idx_test_submission (test_submission_id),
                INDEX idx_student (student_id),
                INDEX idx_status (status)
            )
        `);

        console.log('✅ ai_code_reviews table created');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS ai_code_review_comments (
                id VARCHAR(36) PRIMARY KEY,
                review_id VARCHAR(36) NOT NULL,
                submission_id VARCHAR(36),
                test_submission_id VARCHAR(36),
                line_number INT,
                end_line INT,
                comment_type VARCHAR(50),
                severity VARCHAR(20),
                message TEXT,
                suggestion TEXT,
                code_snippet TEXT,
                is_resolved BOOLEAN DEFAULT 0,
                resolved_by VARCHAR(36),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (review_id) REFERENCES ai_code_reviews(id) ON DELETE CASCADE,
                INDEX idx_review (review_id),
                INDEX idx_submission (submission_id),
                INDEX idx_test_submission (test_submission_id)
            )
        `);

        console.log('✅ ai_code_review_comments table created');

        pool.end();
        console.log('🎉 Code reviews migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

migrate();
