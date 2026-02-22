const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
      user: 's4Ko3L3HQZfFsJy.root',
      password: 'SthXXGh6d3dLcOTo',
      database: 'mentor_hub',
      port: 4000,
      ssl: { rejectUnauthorized: false }
    });

    // Check recent AI reviews
    console.log('🔍 Checking AI reviews...\n');
    const [reviews] = await conn.execute('SELECT id, submission_id, student_id, status, error_message FROM ai_code_reviews ORDER BY created_at DESC LIMIT 5');
    
    console.log(`Found ${reviews.length} AI reviews:`);
    reviews.forEach(r => {
      console.log(`  ID: ${r.id.substring(0, 8)}...`);
      console.log(`    Submission: ${r.submission_id ? r.submission_id.substring(0, 8) + '...' : 'null'}`);
      console.log(`    Student: ${r.student_id}`);
      console.log(`    Status: ${r.status}`);
      console.log(`    Error: ${r.error_message || 'none'}\n`);
    });

    conn.end();
  } catch (e) {
    console.error('❌ DB Error:', e.message);
  }
})();
