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

    // Find NAVEEN KUMAR user
    const [users] = await conn.execute('SELECT id, name, email FROM users WHERE name LIKE ? OR email LIKE ?', ['%NAVEEN%', '%naveen%']);
    
    console.log('👤 Found users:');
    if(users.length === 0) {
      console.log('  No users found with NAVEEN');
    } else {
      users.forEach(u => {
        console.log(`  ID: ${u.id}, Name: ${u.name}, Email: ${u.email}`);
      });
    }

    // Check AI reviews for different studentIds
    const [reviews] = await conn.execute('SELECT DISTINCT student_id FROM ai_code_reviews');
    console.log('\n📋 AI reviews exist for studentIds:', reviews.map(r => r.student_id).join(', '));

    // Get count
    const [count] = await conn.execute('SELECT COUNT(*) as cnt FROM ai_code_reviews');
    console.log('Total AI reviews:', count[0].cnt);

    conn.end();
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
})();
