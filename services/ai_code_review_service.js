/**
 * AI Code Review Service
 * Automatically reviews student code using Cerebras AI
 * and posts structured inline comments per line.
 */

const { v4: uuidv4 } = require('uuid');

class AICodeReviewService {
    constructor(db, cerebrasChat) {
        this.db = db;
        this.cerebrasChat = cerebrasChat; // passed in from server.js
    }

    /**
     * Trigger an AI review for a submission (regular problem or test)
     * Non-blocking, runs async
     * 
     * For regular problems: passes submissionId
     * For tests: passes testSubmissionId + testType ('skill-test', 'aptitude', 'global-test')
     */
    async triggerReview(submissionId, studentId, code, language, problemTitle = '', problemDescription = '', testSubmissionId = null, testType = null) {
        // Create a review record in "pending" state
        const reviewId = uuidv4();
        
        const params = [
            reviewId,
            submissionId || null,
            testSubmissionId || null,
            testType || null,
            studentId,
            language || 'unknown',
            'pending'
        ];

        await this.db.query(
            `INSERT INTO ai_code_reviews 
            (id, submission_id, test_submission_id, test_type, student_id, language, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            params
        );

        // Run the actual AI review asynchronously (non-blocking)
        this._runReview(reviewId, submissionId, studentId, code, language, problemTitle, problemDescription, testSubmissionId, testType)
            .catch(err => {
                const errorMsg = err.message || 'Unknown error';
                console.error(`AI Review ${reviewId} failed:`, errorMsg);
                this.db.query(
                    `UPDATE ai_code_reviews SET status = 'failed', error_message = ? WHERE id = ?`,
                    [errorMsg, reviewId]
                ).catch(() => {});
            });

        return { reviewId, status: 'pending' };
    }

    /**
     * Core review logic: calls Cerebras AI and parses structured JSON response
     */
    async _runReview(reviewId, submissionId, studentId, code, language, problemTitle, problemDescription, testSubmissionId = null, testType = null) {
        // Mark as processing
        await this.db.query(
            `UPDATE ai_code_reviews SET status = 'processing' WHERE id = ?`,
            [reviewId]
        );

        const codeLines = code.split('\n');
        const totalLines = codeLines.length;

        const systemPrompt = `You are an expert code reviewer. Review the student's code and return ONLY valid JSON.
No markdown, no explanation outside JSON.

Return this exact structure:
{
  "overall_quality": "excellent|good|needs_improvement|poor",
  "overall_feedback": "2-3 sentence summary of the code",
  "ai_score": <number 0-100>,
  "comments": [
    {
      "line_number": <int>,
      "end_line": <int or null>,
      "comment_type": "bug|performance|style|security|suggestion|praise",
      "severity": "critical|major|minor|info",
      "message": "Clear description of the issue",
      "suggestion": "How to fix or improve it",
      "code_snippet": "optional improved code snippet"
    }
  ]
}

Rules:
- line_number must be between 1 and ${totalLines}
- Provide at least 3 comments, max 15
- Be specific, constructive, and educational
- Always include at least one "praise" comment if code is not completely wrong
- Focus on: correctness, efficiency, readability, security`;

        const userPrompt = `Problem: ${problemTitle || 'General coding problem'}
${problemDescription ? `Description: ${problemDescription.slice(0, 300)}` : ''}

Language: ${language}
Code (${totalLines} lines):
\`\`\`${language}
${code}
\`\`\`

Review this code thoroughly.`;

        const response = await this.cerebrasChat(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            { max_tokens: 2048, temperature: 0.3 }
        );

        const rawContent = response.choices?.[0]?.message?.content || '{}';
        
        let parsed;
        try {
            // Strip any accidental markdown code fences
            const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            parsed = JSON.parse(cleaned);
        } catch (e) {
            throw new Error('AI returned invalid JSON: ' + rawContent.slice(0, 200));
        }

        const { overall_quality, overall_feedback, ai_score, comments = [] } = parsed;

        // Count by type
        let bugCount = 0, perfCount = 0, styleCount = 0, secCount = 0;
        for (const c of comments) {
            if (c.comment_type === 'bug') bugCount++;
            else if (c.comment_type === 'performance') perfCount++;
            else if (c.comment_type === 'style') styleCount++;
            else if (c.comment_type === 'security') secCount++;
        }

        // Update review record
        await this.db.query(
            `UPDATE ai_code_reviews SET 
                status = 'completed',
                overall_quality = ?,
                overall_feedback = ?,
                ai_score = ?,
                total_issues = ?,
                bug_count = ?,
                performance_count = ?,
                style_count = ?,
                security_count = ?,
                completed_at = NOW()
            WHERE id = ?`,
            [
                overall_quality || 'needs_improvement',
                overall_feedback || '',
                ai_score || 0,
                comments.length,
                bugCount, perfCount, styleCount, secCount,
                reviewId
            ]
        );

        // Insert all comments
        for (const comment of comments) {
            const lineNo = Math.max(1, Math.min(Number(comment.line_number) || 1, totalLines));
            await this.db.query(
                `INSERT INTO ai_code_review_comments
                (id, review_id, submission_id, test_submission_id, line_number, end_line, comment_type, severity, message, suggestion, code_snippet)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    uuidv4(),
                    reviewId,
                    submissionId || null,
                    testSubmissionId || null,
                    lineNo,
                    comment.end_line || null,
                    comment.comment_type || 'suggestion',
                    comment.severity || 'minor',
                    comment.message || '',
                    comment.suggestion || null,
                    comment.code_snippet || null
                ]
            );
        }

        return { reviewId, status: 'completed', commentCount: comments.length };
    }

    /**
     * Get full review with all comments for a submission
     */
    async getReviewForSubmission(submissionId) {
        const [reviews] = await this.db.query(
            `SELECT * FROM ai_code_reviews WHERE submission_id = ? ORDER BY created_at DESC LIMIT 1`,
            [submissionId]
        );
        if (reviews.length === 0) return null;

        const review = reviews[0];
        const [comments] = await this.db.query(
            `SELECT * FROM ai_code_review_comments WHERE review_id = ? ORDER BY line_number ASC`,
            [review.id]
        );

        return { ...review, comments };
    }

    /**
     * Get all reviews for a student (mentor/admin view)
     * Shows completed reviews, marks pending/failed differently
     * Includes problem title from submissions table
     */
    async getStudentReviews(studentId, limit = 20) {
        const [reviews] = await this.db.query(
            `SELECT r.*, 
                    (SELECT COUNT(*) FROM ai_code_review_comments c WHERE c.review_id = r.id) as comment_count,
                    (SELECT title FROM problems WHERE id = r.problem_id LIMIT 1) as problem_title,
                    (SELECT title FROM submissions WHERE id = r.submission_id LIMIT 1) as submission_title
             FROM ai_code_reviews r
             WHERE r.student_id = ?
             ORDER BY r.created_at DESC
             LIMIT ?`,
            [studentId, limit]
        );
        return reviews;
    }

    /**
     * Retry a failed AI review (manually triggered)
     */
    async retryFailedReview(reviewId) {
        const [reviews] = await this.db.query(
            `SELECT * FROM ai_code_reviews WHERE id = ?`,
            [reviewId]
        );
        
        if (reviews.length === 0) throw new Error('Review not found');
        const review = reviews[0];
        
        if (review.status === 'completed') {
            throw new Error('Review already completed, no retry needed');
        }

        // Re-run the review (will be queued again)
        await this.db.query(
            `UPDATE ai_code_reviews SET status = 'pending', retry_count = retry_count + 1 WHERE id = ?`,
            [reviewId]
        );

        console.log(`[AI Review] Retrying failed review ${reviewId} (retry count: ${review.retry_count || 0})`);
        
        // Trigger again with stored data - we need to fetch it
        // For now, just mark it as pending and log
        return { success: true, message: 'Review queued for retry' };
    }

    /**
     * Mentor approves/dismisses AI review
     */
    async approveReview(reviewId, mentorId) {
        await this.db.query(
            `UPDATE ai_code_reviews SET mentor_approved = 1, mentor_id = ? WHERE id = ?`,
            [mentorId, reviewId]
        );
        return { success: true };
    }

    /**
     * Resolve a specific comment (mentor action)
     */
    async resolveComment(commentId, mentorId) {
        await this.db.query(
            `UPDATE ai_code_review_comments SET is_resolved = 1, resolved_by = ? WHERE id = ?`,
            [mentorId, commentId]
        );
        return { success: true };
    }

    /**
     * Get pending reviews (for mentor dashboard)
     */
    async getPendingReviews(mentorId, limit = 50) {
        const [rows] = await this.db.query(
            `SELECT r.*, u.name as student_name,
                    (SELECT COUNT(*) FROM ai_code_review_comments c WHERE c.review_id = r.id AND c.is_resolved = 0) as unresolved
             FROM ai_code_reviews r
             JOIN users u ON u.id = r.student_id
             WHERE u.mentor_id = ? AND r.status = 'completed' AND r.mentor_approved = 0
             ORDER BY r.completed_at DESC
             LIMIT ?`,
            [mentorId, limit]
        );
        return rows;
    }

    /**
     * Get reviews for a test submission (skill/aptitude/global test)
     */
    async getReviewForTestSubmission(testSubmissionId, testType) {
        const [reviews] = await this.db.query(
            `SELECT * FROM ai_code_reviews WHERE test_submission_id = ? AND test_type = ? ORDER BY created_at DESC LIMIT 1`,
            [testSubmissionId, testType]
        );
        if (reviews.length === 0) return null;

        const review = reviews[0];
        const [comments] = await this.db.query(
            `SELECT * FROM ai_code_review_comments WHERE review_id = ? ORDER BY line_number ASC`,
            [review.id]
        );

        return { ...review, comments };
    }

    /**
     * Get all test submission reviews for a student
     */
    async getStudentTestReviews(studentId, testType = null, limit = 20) {
        let query = `SELECT r.*, 
                    (SELECT COUNT(*) FROM ai_code_review_comments c WHERE c.review_id = r.id) as comment_count
             FROM ai_code_reviews r
             WHERE r.student_id = ? AND r.test_submission_id IS NOT NULL`;
        let params = [studentId];

        if (testType) {
            query += ` AND r.test_type = ?`;
            params.push(testType);
        }

        query += ` ORDER BY r.created_at DESC LIMIT ?`;
        params.push(limit);

        const [reviews] = await this.db.query(query, params);
        return reviews;
    }
}

module.exports = AICodeReviewService;
