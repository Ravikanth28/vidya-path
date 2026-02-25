const initSqlJs = require('sql.js');

function sanitizeSQLForSQLite(sql) {
    return sql
        .replace(/ENGINE\s*=\s*\w+/gi, '')
        .replace(/DEFAULT\s+CHARSET\s*=\s*\w+/gi, '')
        .replace(/CHARSET\s*=\s*\w+/gi, '')
        .replace(/CHARACTER\s+SET\s+\w+/gi, '')
        .replace(/COLLATE\s*=?\s*[\w_]+/gi, '')
        .replace(/ROW_FORMAT\s*=\s*\w+/gi, '')
        .replace(/AUTO_INCREMENT\s*=\s*\d+/gi, '')
        .replace(/\bAUTO_INCREMENT\b/gi, '')
        .replace(/`([^`]+)`/g, '"$1"')
        .replace(/\bTINYINT\s*\(\s*1\s*\)/gi, 'INTEGER')
        .replace(/\b(MEDIUM|LONG|TINY)TEXT\b/gi, 'TEXT')
        .replace(/\b(MEDIUM|TINY|BIG|SMALL)INT\b(\s*\(\s*\d+\s*\))?/gi, 'INTEGER')
        .replace(/\bINT\s*\(\s*\d+\s*\)/gi, 'INTEGER')
        .replace(/\bVARCHAR\s*\(\s*\d+\s*\)/gi, 'TEXT')
        .replace(/\bENUM\s*\([^)]+\)/gi, 'TEXT')
        .replace(/\bUNSIGNED\b/gi, '')
        .replace(/\bZEROFILL\b/gi, '')
        .replace(/\/\*![\s\S]*?\*\//g, '')
        .replace(/[ \t]{2,}/g, ' ')
        .trim();
}

async function executeSQLWithSqlJs(schema, query) {
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    try {
        if (schema && schema.trim()) {
            const cleanSchema = sanitizeSQLForSQLite(schema);
            const stmts = cleanSchema.split(/;\s*\n|\s*;\s*$|;\s*(?=\s*(CREATE|INSERT|DROP|ALTER|UPDATE|DELETE|BEGIN|COMMIT)\s)/i)
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.match(/^--/));

            for (const stmt of stmts) {
                try {
                    db.run(stmt + ';');
                } catch (stmtErr) {
                    console.warn(`  [skipped] ${stmtErr.message}: ${stmt.substring(0, 60)}...`);
                }
            }
        }
        const cleanQuery = sanitizeSQLForSQLite(query);
        const results = db.exec(cleanQuery);
        db.close();
        return { success: true, results };
    } catch (err) {
        db.close();
        return { success: false, error: err.message, results: [] };
    }
}

async function main() {
    console.log('=== Test: Schema with MySQL-style syntax ===');

    // This is the type of schema that might cause "near 50000: syntax error"
    const mysqlStyleSchema = `
CREATE TABLE employees (
    id INT(11) NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(50),
    salary DECIMAL(10,2) DEFAULT 50000,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO employees (name, department, salary) VALUES ('Alice', 'Engineering', 80000.00);
INSERT INTO employees (name, department, salary) VALUES ('Bob', 'Marketing', 60000.00);
INSERT INTO employees (name, department, salary) VALUES ('Carol', 'Engineering', 75000.00);
INSERT INTO employees (name, department, salary) VALUES ('Dave', 'HR', 55000.00);`;

    const query = `SELECT department, COUNT(*) as count, AVG(salary) as avg_salary FROM employees GROUP BY department ORDER BY department;`;

    const result = await executeSQLWithSqlJs(mysqlStyleSchema, query);
    console.log('Success:', result.success);
    if (result.success) {
        console.log('Columns:', result.results[0]?.columns);
        console.log('Rows:', result.results[0]?.values);
        console.log('✅ MySQL-style schema executed without syntax error!');
    } else {
        console.log('ERROR:', result.error);
        console.log('❌ FAILED');
    }

    console.log('\n=== Test: Backtick identifiers ===');
    const backtickSchema = `
CREATE TABLE \`students\` (
    \`id\` INT(11) NOT NULL AUTO_INCREMENT,
    \`name\` VARCHAR(200) NOT NULL,
    \`score\` BIGINT UNSIGNED,
    PRIMARY KEY (\`id\`)
) ENGINE=MyISAM;

INSERT INTO \`students\` (\`name\`, \`score\`) VALUES ('Alice', 95);
INSERT INTO \`students\` (\`name\`, \`score\`) VALUES ('Bob', 88);`;

    const r2 = await executeSQLWithSqlJs(backtickSchema, 'SELECT name, score FROM students ORDER BY score DESC;');
    console.log('Success:', r2.success);
    if (r2.success) console.log('Rows:', r2.results[0]?.values, '✅');
    else console.log('ERROR:', r2.error, '❌');
}

main();
