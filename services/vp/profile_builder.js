/**
 * Build a plain-text performance summary for a student.
 * Pulls from VidyaPath tables (theta, mastery, lesson progress, attempt accuracy)
 * and from Mentor tables when present (aptitude, communication, coding, badges).
 *
 * Returns: { summary: string, raw: object }
 */

async function safe(pool, sql, params) {
    try {
        const [rows] = await pool.query(sql, params || []);
        return rows;
    } catch {
        return [];
    }
}

async function buildStudentProfile(pool, studentId) {
    const ability = await safe(pool, 'SELECT subject, theta, n_responses FROM vp_student_ability WHERE student_id = ?', [studentId]);
    const lessonsDone = await safe(pool, "SELECT subject, COUNT(*) AS n FROM vp_lessons l JOIN vp_lesson_progress p ON l.id = p.lesson_id WHERE p.student_id = ? AND p.status = 'completed' GROUP BY subject", [studentId]);
    const accuracyRows = await safe(pool, 'SELECT subject, AVG(correct) AS acc, COUNT(*) AS n FROM vp_attempts WHERE student_id = ? GROUP BY subject', [studentId]);
    const topMastery = await safe(pool, 'SELECT c.title, c.subject, m.p_mastery FROM vp_student_mastery m JOIN vp_concepts c ON m.concept_id = c.id WHERE m.student_id = ? ORDER BY m.p_mastery DESC LIMIT 5', [studentId]);

    // Optional pulls from Mentor side (best-effort)
    const aptitude = await safe(pool, 'SELECT AVG(score) AS avg_score, COUNT(*) AS n FROM aptitude_submissions WHERE student_id = ?', [studentId]);
    const comm = await safe(pool, 'SELECT AVG(JSON_EXTRACT(ai_scores, "$.pronunciationScore")) AS pron, COUNT(*) AS n FROM comm_test_submissions WHERE student_id = ?', [studentId]);
    const coding = await safe(pool, 'SELECT AVG(score) AS avg_score, COUNT(*) AS n FROM submissions WHERE student_id = ?', [studentId]);
    const badges = await safe(pool, 'SELECT badge_name FROM user_badges WHERE user_id = ? LIMIT 20', [studentId]);

    const lines = [];
    if (ability.length) {
        lines.push('Subject ability (IRT theta, range −3..+3):');
        for (const a of ability) {
            lines.push(`  - ${a.subject}: theta = ${Number(a.theta).toFixed(2)} (from ${a.n_responses} responses)`);
        }
    }
    if (accuracyRows.length) {
        lines.push('Quiz accuracy by subject:');
        for (const a of accuracyRows) {
            lines.push(`  - ${a.subject}: ${(Number(a.acc) * 100).toFixed(0)}% over ${a.n} attempts`);
        }
    }
    if (lessonsDone.length) {
        lines.push('Lessons completed:');
        for (const l of lessonsDone) lines.push(`  - ${l.subject}: ${l.n}`);
    }
    if (topMastery.length) {
        lines.push('Top mastered concepts:');
        for (const m of topMastery) lines.push(`  - ${m.title} (${m.subject}): ${(Number(m.p_mastery) * 100).toFixed(0)}%`);
    }
    if (aptitude[0]?.n) lines.push(`Aptitude tests: avg ${Number(aptitude[0].avg_score).toFixed(1)} over ${aptitude[0].n} attempts`);
    if (comm[0]?.n)     lines.push(`Communication test pronunciation: avg ${Number(comm[0].pron || 0).toFixed(0)}/100 over ${comm[0].n} submissions`);
    if (coding[0]?.n)   lines.push(`Coding submissions: avg score ${Number(coding[0].avg_score).toFixed(1)} over ${coding[0].n} submissions`);
    if (badges.length)  lines.push(`Earned badges: ${badges.map(b => b.badge_name).join(', ')}`);

    if (!lines.length) lines.push('Student is new — no performance history yet.');

    return {
        summary: lines.join('\n'),
        raw: { ability, accuracyRows, lessonsDone, topMastery, aptitude, comm, coding, badges }
    };
}

module.exports = { buildStudentProfile };
