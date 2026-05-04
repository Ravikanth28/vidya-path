/**
 * VidyaPath schema bootstrap — idempotent CREATE TABLE IF NOT EXISTS.
 * Tables are namespaced with `vp_` to coexist with the Mentor schema.
 *
 * Tables:
 *   vp_concepts            — atomic learnable concepts
 *   vp_lessons             — lesson catalog (i18n bodies via JSON)
 *   vp_lesson_progress     — per-student lesson status + mastery
 *   vp_quiz_items          — IRT-parameterised quiz items
 *   vp_attempts            — per-attempt response log
 *   vp_student_ability     — per-subject theta
 *   vp_student_mastery     — per-concept BKT mastery + SRS schedule
 *   vp_voice_queries       — chat / voice tutor history
 *   vp_diagnostic_state    — diagnostic completion flag
 *   vp_careers             — career catalog
 *   vp_scholarships        — scholarship catalog
 *   vp_mentors             — mentor catalog
 *   vp_match_history       — career-hub LLM match audit log
 *   vp_notifications       — in-app notifications
 *   vp_sync_events         — server-side mirror of offline sync_queue
 *   vp_user_prefs          — per-user lang + onboarding flags
 */

const SQL = [
    `CREATE TABLE IF NOT EXISTS vp_concepts (
        id VARCHAR(48) PRIMARY KEY,
        subject VARCHAR(48) NOT NULL,
        title VARCHAR(255) NOT NULL,
        grade_min TINYINT DEFAULT 8,
        grade_max TINYINT DEFAULT 14,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_vp_concepts_subject (subject)
    )`,
    `CREATE TABLE IF NOT EXISTS vp_lessons (
        id VARCHAR(48) PRIMARY KEY,
        concept_id VARCHAR(48),
        subject VARCHAR(48) NOT NULL,
        title VARCHAR(255) NOT NULL,
        body_i18n JSON,
        audio_url_i18n JSON,
        ordering INT DEFAULT 0,
        grade TINYINT DEFAULT 8,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_vp_lessons_subject (subject),
        INDEX idx_vp_lessons_concept (concept_id)
    )`,
    `CREATE TABLE IF NOT EXISTS vp_lesson_progress (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(64) NOT NULL,
        lesson_id VARCHAR(48) NOT NULL,
        status ENUM('not_started','in_progress','completed') DEFAULT 'not_started',
        mastery_pct DECIMAL(5,2) DEFAULT 0,
        last_position INT DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_vp_lp (student_id, lesson_id),
        INDEX idx_vp_lp_student (student_id),
        INDEX idx_vp_lp_status (status)
    )`,
    `CREATE TABLE IF NOT EXISTS vp_quiz_items (
        id VARCHAR(48) PRIMARY KEY,
        lesson_id VARCHAR(48),
        concept_id VARCHAR(48),
        subject VARCHAR(48) NOT NULL,
        kind ENUM('mcq','short','tf') DEFAULT 'mcq',
        prompt_i18n JSON,
        options_i18n JSON,
        answer_key TEXT,
        rubric_i18n JSON,
        a DECIMAL(6,3) DEFAULT 1.0,
        b DECIMAL(6,3) DEFAULT 0.0,
        c DECIMAL(6,3) DEFAULT 0.2,
        is_diagnostic TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_vp_qi_lesson (lesson_id),
        INDEX idx_vp_qi_concept (concept_id),
        INDEX idx_vp_qi_subject (subject),
        INDEX idx_vp_qi_diag (is_diagnostic)
    )`,
    `CREATE TABLE IF NOT EXISTS vp_attempts (
        id VARCHAR(48) PRIMARY KEY,
        student_id VARCHAR(64) NOT NULL,
        item_id VARCHAR(48) NOT NULL,
        lesson_id VARCHAR(48),
        subject VARCHAR(48),
        student_answer TEXT,
        correct TINYINT(1) DEFAULT 0,
        score DECIMAL(6,3) DEFAULT 0,
        ai_feedback JSON,
        time_taken_ms INT DEFAULT 0,
        attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_vp_att_student (student_id),
        INDEX idx_vp_att_subject (subject),
        INDEX idx_vp_att_item (item_id)
    )`,
    `CREATE TABLE IF NOT EXISTS vp_student_ability (
        student_id VARCHAR(64) NOT NULL,
        subject VARCHAR(48) NOT NULL,
        theta DECIMAL(6,3) DEFAULT 0,
        n_responses INT DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (student_id, subject)
    )`,
    `CREATE TABLE IF NOT EXISTS vp_student_mastery (
        student_id VARCHAR(64) NOT NULL,
        concept_id VARCHAR(48) NOT NULL,
        p_mastery DECIMAL(6,4) DEFAULT 0.10,
        ease DECIMAL(6,3) DEFAULT 2.5,
        interval_days INT DEFAULT 0,
        reps INT DEFAULT 0,
        next_due DATETIME NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (student_id, concept_id),
        INDEX idx_vp_mastery_due (next_due)
    )`,
    `CREATE TABLE IF NOT EXISTS vp_voice_queries (
        id VARCHAR(48) PRIMARY KEY,
        student_id VARCHAR(64) NOT NULL,
        lesson_id VARCHAR(48),
        mode ENUM('text','voice') DEFAULT 'text',
        lang VARCHAR(10) DEFAULT 'en',
        question TEXT,
        answer MEDIUMTEXT,
        provider VARCHAR(32),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_vp_vq_student (student_id),
        INDEX idx_vp_vq_created (created_at)
    )`,
    `CREATE TABLE IF NOT EXISTS vp_diagnostic_state (
        student_id VARCHAR(64) PRIMARY KEY,
        diagnostic_done TINYINT(1) DEFAULT 0,
        completed_at DATETIME NULL,
        result_json JSON
    )`,
    `CREATE TABLE IF NOT EXISTS vp_careers (
        id VARCHAR(48) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        domain VARCHAR(96),
        summary TEXT,
        skills_json JSON,
        avg_salary VARCHAR(64),
        education TEXT,
        meta_json JSON
    )`,
    `CREATE TABLE IF NOT EXISTS vp_scholarships (
        id VARCHAR(48) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        provider VARCHAR(255),
        eligibility TEXT,
        amount VARCHAR(64),
        deadline DATE NULL,
        url VARCHAR(512),
        meta_json JSON
    )`,
    `CREATE TABLE IF NOT EXISTS vp_mentors (
        id VARCHAR(48) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        expertise VARCHAR(255),
        bio TEXT,
        languages VARCHAR(96),
        availability VARCHAR(96),
        contact VARCHAR(255),
        meta_json JSON
    )`,
    `CREATE TABLE IF NOT EXISTS vp_match_history (
        id VARCHAR(48) PRIMARY KEY,
        student_id VARCHAR(64) NOT NULL,
        kind ENUM('career','scholarship','mentor') NOT NULL,
        result_json JSON,
        explanations_json JSON,
        lang VARCHAR(10) DEFAULT 'en',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_vp_mh_student (student_id),
        INDEX idx_vp_mh_kind (kind)
    )`,
    `CREATE TABLE IF NOT EXISTS vp_notifications (
        id VARCHAR(48) PRIMARY KEY,
        student_id VARCHAR(64) NOT NULL,
        kind VARCHAR(48) NOT NULL,
        title VARCHAR(255),
        body TEXT,
        data_json JSON,
        is_read TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_vp_notif_student (student_id),
        INDEX idx_vp_notif_unread (student_id, is_read)
    )`,
    `CREATE TABLE IF NOT EXISTS vp_sync_events (
        id VARCHAR(48) PRIMARY KEY,
        student_id VARCHAR(64) NOT NULL,
        kind VARCHAR(48) NOT NULL,
        payload_json JSON,
        applied TINYINT(1) DEFAULT 0,
        client_ts DATETIME NULL,
        applied_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_vp_sync_student (student_id, applied)
    )`,
    `CREATE TABLE IF NOT EXISTS vp_user_prefs (
        student_id VARCHAR(64) PRIMARY KEY,
        lang VARCHAR(10) DEFAULT 'en',
        grade TINYINT DEFAULT 9,
        board VARCHAR(32) DEFAULT 'CBSE',
        state VARCHAR(64),
        diagnostic_done TINYINT(1) DEFAULT 0,
        xp_points INT DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`
];

async function ensureVpSchema(pool) {
    for (const sql of SQL) {
        try {
            await pool.query(sql);
        } catch (err) {
            console.warn('[vp] migration warning:', err.message);
        }
    }
    console.log('[vp] schema ready (' + SQL.length + ' tables)');
}

module.exports = { ensureVpSchema };
