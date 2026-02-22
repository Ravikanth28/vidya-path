const axios = require('axios');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'mentor-hub-secret-key-change-in-production';
const studentId = 1;
const token = jwt.sign({ id: studentId, email: 'student@test.com', role: 'student', name: 'Student User' }, JWT_SECRET, { expiresIn: '24h' });

(async () => {
  try {
    console.log('🔄 Testing AI Review Workflow...\n');

    // Create a test submission
    console.log('1️⃣ Creating test submission (studentId: ' + studentId + ')...');
    const submitRes = await axios.post('http://localhost:3000/api/submissions', {
      problem_id: 1,
      language: 'javascript',
      code: `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// TODO: Add memoization for optimization`,
      submission_type: 'practice'
    }, {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    const submissionId = submitRes.data.submission_id || submitRes.data.id;
    console.log('✅ Submission created:', submissionId, '\n');

    // Try manually triggering an AI review
    console.log('2️⃣ Manually triggering AI review...');
    try {
      const triggerRes = await axios.post('http://localhost:3000/api/ai-review/trigger', {
        submissionId: submissionId,
        studentId: studentId,
        code: `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}`,
        language: 'javascript',
        problemTitle: 'Fibonacci Sequence',
        problemDescription: 'Implement fibonacci function'
      }, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      console.log('✅ Manual trigger response:', triggerRes.data, '\n');
    } catch (e) {
      console.log('⚠️ Manual trigger error:', e.response?.data?.error, '\n');
    }

    // Check the review status
    console.log('3️⃣ Checking review for submission...');
    try {
      const statusRes = await axios.get(`http://localhost:3000/api/ai-review/submission/${submissionId}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      console.log('✅ API Response:', JSON.stringify(statusRes.data, null, 2));
      console.log('   Status:', statusRes.data.review?.status);
      console.log('   ID:', statusRes.data.review?.id);
      if (statusRes.data.review?.error_message) {
        console.log('   ⚠️ Error:', statusRes.data.review.error_message);
      }
    } catch (e) {
      console.log('❌ Error fetching review:', e.response?.data?.error || e.message);
    }

    // Check student dashboard
    console.log('\n4️⃣ Checking student dashboard (studentId: ' + studentId + ')...');
    const dashRes = await axios.get(`http://localhost:3000/api/ai-review/student/${studentId}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log('✅ Total reviews for student:', dashRes.data.reviews?.length || 0);
    if (dashRes.data.reviews && dashRes.data.reviews.length > 0) {
      console.log('   ✅ Sample review found:');
      console.log('      Status:', dashRes.data.reviews[0].status);
      console.log('      Quality:', dashRes.data.reviews[0].overall_quality);
      console.log('      Score:', dashRes.data.reviews[0].ai_score);
      console.log('      Error:', dashRes.data.reviews[0].error_message);
    }

  } catch (e) {
    console.log('❌ Error:', e.response?.data || e.message);
  }
})();
