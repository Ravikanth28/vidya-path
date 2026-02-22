/**
 * Migration: Completion Certificates + AI Code Reviews + Webhook System
 * Run: node migrate_new_three_features.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const { URL } = require('url');

async function migrate() {
    const dbUrl = new URL(process.env.DATABASE_URL);
    const pool = mysql.createPool({
        host: dbUrl.hostname,
        user: dbUrl.username,
        password: dbUrl.password,
        database: dbUrl.pathname.slice(1),
        port: Number(dbUrl.port) || 4000,
        ssl: { rejectUnauthorized: true },
        waitForConnections: true,
        connectionLimit: 5,
    });

    const conn = await pool.getConnection();
    console.log('✅ Connected to database');

    try {

        // =====================================================
        // TABLE 1: certificates
        // =====================================================
        await conn.query(`
            CREATE TABLE IF NOT EXISTS certificates (
                id VARCHAR(36) PRIMARY KEY,
                student_id VARCHAR(100) NOT NULL,
                student_name VARCHAR(255) NOT NULL,
                mentor_name VARCHAR(255) DEFAULT 'MentorHub Platform',
                certificate_type ENUM('skill_test','aptitude_test','global_test','skill_path') NOT NULL,
                source_id VARCHAR(100) NOT NULL COMMENT 'test_id or path_id',
                source_title VARCHAR(500) NOT NULL,
                score DECIMAL(5,2) DEFAULT 0,
                passing_score DECIMAL(5,2) DEFAULT 70,
                issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                pdf_path VARCHAR(500) DEFAULT NULL,
                verification_code VARCHAR(64) UNIQUE NOT NULL,
                is_valid BOOLEAN DEFAULT TRUE,
                INDEX idx_student (student_id),
                INDEX idx_verification (verification_code),
                INDEX idx_source (source_id),
                INDEX idx_issued (issued_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✅ Table: certificates');

        // =====================================================
        // TABLE 2: ai_code_reviews
        // =====================================================
        await conn.query(`
            CREATE TABLE IF NOT EXISTS ai_code_reviews (
                id VARCHAR(36) PRIMARY KEY,
                submission_id VARCHAR(100) NOT NULL,
                student_id VARCHAR(100) NOT NULL,
                problem_id VARCHAR(100) DEFAULT NULL,
                language VARCHAR(50) DEFAULT 'unknown',
                status ENUM('pending','processing','completed','failed') DEFAULT 'pending',
                overall_quality ENUM('excellent','good','needs_improvement','poor') DEFAULT NULL,
                overall_feedback TEXT DEFAULT NULL,
                total_issues INT DEFAULT 0,
                bug_count INT DEFAULT 0,
                performance_count INT DEFAULT 0,
                style_count INT DEFAULT 0,
                security_count INT DEFAULT 0,
                ai_score DECIMAL(5,2) DEFAULT NULL COMMENT 'AI estimated score 0-100',
                mentor_approved BOOLEAN DEFAULT FALSE,
                mentor_id VARCHAR(100) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP NULL,
                INDEX idx_submission (submission_id),
                INDEX idx_student (student_id),
                INDEX idx_status (status),
                INDEX idx_created (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✅ Table: ai_code_reviews');

        // =====================================================
        // TABLE 3: ai_code_review_comments
        // =====================================================
        await conn.query(`
            CREATE TABLE IF NOT EXISTS ai_code_review_comments (
                id VARCHAR(36) PRIMARY KEY,
                review_id VARCHAR(36) NOT NULL,
                submission_id VARCHAR(100) NOT NULL,
                line_number INT NOT NULL,
                end_line INT DEFAULT NULL,
                comment_type ENUM('bug','performance','style','security','suggestion','praise') NOT NULL,
                severity ENUM('critical','major','minor','info') DEFAULT 'minor',
                message TEXT NOT NULL,
                suggestion TEXT DEFAULT NULL,
                code_snippet TEXT DEFAULT NULL,
                is_resolved BOOLEAN DEFAULT FALSE,
                resolved_by VARCHAR(100) DEFAULT NULL COMMENT 'mentor_id who resolved',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_review (review_id),
                INDEX idx_submission (submission_id),
                INDEX idx_line (line_number),
                FOREIGN KEY (review_id) REFERENCES ai_code_reviews(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✅ Table: ai_code_review_comments');

        // =====================================================
        // TABLE 4: webhooks
        // =====================================================
        await conn.query(`
            CREATE TABLE IF NOT EXISTS webhooks (
                id VARCHAR(36) PRIMARY KEY,
                admin_id VARCHAR(100) NOT NULL,
                name VARCHAR(255) NOT NULL,
                url VARCHAR(1000) NOT NULL,
                secret VARCHAR(255) NOT NULL COMMENT 'HMAC-SHA256 signing secret',
                events JSON NOT NULL COMMENT 'Array of event types to trigger on',
                is_active BOOLEAN DEFAULT TRUE,
                failure_count INT DEFAULT 0,
                last_triggered_at TIMESTAMP NULL,
                last_status INT DEFAULT NULL COMMENT 'Last HTTP response code',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_admin (admin_id),
                INDEX idx_active (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✅ Table: webhooks');

        // =====================================================
        // TABLE 5: webhook_deliveries (delivery log)
        // =====================================================
        await conn.query(`
            CREATE TABLE IF NOT EXISTS webhook_deliveries (
                id VARCHAR(36) PRIMARY KEY,
                webhook_id VARCHAR(36) NOT NULL,
                event_type VARCHAR(100) NOT NULL,
                payload JSON NOT NULL,
                response_status INT DEFAULT NULL,
                response_body TEXT DEFAULT NULL,
                duration_ms INT DEFAULT NULL,
                success BOOLEAN DEFAULT FALSE,
                retry_count INT DEFAULT 0,
                delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_webhook (webhook_id),
                INDEX idx_event (event_type),
                INDEX idx_success (success),
                INDEX idx_delivered (delivered_at),
                FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✅ Table: webhook_deliveries');

        console.log('\n🎉 All 3-feature migrations completed successfully!');
        console.log('   - certificates');
        console.log('   - ai_code_reviews + ai_code_review_comments');
        console.log('   - webhooks + webhook_deliveries');

    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        throw err;
    } finally {
        conn.release();
        await pool.end();
    }
}

migrate().catch(err => {
    console.error(err);
    process.exit(1);
});
