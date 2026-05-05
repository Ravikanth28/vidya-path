/**
 * fix_fk.js — finds and fixes incompatible FK constraints that block schema init.
 * Run once from the server/ directory:  node db/fix_fk.js
 */
'use strict';

const mysql = require('mysql2/promise');
const path  = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

function parseTidbUrl(url) {
  const m = url.match(/^mysql:\/\/([^:@]+):([^@]*)@([^:?/]+):(\d+)\/([^?]+)(\?(.*))?$/);
  if (!m) throw new Error('Invalid TIDB_URL');
  const params = new URLSearchParams(m[7] || '');
  return {
    user:     decodeURIComponent(m[1]),
    password: decodeURIComponent(m[2]),
    host:     m[3],
    port:     Number(m[4]),
    database: m[5],
    ssl:      params.get('ssl') === 'true' || /tidbcloud\.com$/i.test(m[3]),
  };
}

async function main() {
  const url = process.env.TIDB_URL;
  if (!url) { console.error('TIDB_URL not set in .env'); process.exit(1); }

  const cfg = parseTidbUrl(url);
  const conn = await mysql.createConnection({
    host:     cfg.host,
    port:     cfg.port,
    user:     cfg.user,
    password: cfg.password,
    database: cfg.database,
    ssl:      cfg.ssl ? { rejectUnauthorized: false } : undefined,
  });

  console.log(`Connected to ${cfg.host}:${cfg.port}/${cfg.database}`);

  // New-schema tables — find any FK from old tables that references these
  const newSchemaTables = [
    'users','otp_codes','concepts','concept_edges','items','lessons',
    'student_ability','student_mastery','attempts','lesson_progress',
    'proctor_events','leaderboard','badges','user_badges','careers',
    'scholarships','mentors','match_history','parent_messages','certificates',
    'sync_queue','audit_log','voice_queries','notifications','code_submissions',
    'comm_test_attempts','aptitude_questions','aptitude_attempts',
    'admin_tests','admin_test_questions','admin_test_attempts',
  ];

  const placeholders = newSchemaTables.map(() => '?').join(',');
  const [rows] = await conn.query(`
    SELECT DISTINCT kcu.TABLE_NAME, kcu.CONSTRAINT_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
    WHERE kcu.TABLE_SCHEMA           = ?
      AND kcu.REFERENCED_TABLE_NAME IN (${placeholders})
      AND kcu.TABLE_NAME NOT IN (${placeholders})
  `, [cfg.database, ...newSchemaTables, ...newSchemaTables]);

  if (rows.length === 0) {
    console.log('No FK constraints to drop — nothing to fix.');
    await conn.end();
    return;
  }

  console.log(`\nFound ${rows.length} FK constraint(s) from old tables referencing new-schema tables:`);
  for (const r of rows) {
    console.log(`  Table: ${r.TABLE_NAME}, FK: ${r.CONSTRAINT_NAME}`);
  }

  // 2. Drop all FK constraints referencing users.id from old tables.
  //    These are leftover tables from a previous schema — just remove the constraints
  //    so the new schema can create the users table cleanly.
  const seen = new Set();
  for (const r of rows) {
    const key = `${r.TABLE_NAME}::${r.CONSTRAINT_NAME}`;
    if (seen.has(key)) continue; // same FK listed twice (multi-col)
    seen.add(key);

    try {
      await conn.query(
        `ALTER TABLE \`${r.TABLE_NAME}\` DROP FOREIGN KEY \`${r.CONSTRAINT_NAME}\``
      );
      console.log(`  [DROP FK] ${r.TABLE_NAME} → ${r.CONSTRAINT_NAME}`);
    } catch (e) {
      console.warn(`  [WARN] Could not drop ${r.CONSTRAINT_NAME} from ${r.TABLE_NAME}: ${e.message}`);
    }
  }

  console.log('\nDone. You can now start the server.');
  await conn.end();
}

main().catch(err => { console.error(err.message); process.exit(1); });
