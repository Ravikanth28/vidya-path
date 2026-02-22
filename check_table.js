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

    // Check if table exists
    const [tables] = await conn.execute("SHOW TABLES LIKE 'ai_code_reviews'");
    console.log('Table ai_code_reviews exists:', tables.length > 0 ? 'YES ✅' : 'NO ❌');

    if (tables.length > 0) {
      // Show schema
      const [cols] = await conn.execute('DESCRIBE ai_code_reviews');
      console.log('\nColumns:');
      cols.forEach(c => console.log('  -', c.Field));
    } else {
      // List all tables
      const [allTables] = await conn.execute('SHOW TABLES');
      console.log('\nAll tables:');
      let codeReviewTables = [];
      allTables.forEach(t => {
        const tableName = Object.values(t)[0];
        if (tableName.includes('code') || tableName.includes('review') || tableName.includes('ai')) {
          codeReviewTables.push(tableName);
        }
      });
      if (codeReviewTables.length > 0) {
        codeReviewTables.forEach(t => console.log('  -', t));
      } else {
        console.log('  (no code/review/ai related tables found)');
      }
    }

    conn.end();
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
