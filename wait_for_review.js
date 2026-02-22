const axios = require('axios');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'mentor-hub-secret-key-change-in-production';
const studentId = 1;
const token = jwt.sign({ id: studentId, email: 'student@test.com', role: 'student', name: 'Student' }, JWT_SECRET, { expiresIn: '24h' });

// Use the last review ID from previous test
const reviewSubmissionId = '7804bebe-5213-4f9e-8a8f-dbfa1589a053';

(async () => {
  console.log('⏳ Waiting for Cerebras AI to process review...\n');
  
  for (let i = 1; i <= 15; i++) {
    await new Promise(r => setTimeout(r, 2000));
    
    try {
      const res = await axios.get(`http://localhost:3000/api/ai-review/submission/${reviewSubmissionId}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });

      const review = res.data.review;
      console.log(`[${i}] Status: ${review.status}`);

      if (review.status === 'completed') {
        console.log('✅ Review complete!');
        console.log('  Quality:', review.overall_quality);
        console.log('  Score:', review.ai_score);
        console.log('  Total Issues:', review.total_issues);
        console.log('  Bugs:', review.bug_count);
        console.log('  Performance Issues:', review.performance_count);
        console.log('  Style Issues:', review.style_count);
        console.log('  Security Issues:', review.security_count);
        console.log('  Comments:', review.comments?.length || 0);
        if (review.overall_feedback) {
          console.log('  Feedback:', review.overall_feedback.substring(0, 150) + '...');
        }
        process.exit(0);
      } else if (review.status === 'failed') {
        console.log('❌ Review failed');
        console.log('  Error:', review.error_message);
        process.exit(1);
      }
    } catch (e) {
      console.log('Error:', e.message);
      process.exit(1);
    }
  }
  
  console.log('⏱️ Review still processing after 30 seconds...');
  process.exit(0);
})();
