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
        ssl: { rejectUnauthorized: true }
    });

    console.log('🚀 Starting Company Features Migration...');

    try {
        // 1. Company Interviews Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS company_interviews (
                id INT AUTO_INCREMENT PRIMARY KEY,
                company_name VARCHAR(255) NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                duration_minutes INT DEFAULT 60,
                difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
                skills_covered JSON,
                is_active BOOLEAN DEFAULT TRUE,
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Created company_interviews table');

        // 2. Company Interview Attempts Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS company_interview_attempts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                test_id INT,
                student_id INT,
                student_name VARCHAR(255),
                current_stage VARCHAR(50) DEFAULT 'intro',
                chat_history LONGTEXT, -- JSON array of messages
                coding_submissions JSON,
                sql_submissions JSON,
                overall_score DECIMAL(5,2) DEFAULT 0,
                evaluation_report JSON,
                status ENUM('in_progress', 'completed', 'failed') DEFAULT 'in_progress',
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (test_id) REFERENCES company_interviews(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Created company_interview_attempts table');

        // 3. Company Roadmaps Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS company_roadmaps (
                id INT AUTO_INCREMENT PRIMARY KEY,
                company_name VARCHAR(255) UNIQUE NOT NULL,
                roadmap_data LONGTEXT, -- JSON data
                vibe_score INT DEFAULT 0,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Created company_roadmaps table');

        // 4. Initial Seed Data (Optional - common companies)
        const commonCompanies = ['Zoho', 'TCS', 'CTS', 'Wipro', 'Accenture', 'Google', 'Amazon', 'Microsoft', 'Infosys', 'HCL'];
        for (const company of commonCompanies) {
            await pool.query('INSERT IGNORE INTO company_roadmaps (company_name) VALUES (?)', [company]);
        }
        console.log('✅ Seeded initial companies in roadmaps table');

        console.log('🎉 Migration completed successfully!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        await pool.end();
    }
}

migrate();
