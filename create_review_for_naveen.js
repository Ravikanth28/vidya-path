const axios = require('axios');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'mentor-hub-secret-key-change-in-production';
const studentId = 'student-085'; // NAVEEN KUMAR's ID
const token = jwt.sign({ id: studentId, email: 'naveenkumar@edu.com', role: 'student', name: 'NAVEEN KUMAR' }, JWT_SECRET, { expiresIn: '24h' });

console.log('🔄 Creating submission for correct user (student-085)...\n');

(async () => {
  try {
    // 1. Create submission
    console.log('1️⃣ Creating submission...');
    const submitRes = await axios.post('http://localhost:3000/api/submissions', {
      problem_id: 1,
      language: 'javascript',
      code: `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}`,
      submission_type: 'practice'
    }, {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    const submissionId = submitRes.data.submission_id || submitRes.data.id;
    console.log('✅ Submission created:', submissionId);

    // 2. Manually trigger AI review
    console.log('\n2️⃣ Triggering AI review...');
    const triggerRes = await axios.post('http://localhost:3000/api/ai-review/trigger', {
      submissionId: submissionId,
      studentId: studentId,
      code: `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}`,
      language: 'javascript',
      problemTitle: 'Fibonacci Sequence'
    }, {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    console.log('✅ AI Review triggered:', triggerRes.data.reviewId);

    // 3. Check student dashboard
    console.log('\n3️⃣ Checking student dashboard...');
    await new Promise(r => setTimeout(r, 2000));

    const dashRes = await axios.get(`http://localhost:3000/api/ai-review/student/${studentId}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    console.log('✅ Reviews for student:', dashRes.data.reviews?.length || 0);
    if (dashRes.data.reviews && dashRes.data.reviews.length > 0) {
      console.log('   Status:', dashRes.data.reviews[0].status);
      console.log('   ID:', dashRes.data.reviews[0].id);
    }

    console.log('\n✅ Refresh your browser to see the new review!');

  } catch (e) {
    console.log('❌ Error:', e.response?.data?.error || e.message);
  }
})();
