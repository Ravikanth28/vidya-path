const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

function loadEnvFile(envFilePath) {
    const vars = {};
    if (!fs.existsSync(envFilePath)) return vars;
    const lines = fs.readFileSync(envFilePath, 'utf8').split(/\r?\n/);
    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const idx = line.indexOf('=');
        if (idx === -1) continue;
        vars[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
    return vars;
}

function parseDbUrl(dbUrl) {
    const parsed = new URL(dbUrl);
    return {
        host: parsed.hostname,
        user: decodeURIComponent(parsed.username),
        password: decodeURIComponent(parsed.password),
        database: parsed.pathname.replace(/^\//, ''),
        port: Number(parsed.port) || 4000,
        ssl: { rejectUnauthorized: true }
    };
}

function summarize(rows) {
    return rows.map((row) => {
        const isBcrypt = row.password.startsWith('$2a$') || row.password.startsWith('$2b$');
        return {
            id: row.id,
            name: row.name,
            email: row.email,
            role: row.role,
            status: row.status,
            passwordType: isBcrypt ? 'bcrypt' : 'plaintext',
            password: isBcrypt ? null : row.password
        };
    });
}

async function main() {
    const vars = loadEnvFile(path.join(__dirname, 'server', '.env'));
    const dbUrl = vars.TIDB_URL_new || vars.DATABASE_URL || vars.DATABASE_URL_old;
    if (!dbUrl) throw new Error('No database URL found in server/.env');

    const conn = await mysql.createConnection(parseDbUrl(dbUrl));
    try {
        const [admins] = await conn.query(
            `SELECT id, name, email, role, status, password
             FROM users
             WHERE role = 'admin'
             ORDER BY created_at ASC, id ASC`
        );

        const [students] = await conn.query(
            `SELECT id, name, email, role, status, password
             FROM users
             WHERE role = 'student'
               AND (
                    password = 'password2029'
                 OR email IN ('student@test.com', 'prabanjan@edu.com', 'dummy@edu.com')
               )
             ORDER BY created_at ASC, id ASC`
        );

        console.log(JSON.stringify({
            admins: summarize(admins),
            candidateStudents: summarize(students)
        }, null, 2));
    } finally {
        await conn.end();
    }
}

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});