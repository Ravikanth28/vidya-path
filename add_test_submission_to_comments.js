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

    console.log('🔧 Adding missing columns to ai_code_review_comments table...\n');

    // Check if test_submission_id exists
    const [testSubCols] = await conn.execute(
      "SHOW COLUMNS FROM ai_code_review_comments WHERE Field = 'test_submission_id'"
    );

    if (testSubCols.length === 0) {
      console.log('➕ Adding test_submission_id column...');
      await conn.execute(
        `ALTER TABLE ai_code_review_comments ADD COLUMN test_submission_id VARCHAR(100) NULL AFTER submission_id`
      );
      console.log('✅ test_submission_id added');
    } else {
      console.log('✓ test_submission_id already exists');
    }

    console.log('\n✅ Schema update complete!');

    // Show relevant columns
    const [finalCols] = await conn.execute('SHOW COLUMNS FROM ai_code_review_comments');
    console.log('\nRelevant columns:');
    finalCols.forEach(c => {
      if (['submission_id', 'test_submission_id', 'review_id'].includes(c.Field)) {
        console.log('  ✓', c.Field);
      }
    });

    conn.end();
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
})();
