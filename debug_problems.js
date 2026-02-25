require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');

async function run() {
    const d = new URL(process.env.DATABASE_URL);
    const p = mysql.createPool({
        host: d.hostname, user: d.username, password: d.password,
        database: d.pathname.slice(1), port: Number(d.port) || 4000,
        ssl: { rejectUnauthorized: true }
    });

    const lines = [];
    const log = (msg) => { lines.push(msg); console.log(msg); };

    const [students] = await p.query('SELECT id, name, mentor_id FROM users WHERE role = "student" LIMIT 5');
    log(`=== ${students.length} students found ===`);
    for (const s of students) {
        const [allocs] = await p.query('SELECT count(*) as c FROM problem_student_allocations WHERE student_id = ?', [s.id]);
        const [result] = await p.query(
            `SELECT count(*) as c FROM problems p
            INNER JOIN problem_student_allocations psa ON p.id = psa.problem_id
            WHERE psa.student_id = ? 
            AND (p.mentor_id = ? OR (p.mentor_id IS NULL AND ? IS NULL) OR p.mentor_id = "admin-001") 
            AND p.status = "live"`,
            [s.id, s.mentor_id, s.mentor_id]
        );
        log(`Student: ${s.name} | alloc: ${allocs[0].c} | result: ${result[0].c} | mentor_id: ${s.mentor_id}`);
    }

    log('\n--- Problems with allocations (first 10) ---');
    const [pWithAlloc] = await p.query(
        `SELECT p.id, p.title, p.mentor_id, p.status, count(psa.student_id) as studentCount
         FROM problems p
         LEFT JOIN problem_student_allocations psa ON p.id = psa.problem_id
         GROUP BY p.id HAVING studentCount > 0 LIMIT 10`
    );
    for (const prob of pWithAlloc) {
        log(`Problem: ${prob.title} | mentor: ${prob.mentor_id} | status: ${prob.status} | students: ${prob.studentCount}`);
    }

    log('\n--- Admin/null mentor problems ---');
    const [[adminCnt]] = await p.query(`SELECT count(*) as c FROM problems WHERE mentor_id = "admin-001" AND status = "live"`);
    log(`Admin (admin-001) live problems: ${adminCnt.c}`);

    // Check if the problem_student_allocations table has all students or only specific ones
    const [[allocDistinct]] = await p.query(`SELECT count(DISTINCT student_id) as c FROM problem_student_allocations`);
    log(`Total unique students with problem allocations: ${allocDistinct.c}`);

    await p.end();
    fs.writeFileSync('debug_results.txt', lines.join('\n'));
    console.log('\nWritten to debug_results.txt');
}
run().catch(e => { console.error(e.message); process.exit(1); });
