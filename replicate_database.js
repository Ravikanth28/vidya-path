const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

function loadEnvFile(envFilePath) {
    if (!fs.existsSync(envFilePath)) return;
    const content = fs.readFileSync(envFilePath, 'utf8');
    const lines = content.split(/\r?\n/);
    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const eqIndex = line.indexOf('=');
        if (eqIndex === -1) continue;
        const key = line.slice(0, eqIndex).trim();
        if (!key || process.env[key]) continue;
        const value = line.slice(eqIndex + 1).trim();
        process.env[key] = value;
    }
}

loadEnvFile(path.join(__dirname, 'server', '.env'));

function getEnv(name) {
    const value = process.env[name];
    return typeof value === 'string' ? value.trim() : '';
}

function parseDbUrl(dbUrl) {
    const parsed = new URL(dbUrl);
    return {
        host: parsed.hostname,
        user: decodeURIComponent(parsed.username),
        password: decodeURIComponent(parsed.password),
        database: parsed.pathname.replace(/^\//, ''),
        port: Number(parsed.port) || 4000
    };
}

function createPool(dbUrl) {
    const cfg = parseDbUrl(dbUrl);
    return mysql.createPool({
        ...cfg,
        ssl: { rejectUnauthorized: true },
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0,
        timezone: '+00:00'
    });
}

function quoteId(identifier) {
    return `\`${String(identifier).replace(/`/g, '``')}\``;
}

function chunkArray(items, size) {
    const chunks = [];
    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size));
    }
    return chunks;
}

function normalizeValue(value) {
    if (value === null || value === undefined) return value;
    if (value instanceof Date) return value;
    if (Buffer.isBuffer(value)) return value;
    if (typeof value === 'object') return JSON.stringify(value);
    return value;
}

async function copyTables(sourceConn, targetConn, sourceDb) {
    const [tableRows] = await sourceConn.query(
        `SELECT TABLE_NAME
         FROM INFORMATION_SCHEMA.TABLES
         WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
         ORDER BY CREATE_TIME, TABLE_NAME`,
        [sourceDb]
    );

    const tableNames = tableRows.map((r) => r.TABLE_NAME);
    console.log(`Found ${tableNames.length} tables.`);

    await targetConn.query('SET FOREIGN_KEY_CHECKS=0');
    try {
        for (const tableName of tableNames) {
            const tableId = quoteId(tableName);
            console.log(`\nCopying table: ${tableName}`);

            const [createTableRows] = await sourceConn.query(`SHOW CREATE TABLE ${tableId}`);
            const createSql = createTableRows[0]['Create Table'];
            await targetConn.query(createSql);

            const [rows] = await sourceConn.query(`SELECT * FROM ${tableId}`);
            if (rows.length === 0) {
                console.log(`- ${tableName}: 0 rows`);
                continue;
            }

            const [columnRows] = await sourceConn.query(`SHOW COLUMNS FROM ${tableId}`);
            const columns = columnRows.map((c) => c.Field);
            const escapedColumns = columns.map(quoteId).join(', ');

            for (const batch of chunkArray(rows, 500)) {
                const placeholders = batch
                    .map(() => `(${columns.map(() => '?').join(',')})`)
                    .join(',');

                const values = [];
                for (const row of batch) {
                    for (const col of columns) {
                        values.push(normalizeValue(row[col]));
                    }
                }

                const insertSql = `INSERT INTO ${tableId} (${escapedColumns}) VALUES ${placeholders}`;
                await targetConn.query(insertSql, values);
            }

            console.log(`- ${tableName}: ${rows.length} rows copied`);
        }
    } finally {
        await targetConn.query('SET FOREIGN_KEY_CHECKS=1');
    }
}

async function resetTargetSchema(targetConn, targetDb) {
    console.log(`Resetting target schema: ${targetDb}`);

    await targetConn.query('SET FOREIGN_KEY_CHECKS=0');
    try {
        const [viewRows] = await targetConn.query(
            `SELECT TABLE_NAME
             FROM INFORMATION_SCHEMA.VIEWS
             WHERE TABLE_SCHEMA = ?`,
            [targetDb]
        );
        for (const row of viewRows) {
            await targetConn.query(`DROP VIEW IF EXISTS ${quoteId(row.TABLE_NAME)}`);
        }

        const [tableRows] = await targetConn.query(
            `SELECT TABLE_NAME
             FROM INFORMATION_SCHEMA.TABLES
             WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'`,
            [targetDb]
        );
        for (const row of tableRows) {
            await targetConn.query(`DROP TABLE IF EXISTS ${quoteId(row.TABLE_NAME)}`);
        }
    } finally {
        await targetConn.query('SET FOREIGN_KEY_CHECKS=1');
    }
}

async function copyViews(sourceConn, targetConn, sourceDb) {
    const [viewRows] = await sourceConn.query(
        `SELECT TABLE_NAME
         FROM INFORMATION_SCHEMA.VIEWS
         WHERE TABLE_SCHEMA = ?
         ORDER BY TABLE_NAME`,
        [sourceDb]
    );

    if (viewRows.length === 0) {
        console.log('\nNo views found.');
        return;
    }

    console.log(`\nCopying ${viewRows.length} views.`);
    for (const row of viewRows) {
        const viewName = row.TABLE_NAME;
        const viewId = quoteId(viewName);

        const [createViewRows] = await sourceConn.query(`SHOW CREATE VIEW ${viewId}`);
        let createViewSql = createViewRows[0]['Create View'];
        createViewSql = createViewSql.replace(/^CREATE\s+ALGORITHM=.*?\s+VIEW\s+/i, 'CREATE OR REPLACE VIEW ');
        if (!/^CREATE OR REPLACE VIEW /i.test(createViewSql)) {
            createViewSql = createViewSql.replace(/^CREATE VIEW /i, 'CREATE OR REPLACE VIEW ');
        }

        await targetConn.query(createViewSql);
        console.log(`- view copied: ${viewName}`);
    }
}

async function main() {
    const sourceUrl = getEnv('DATABASE_URL_old') || getEnv('DATABASE_URL');
    const targetUrl = getEnv('TIDB_URL_new') || getEnv('DATABASE_URL_NEW');

    if (!sourceUrl) {
        throw new Error('Missing source database URL. Set DATABASE_URL_old (or DATABASE_URL).');
    }
    if (!targetUrl) {
        throw new Error('Missing target database URL. Set TIDB_URL_new (or DATABASE_URL_NEW).');
    }

    const sourceCfg = parseDbUrl(sourceUrl);
    const targetCfg = parseDbUrl(targetUrl);

    console.log(`Source DB: ${sourceCfg.database}`);
    console.log(`Target DB: ${targetCfg.database}`);

    const sourcePool = createPool(sourceUrl);
    const targetPool = createPool(targetUrl);

    let sourceConn;
    let targetConn;
    try {
        sourceConn = await sourcePool.getConnection();
        targetConn = await targetPool.getConnection();

        await sourceConn.ping();
        await targetConn.ping();
        console.log('Connected to both databases. Starting replication...');

        await resetTargetSchema(targetConn, targetCfg.database);
        await copyTables(sourceConn, targetConn, sourceCfg.database);
        await copyViews(sourceConn, targetConn, sourceCfg.database);

        console.log('\nReplication completed successfully.');
    } finally {
        if (sourceConn) sourceConn.release();
        if (targetConn) targetConn.release();
        await sourcePool.end();
        await targetPool.end();
    }
}

main().catch((error) => {
    console.error('\nReplication failed:', error.message);
    process.exitCode = 1;
});