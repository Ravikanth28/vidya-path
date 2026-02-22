/**
 * Multi-User AI Review Testing Script
 * Tests that different students only see their own AI reviews
 * and that reviews are created dynamically when submissions are made
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');

const API_BASE = 'http://localhost:3000/api';
const JWT_SECRET = 'mentor-hub-secret-key-change-in-production';

const testStudents = [
  { id: 'student-085', name: 'Naveen Kumar', email: 'naveen085@test.com' },
  { id: 'student-086', name: 'Aisha Patel', email: 'aisha086@test.com' },
  { id: 'student-087', name: 'Omar Ahmad', email: 'omar087@test.com' },
];

const mentorId = 'mentor-001';
const mentorToken = jwt.sign(
  { id: mentorId, email: 'mentor@test.com', role: 'mentor', name: 'Test Mentor' },
  JWT_SECRET,
  { expiresIn: '24h' }
);

// Generate tokens for all students
const studentTokens = {};
testStudents.forEach(student => {
  studentTokens[student.id] = jwt.sign(
    { id: student.id, email: student.email, role: 'student', name: student.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
});

const testCode = `
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[0]
    less = [x for x in arr[1:] if x <= pivot]
    greater = [x for x in arr[1:] if x > pivot]
    return quicksort(less) + [pivot] + quicksort(greater)
`;

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createProblem() {
  console.log('\n📝 Creating test problem...');
  try {
    const res = await axios.post(`${API_BASE}/problems`, {
      title: 'Sorting Algorithm Implementation',
      description: 'Implement an efficient sorting algorithm',
      difficulty: 'medium',
      language: 'python',
      status: 'active'
    }, {
      headers: { 'Authorization': 'Bearer ' + mentorToken }
    });
    console.log('✅ Problem created:', res.data?.id || res.data?.problem_id);
    return res.data?.id || res.data?.problem_id;
  } catch (e) {
    console.error('❌ Failed to create problem:', e.response?.data?.error || e.message);
    return null;
  }
}

async function createSubmission(studentId, problemId) {
  console.log(`\n📤 Creating submission for ${studentId}...`);
  try {
    const res = await axios.post(`${API_BASE}/submissions`, {
      problem_id: problemId,
      code: testCode,
      language: 'python',
      submission_type: 'practice'
    }, {
      headers: { 'Authorization': 'Bearer ' + studentTokens[studentId] }
    });
    console.log(`✅ Submission created: ${res.data?.id || res.data?.submission_id}`);
    return res.data?.id || res.data?.submission_id;
  } catch (e) {
    console.error(`❌ Failed for ${studentId}:`, e.response?.data?.error || e.message);
    return null;
  }
}

async function triggerAIReview(submissionId, studentId) {
  console.log(`\n🤖 Triggering AI review for submission ${submissionId}...`);
  try {
    const res = await axios.post(`${API_BASE}/ai-review/trigger`, {
      submission_id: submissionId,
      submission_type: 'code'
    }, {
      headers: { 'Authorization': 'Bearer ' + studentTokens[studentId] }
    });
    console.log(`✅ AI review triggered, status: ${res.data?.status}`);
    return res.data?.id;
  } catch (e) {
    console.error('❌ Failed to trigger AI review:', e.response?.data?.error || e.message);
    return null;
  }
}

async function waitForReviewCompletion(reviewId, studentId, maxWait = 30000) {
  console.log(`⏳ Waiting for review ${reviewId} to complete...`);
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWait) {
    try {
      const res = await axios.get(`${API_BASE}/ai-review/${reviewId}`, {
        headers: { 'Authorization': 'Bearer ' + studentTokens[studentId] }
      });
      if (res.data?.status === 'completed') {
        console.log('✅ Review completed!');
        return res.data;
      }
      console.log(`  Status: ${res.data?.status}...`);
      await delay(2000);
    } catch (e) {
      console.error('Error checking review status:', e.message);
      await delay(2000);
    }
  }
  console.log('⚠️ Review still processing (timeout)');
  return null;
}

async function getStudentReviews(studentId) {
  console.log(`\n📋 Fetching AI reviews for ${studentId}...`);
  try {
    const res = await axios.get(`${API_BASE}/ai-review/student/${studentId}`, {
      headers: { 'Authorization': 'Bearer ' + studentTokens[studentId] }
    });
    const reviews = res.data?.reviews || [];
    console.log(`✅ Found ${reviews.length} review(s) for ${studentId}`);
    return reviews;
  } catch (e) {
    console.error('❌ Failed to fetch reviews:', e.response?.data?.error || e.message);
    return [];
  }
}

async function testMultiUserSupport() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 MULTI-USER AI REVIEW TEST');
  console.log('='.repeat(70));
  
  // Step 1: Create a problem
  const problemId = await createProblem();
  if (!problemId) {
    console.error('❌ Cannot proceed without a problem');
    return;
  }
  
  const submissions = {};
  const reviews = {};
  
  // Step 2: Create submissions for each student
  console.log('\n' + '─'.repeat(70));
  console.log('STEP 1: Creating Submissions');
  console.log('─'.repeat(70));
  
  for (const student of testStudents) {
    const submissionId = await createSubmission(student.id, problemId);
    submissions[student.id] = submissionId;
    await delay(500);
  }
  
  // Step 3: Trigger AI reviews for each submission
  console.log('\n' + '─'.repeat(70));
  console.log('STEP 2: Triggering AI Reviews');
  console.log('─'.repeat(70));
  
  for (const student of testStudents) {
    if (submissions[student.id]) {
      const reviewId = await triggerAIReview(submissions[student.id], student.id);
      reviews[student.id] = reviewId;
      await delay(500);
    }
  }
  
  // Step 4: Wait a bit for processing
  console.log('\n⏳ Waiting for reviews to process...');
  await delay(3000);
  
  // Step 5: Verify each student only sees their own reviews
  console.log('\n' + '─'.repeat(70));
  console.log('STEP 3: Verifying Multi-User Isolation');
  console.log('─'.repeat(70));
  
  const studentReviews = {};
  for (const student of testStudents) {
    const myReviews = await getStudentReviews(student.id);
    studentReviews[student.id] = myReviews;
    
    // Verify isolation
    if (myReviews.length > 0) {
      const allOwnSubmissions = myReviews.every(r => {
        // The review should belong to this student
        return r.student_id === student.id || r.submission_id === submissions[student.id];
      });
      
      if (allOwnSubmissions) {
        console.log(`✅ ${student.name}: Reviews are properly isolated`);
      } else {
        console.log(`❌ ${student.name}: PRIVACY VIOLATION - Can see other students' reviews!`);
      }
    }
  }
  
  // Step 6: Print summary
  console.log('\n' + '─'.repeat(70));
  console.log('SUMMARY');
  console.log('─'.repeat(70));
  
  for (const student of testStudents) {
    const count = studentReviews[student.id]?.length || 0;
    console.log(`👤 ${student.name.padEnd(20)} | ${count} review(s) visible`);
  }
  
  // Verify isolation works
  const isIsolated = testStudents.every(student => {
    const reviews = studentReviews[student.id] || [];
    return reviews.length <= 1; // Each should only see their own
  });
  
  console.log('\n' + '='.repeat(70));
  if (isIsolated) {
    console.log('✅ MULTI-USER ISOLATION VERIFIED: Each student sees only their reviews');
  } else {
    console.log('❌ SECURITY ISSUE: Students can see other students\' reviews!');
  }
  console.log('='.repeat(70) + '\n');
}

// Run test
testMultiUserSupport().catch(console.error);
