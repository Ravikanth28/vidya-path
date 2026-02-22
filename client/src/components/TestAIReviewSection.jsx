import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Brain, AlertCircle, CheckCircle2, Bug, Zap, Eye, Shield, MessageSquare, MessageCircle,
    ChevronDown, ChevronUp, RefreshCw, Loader
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Component to display AI code reviews for test submissions
 * Supports: skill-tests, global-tests
 * 
 * Props:
 * - testSubmissionId: ID of the test submission (skill-{attemptId}-{problemId} or global-{subId}-{qId})
 * - testType: 'skill-test' or 'global-test'
 * - testTitle: Name of test/problem for context
 * - problemTitle: Optional specific problem/question being reviewed
 */
export default function TestAIReviewSection({ testSubmissionId, testType, testTitle = '', problemTitle = '' }) {
    const [review, setReview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedComments, setExpandedComments] = useState(new Set());
    const [refetching, setRefetching] = useState(false);

    useEffect(() => {
        if (testSubmissionId) {
            loadReview();
        }
    }, [testSubmissionId, testType]);

    const loadReview = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefetching(true);
            else setLoading(true);

            let endpoint = '';
            if (testType === 'skill-test') {
                endpoint = `/api/ai-review/test/skill/${testSubmissionId}`;
            } else if (testType === 'global-test') {
                endpoint = `/api/ai-review/test/global/${testSubmissionId}`;
            } else {
                throw new Error('Invalid test type');
            }

            const { data } = await axios.get(`${API}${endpoint}`);
            setReview(data.review);
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
            setRefetching(false);
        }
    };

    const toggleComment = (commentId) => {
        setExpandedComments(prev => {
            const newSet = new Set(prev);
            if (newSet.has(commentId)) newSet.delete(commentId);
            else newSet.add(commentId);
            return newSet;
        });
    };

    const getSeverityColor = (severity) => {
        const colors = {
            critical: '#dc2626',
            major: '#f97316',
            minor: '#eab308',
            info: '#06b6d4'
        };
        return colors[severity] || '#64748b';
    };

    const getTypeColor = (type) => {
        const colors = {
            bug: '#dc2626',
            performance: '#f97316',
            style: '#8b5cf6',
            security: '#ef4444',
            suggestion: '#06b6d4',
            praise: '#10b981'
        };
        return colors[type] || '#64748b';
    };

    const getTypeIcon = (type) => {
        const iconProps = { size: 16 };
        switch(type) {
            case 'bug': return <Bug {...iconProps} />;
            case 'performance': return <Zap {...iconProps} />;
            case 'style': return <Eye {...iconProps} />;
            case 'security': return <Shield {...iconProps} />;
            case 'suggestion': return <MessageCircle {...iconProps} />;
            case 'praise': return <CheckCircle2 {...iconProps} />;
            default: return <MessageSquare {...iconProps} />;
        }
    };

    if (loading) {
        return (
            <div style={{
                padding: '24px',
                background: '#1e293b',
                borderRadius: '12px',
                border: '1px solid #334155',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#94a3b8'
            }}>
                <Loader size={18} className="animate-spin" />
                AI Code Review is being generated...
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                padding: '24px',
                background: '#1e293b',
                borderRadius: '12px',
                border: '1px solid #334155',
                textAlign: 'center',
                color: '#f87171'
            }}>
                <AlertCircle size={20} style={{ margin: '0 auto 8px', display: 'block' }} />
                {error}
            </div>
        );
    }

    if (!review) {
        return (
            <div style={{
                padding: '24px',
                background: '#1e293b',
                borderRadius: '12px',
                border: '1px dashed #334155',
                textAlign: 'center',
                color: '#94a3b8'
            }}>
                <Brain size={20} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.6 }} />
                No AI review available yet
                <button
                    onClick={() => loadReview(true)}
                    disabled={refetching}
                    style={{
                        marginTop: '12px',
                        padding: '8px 16px',
                        background: '#3b82f6',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#fff',
                        cursor: refetching ? 'not-allowed' : 'pointer',
                        opacity: refetching ? 0.6 : 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px'
                    }}
                >
                    <RefreshCw size={14} style={{ animation: refetching ? 'spin 1s linear infinite' : 'none' }} />
                    {refetching ? 'Checking...' : 'Check for Review'}
                </button>
            </div>
        );
    }

    // Handle pending or failed status
    if (review.status === 'pending' || review.status === 'processing') {
        return (
            <div style={{
                padding: '24px',
                background: '#1e293b',
                borderRadius: '12px',
                border: '1px solid #334155',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#f59e0b'
            }}>
                <Loader size={18} className="animate-spin" />
                AI review in progress... this may take up to 10 seconds
            </div>
        );
    }

    if (review.status === 'failed') {
        return (
            <div style={{
                padding: '24px',
                background: '#1e293b',
                borderRadius: '12px',
                border: '1px solid #334155'
            }}>
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start'
                }}>
                    <AlertCircle size={20} style={{ color: '#ef4444', marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                        <p style={{
                            margin: '0 0 8px',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#ef4444'
                        }}>
                            AI Review Failed
                        </p>
                        <p style={{
                            margin: '0 0 12px',
                            fontSize: '13px',
                            color: '#cbd5e1'
                        }}>
                            {review.error_message || 'The AI reviewing service encountered an error. Usually this is temporary (API rate limits).'}
                        </p>
                        <button
                            onClick={() => loadReview(true)}
                            disabled={refetching}
                            style={{
                                padding: '8px 16px',
                                background: '#3b82f6',
                                border: 'none',
                                borderRadius: '6px',
                                color: '#fff',
                                cursor: refetching ? 'not-allowed' : 'pointer',
                                opacity: refetching ? 0.6 : 1,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '13px',
                                fontWeight: 500
                            }}
                        >
                            <RefreshCw size={14} />
                            {refetching ? 'Retrying...' : 'Retry Review'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const comments = review.comments || [];
    const bugCount = comments.filter(c => c.comment_type === 'bug').length;
    const perfCount = comments.filter(c => c.comment_type === 'performance').length;
    const secCount = comments.filter(c => c.comment_type === 'security').length;

    return (
        <div style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            borderRadius: '12px',
            border: '1px solid #334155',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                padding: '20px',
                background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 100%)',
                borderBottom: '1px solid #334155'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Brain size={22} style={{ color: '#8b5cf6' }} />
                        <div>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>
                                AI Code Review
                            </h3>
                            {problemTitle && (
                                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                                    {problemTitle}
                                </p>
                            )}
                        </div>
                    </div>
                    <div style={{
                        padding: '6px 12px',
                        background: review.status === 'completed' ? '#10b98120' : '#f59e0b20',
                        borderRadius: '6px',
                        color: review.status === 'completed' ? '#10b981' : '#daa520',
                        fontSize: '12px',
                        fontWeight: 600
                    }}>
                        {review.status === 'completed' ? 'Completed' : 'Pending'}
                    </div>
                </div>

                {/* Summary Stats */}
                {review.status === 'completed' && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                        gap: '12px'
                    }}>
                        <div style={{
                            padding: '12px',
                            background: '#334155',
                            borderRadius: '8px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '20px', fontWeight: 700, color: '#8b5cf6' }}>
                                {review.ai_score || 0}
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                                AI Score
                            </div>
                        </div>
                        {bugCount > 0 && (
                            <div style={{
                                padding: '12px',
                                background: '#334155',
                                borderRadius: '8px',
                                textAlign: 'center',
                                borderTop: '2px solid #dc2626'
                            }}>
                                <div style={{ fontSize: '20px', fontWeight: 700, color: '#dc2626' }}>
                                    {bugCount}
                                </div>
                                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                                    Bugs
                                </div>
                            </div>
                        )}
                        {perfCount > 0 && (
                            <div style={{
                                padding: '12px',
                                background: '#334155',
                                borderRadius: '8px',
                                textAlign: 'center',
                                borderTop: '2px solid #f97316'
                            }}>
                                <div style={{ fontSize: '20px', fontWeight: 700, color: '#f97316' }}>
                                    {perfCount}
                                </div>
                                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                                    Performance
                                </div>
                            </div>
                        )}
                        {secCount > 0 && (
                            <div style={{
                                padding: '12px',
                                background: '#334155',
                                borderRadius: '8px',
                                textAlign: 'center',
                                borderTop: '2px solid #ef4444'
                            }}>
                                <div style={{ fontSize: '20px', fontWeight: 700, color: '#ef4444' }}>
                                    {secCount}
                                </div>
                                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                                    Security
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Overall Feedback */}
            {review.status === 'completed' && review.overall_feedback && (
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid #334155',
                    background: '#0f172a'
                }}>
                    <p style={{
                        margin: 0,
                        color: '#cbd5e1',
                        fontSize: '14px',
                        lineHeight: '1.6'
                    }}>
                        {review.overall_feedback}
                    </p>
                </div>
            )}

            {/* Comments List */}
            {comments.length > 0 ? (
                <div>
                    {comments.map((comment, idx) => (
                        <div
                            key={comment.id || idx}
                            style={{
                                padding: '16px',
                                borderBottom: '1px solid #334155',
                                background: idx % 2 === 0 ? '#1e293b' : '#0f172a',
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                            onClick={() => toggleComment(comment.id || idx)}
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '12px',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                                    <div style={{
                                        minWidth: '32px',
                                        height: '32px',
                                        background: getTypeColor(comment.comment_type) + '20',
                                        borderRadius: '6px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: getTypeColor(comment.comment_type)
                                    }}>
                                        {getTypeIcon(comment.comment_type)}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            marginBottom: '4px'
                                        }}>
                                            <span style={{
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                color: '#f1f5f9',
                                                textTransform: 'capitalize'
                                            }}>
                                                {comment.comment_type}
                                            </span>
                                            {comment.line_number && (
                                                <span style={{
                                                    fontSize: '12px',
                                                    color: '#94a3b8',
                                                    background: '#334155',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px'
                                                }}>
                                                    Line {comment.line_number}
                                                </span>
                                            )}
                                            <span style={{
                                                fontSize: '11px',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                background: getSeverityColor(comment.severity) + '20',
                                                color: getSeverityColor(comment.severity),
                                                textTransform: 'capitalize'
                                            }}>
                                                {comment.severity}
                                            </span>
                                        </div>
                                        <p style={{
                                            margin: 0,
                                            fontSize: '14px',
                                            color: '#cbd5e1',
                                            marginBottom: '4px'
                                        }}>
                                            {comment.message}
                                        </p>
                                        {expandedComments.has(comment.id || idx) && (
                                            <>
                                                {comment.suggestion && (
                                                    <div style={{
                                                        marginTop: '12px',
                                                        padding: '12px',
                                                        background: '#334155',
                                                        borderRadius: '6px',
                                                        borderLeft: `3px solid ${getTypeColor(comment.comment_type)}`
                                                    }}>
                                                        <div style={{
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            color: '#94a3b8',
                                                            marginBottom: '6px'
                                                        }}>
                                                            💡 Suggestion
                                                        </div>
                                                        <p style={{
                                                            margin: 0,
                                                            fontSize: '13px',
                                                            color: '#cbd5e1'
                                                        }}>
                                                            {comment.suggestion}
                                                        </p>
                                                    </div>
                                                )}
                                                {comment.code_snippet && (
                                                    <div style={{
                                                        marginTop: '12px',
                                                        padding: '12px',
                                                        background: '#0f172a',
                                                        borderRadius: '6px',
                                                        border: '1px solid #334155',
                                                        fontFamily: 'Fira Code, monospace',
                                                        overflowX: 'auto'
                                                    }}>
                                                        <pre style={{
                                                            margin: 0,
                                                            fontSize: '12px',
                                                            color: '#a1f71a',
                                                            whiteSpace: 'pre-wrap',
                                                            wordWrap: 'break-word'
                                                        }}>
                                                            {comment.code_snippet}
                                                        </pre>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div style={{
                                    color: '#94a3b8',
                                    marginTop: '2px'
                                }}>
                                    {expandedComments.has(comment.id || idx) ? (
                                        <ChevronUp size={18} />
                                    ) : (
                                        <ChevronDown size={18} />
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : review.status === 'completed' ? (
                <div style={{
                    padding: '24px',
                    textAlign: 'center',
                    color: '#10b981',
                    fontSize: '14px'
                }}>
                    ✓ Perfect code! No issues found.
                </div>
            ) : null}
        </div>
    );
}
