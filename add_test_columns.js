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

    console.log('🔧 Adding missing columns to ai_code_reviews table...\n');

    // Check if test_submission_id exists
    const [testSubCols] = await conn.execute(
      "SHOW COLUMNS FROM ai_code_reviews WHERE Field = 'test_submission_id'"
    );

    if (testSubCols.length === 0) {
      console.log('➕ Adding test_submission_id column...');
      await conn.execute(
        `ALTER TABLE ai_code_reviews ADD COLUMN test_submission_id VARCHAR(100) NULL AFTER submission_id`
      );
      console.log('✅ test_submission_id added');
    } else {
      console.log('✓ test_submission_id already exists');
    }

    // Check if test_type exists
    const [testTypeCols] = await conn.execute(
      "SHOW COLUMNS FROM ai_code_reviews WHERE Field = 'test_type'"
    );

    if (testTypeCols.length === 0) {
      console.log('➕ Adding test_type column...');
      await conn.execute(
        `ALTER TABLE ai_code_reviews ADD COLUMN test_type VARCHAR(50) NULL AFTER test_submission_id`
      );
      console.log('✅ test_type added');
    } else {
      console.log('✓ test_type already exists');
    }

    console.log('\n✅ Schema update complete!');

    // Show final schema
    const [finalCols] = await conn.execute('DESCRIBE ai_code_reviews');
    console.log('\nFinal columns:');
    finalCols.forEach(c => {
      if (['test_submission_id', 'test_type', 'submission_id'].includes(c.Field)) {
        console.log('  ✓', c.Field);
      }
    });

    conn.end();
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
})();
