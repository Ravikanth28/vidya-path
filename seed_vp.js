/**
 * Standalone seed runner for VidyaPath catalog data.
 * Inserts 9 concepts, 9 lessons, 30 quiz items, 6 careers, 4 scholarships, 4 mentors.
 * Safe to re-run (INSERT IGNORE).
 *
 * Usage:
 *   node seed_vp.js
 *
 * Requires DATABASE_URL in .env or environment.
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const { seedVpCatalog } = require('./routes/vp/seed');
const { ensureVpSchema } = require('./routes/vp/migrations');

async function run() {
    const dbUrl = new URL(process.env.DATABASE_URL);
    const pool = mysql.createPool({
        host: dbUrl.hostname,
        user: dbUrl.username,
        password: dbUrl.password,
        database: dbUrl.pathname.slice(1),
        port: Number(dbUrl.port) || 4000,
        ssl: { rejectUnauthorized: true },
        connectionLimit: 3,
        timezone: '+00:00'
    });

    try {
        console.log('Connecting to database...');
        const conn = await pool.getConnection();
        conn.release();
        console.log('Connected.');

        console.log('Ensuring schema...');
        await ensureVpSchema(pool);

        console.log('Seeding catalog data...');
        await seedVpCatalog(pool);

        const [[{ lessons }]] = await pool.query('SELECT COUNT(*) AS lessons FROM vp_lessons');
        const [[{ quiz_items }]] = await pool.query('SELECT COUNT(*) AS quiz_items FROM vp_quiz_items');
        const [[{ concepts }]] = await pool.query('SELECT COUNT(*) AS concepts FROM vp_concepts');
        console.log(`Done. DB now has: ${concepts} concepts, ${lessons} lessons, ${quiz_items} quiz items.`);
    } finally {
        await pool.end();
    }
}

run().catch(err => { console.error('Seed failed:', err.message); process.exit(1); });
