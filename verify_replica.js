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

function quoteId(identifier) {
    return `\`${String(identifier).replace(/`/g, '``')}\``;
}

async function main() {
    const vars = loadEnvFile(path.join(__dirname, 'server', '.env'));
    const sourceUrl = vars.DATABASE_URL_old || vars.DATABASE_URL;
    const targetUrl = vars.TIDB_URL_new || vars.DATABASE_URL_NEW;

    if (!sourceUrl || !targetUrl) {
        throw new Error('Missing DATABASE_URL_old/TIDB_URL_new in server/.env');
    }

    const sourceCfg = parseDbUrl(sourceUrl);
    const targetCfg = parseDbUrl(targetUrl);

    const sourceConn = await mysql.createConnection(sourceCfg);
    const targetConn = await mysql.createConnection(targetCfg);

    const mismatches = [];
    try {
        const [tables] = await sourceConn.query(
            `SELECT TABLE_NAME
             FROM INFORMATION_SCHEMA.TABLES
             WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
             ORDER BY TABLE_NAME`,
            [sourceCfg.database]
        );

        for (const row of tables) {
            const tableName = row.TABLE_NAME;
            const tableId = quoteId(tableName);

            const [[srcCountRow]] = await sourceConn.query(`SELECT COUNT(*) AS c FROM ${tableId}`);
            const [[dstCountRow]] = await targetConn.query(`SELECT COUNT(*) AS c FROM ${tableId}`);

            if (Number(srcCountRow.c) !== Number(dstCountRow.c)) {
                mismatches.push({
                    table: tableName,
                    source: Number(srcCountRow.c),
                    target: Number(dstCountRow.c)
                });
            }
        }

        console.log(`Tables checked: ${tables.length}`);
        console.log(`Mismatches: ${mismatches.length}`);
        if (mismatches.length) {
            for (const m of mismatches) {
                console.log(`${m.table}: source=${m.source}, target=${m.target}`);
            }
            process.exitCode = 2;
        }
    } finally {
        await sourceConn.end();
        await targetConn.end();
    }
}

main().catch((err) => {
    console.error('Verification failed:', err.message);
    process.exitCode = 1;
});