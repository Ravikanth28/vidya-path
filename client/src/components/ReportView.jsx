import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { CheckCircle2, Target, AlertCircle, BookOpen, ChevronRight, Award, BarChart2, BarChart as LucideBarChart, MessageSquare, Sparkles, Users, Clock, Search } from 'lucide-react';

export function ReportView({ report, onClose }) {

    // Fallbacks and Intelligent Data Parsing
    const r = report || {};
    const detailedFeedback = r.detailed_feedback || "No detailed feedback generated.";

    // Robust Study Plan Parsing
    let studyPlan = [];
    if (Array.isArray(r.study_plan) && r.study_plan.length > 0) {
        studyPlan = r.study_plan;
    } else if (typeof r.study_plan === 'string' && r.study_plan.trim()) {
        // AI might have returned a string instead of an array - try to split it
        studyPlan = r.study_plan.split('\n').filter(line => line.trim()).map(line => ({
            topic: line.split(':')[0] || "Review Topic",
            action: line.split(':')[1] || line,
            duration: "Self-paced"
        }));
    }

    // Final fallback should still feel professional
    if (studyPlan.length === 0) {
        studyPlan = [
            { topic: "Technical Fundamentals", action: "Deep dive into the core concepts discussed during the interview session.", duration: "2 Days", resources: "Review interview transcript" },
            { topic: "Practice Problems", action: "Solve similar coding and SQL problems to improve speed and accuracy.", duration: "3 Days", resources: "LeetCode / HackerRank" }
        ];
    }

    // Construct Chart Data
    const barData = [
        { name: 'Core Concepts', score: r.stage_breakdown?.concepts || r.technical_accuracy || 0 },
        { name: 'Coding', score: r.stage_breakdown?.coding || r.technical_accuracy || 0 },
        { name: 'SQL', score: r.stage_breakdown?.sql || r.technical_accuracy || 0 }
    ];

    const radarData = [
        { subject: 'Technical', A: r.technical_accuracy || 0, fullMark: 100 },
        { subject: 'Communication', A: r.communication || 0, fullMark: 100 },
        { subject: 'Problem Solving', A: r.problem_solving || 0, fullMark: 100 },
        { subject: 'Overall', A: r.overall_score || 0, fullMark: 100 }
    ];

    const decisionColor =
        r.decision === 'Hired' || r.decision === 'Strong Hire' ? '#10b981' :
            r.decision === 'Declined' || r.decision === 'Rejected' ? '#ef4444' :
                '#f59e0b';

    const decisionBg =
        r.decision === 'Hired' || r.decision === 'Strong Hire' ? '#064e3b' :
            r.decision === 'Declined' || r.decision === 'Rejected' ? '#7f1d1d' :
                '#78350f';

    const getScoreColor = (score) => {
        if (score >= 80) return '#10b981'; // Green
        if (score >= 60) return '#f59e0b'; // Amber
        return '#ef4444'; // Red
    };

    const ScoreRing = ({ score, label }) => {
        const radius = 30;
        const circumference = radius * 2 * Math.PI;
        const offset = circumference - (score / 100) * circumference;
        const color = getScoreColor(score);

        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                        <circle cx="40" cy="40" r={radius} fill="none" stroke="#1e293b" strokeWidth="6" />
                        <circle cx="40" cy="40" r={radius} fill="none" stroke={color} strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
                    </svg>
                    <span style={{ position: 'absolute', fontWeight: 800, fontSize: '18px', color: '#f1f5f9' }}>{score}%</span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>{label}</span>
            </div>
        );
    };

    return (
        <div style={{ background: '#020617', minHeight: '100vh', padding: '40px', color: '#f8fafc', overflowY: 'auto' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

                {/* Header Line */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>

                    <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '10px 20px', color: '#cbd5e1', cursor: 'pointer', fontWeight: 600, fontSize: '14px', transition: '0.2s' }}>
                        ← Back to the Dashboard
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 900 }}>AI Interview Performance Report</h1>
                        <span style={{ padding: '8px 20px', borderRadius: '24px', fontWeight: 800, fontSize: '18px', background: decisionBg, color: decisionColor, border: `1px solid ${decisionColor}40`, letterSpacing: '1px', textTransform: 'uppercase' }}>
                            {r.decision}
                        </span>
                    </div>

                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '30px', marginBottom: '30px' }}>

                    {/* Left Panel: Primary Scores */}
                    <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '24px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '40px' }}>

                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '20px', letterSpacing: '1px' }}>Overall Assessment</div>
                            <div style={{ fontSize: '72px', fontWeight: 900, color: getScoreColor(r.overall_score), lineHeight: '1', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: '4px' }}>
                                {r.overall_score || 0}<span style={{ fontSize: '24px', marginTop: '10px' }}>%</span>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px_10px', justifyContent: 'center' }}>
                            <ScoreRing score={r.technical_accuracy || 0} label="Technical" />
                            <ScoreRing score={r.communication || 0} label="Comm." />
                            <ScoreRing score={r.problem_solving || 0} label="Logic" />
                        </div>

                    </div>

                    {/* Right Panel: Charts and Deep Dive */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                            {/* Bar Chart: Stage Breakdown */}
                            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '24px', padding: '30px' }}>
                                <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <BarChart2 size={20} color="#3b82f6" /> Stage Performance
                                </h3>
                                <div style={{ height: '200px', width: '100%' }}>
                                    <ResponsiveContainer>
                                        <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                            <XAxis type="number" hide domain={[0, 100]} />
                                            <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 500 }} />
                                            <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                                            <Bar dataKey="score" radius={[0, 8, 8, 0]}>
                                                {barData.map((entry, index) => (
                                                    <cell key={index} fill={getScoreColor(entry.score)} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Radar Chart: Core Competencies */}
                            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '24px', padding: '30px' }}>
                                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Target size={20} color="#8b5cf6" /> Core Competencies
                                </h3>
                                <div style={{ height: '220px', width: '100%' }}>
                                    <ResponsiveContainer>
                                        <RadarChart data={radarData} margin={{ top: 0, right: 30, bottom: 0, left: 30 }}>
                                            <PolarGrid stroke="#334155" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
                                            <Radar name="Candidate" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                                            <RechartsTooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Bottom Section: Feedback and Study Plan */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '32px' }}>

                    {/* Detailed Feedback & Strengths/Weakness */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '24px', padding: '32px', position: 'relative' }}>
                            <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <MessageSquare size={22} color="#f59e0b" /> Recruiter Evaluation
                            </h3>

                            <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', padding: '24px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '20px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Users size={32} color="white" />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '16px', marginBottom: '4px' }}>Lead Hiring Manager</div>
                                    <div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>Cerebras AI Interview Panel</div>
                                    <div style={{ margin: '16px 0 0', fontSize: '14px', lineHeight: '1.8', color: '#cbd5e1' }}>
                                        {detailedFeedback.split('\n').map((line, idx) => {
                                            const cleanLine = line.trim().replace(/^[-•]\s*/, '');
                                            if (!cleanLine) return null;
                                            return (
                                                <div key={idx} style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
                                                    <span style={{ color: '#3b82f6', fontWeight: 900 }}>▹</span>
                                                    <span>{cleanLine}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                {/* Strengths */}
                                <div style={{ background: '#020617', border: '1px solid #10b98130', borderRadius: '20px', padding: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#10b98120', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <CheckCircle2 color="#10b981" size={18} />
                                        </div>
                                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#10b981' }}>Top Strengths</h4>
                                    </div>
                                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {(r.strengths || []).map((s, i) => (
                                            <li key={i} style={{ display: 'flex', gap: '10px', fontSize: '14px', color: '#94a3b8', lineHeight: '1.5' }}>
                                                <span style={{ color: '#10b981', fontWeight: 900 }}>•</span> {s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Weaknesses */}
                                <div style={{ background: '#020617', border: '1px solid #ef444430', borderRadius: '20px', padding: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ef444420', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <AlertCircle color="#ef4444" size={18} />
                                        </div>
                                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#ef4444' }}>Development Areas</h4>
                                    </div>
                                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {(r.weaknesses || []).map((w, i) => (
                                            <li key={i} style={{ display: 'flex', gap: '10px', fontSize: '14px', color: '#94a3b8', lineHeight: '1.5' }}>
                                                <span style={{ color: '#ef4444', fontWeight: 900 }}>•</span> {w}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Personalized Study Plan */}
                    <div style={{ background: 'linear-gradient(145deg, #1e293b, #0f172a)', border: '1px solid #334155', borderRadius: '24px', padding: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Sparkles size={22} color="#3b82f6" /> Personalized Strategy
                            </h3>
                            <span style={{ fontSize: '11px', background: '#3b82f620', color: '#3b82f6', padding: '4px 12px', borderRadius: '20px', fontWeight: 700 }}>AI TAILORED</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {studyPlan.length > 0 ? studyPlan.map((plan, index) => (
                                <div key={index} style={{
                                    background: '#020617', border: '1px solid #1e293b',
                                    borderRadius: '20px', padding: '24px', position: 'relative',
                                    overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                                    transition: '0.3s transform', cursor: 'default'
                                }}>
                                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '4px', background: `hsl(${220 + index * 40}, 80%, 60%)` }} />

                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '28px', height: '28px', borderRadius: '8px',
                                                background: 'rgba(59, 130, 246, 0.1)', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center',
                                                fontSize: '13px', fontWeight: 900, color: '#3b82f6',
                                                border: '1px solid rgba(59, 130, 246, 0.2)'
                                            }}>
                                                0{index + 1}
                                            </div>
                                            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>{plan.topic}</h4>
                                        </div>
                                        {plan.duration && (
                                            <div style={{ background: '#1e293b', padding: '4px 8px', borderRadius: '6px', border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={10} color="#64748b" />
                                                <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>{plan.duration}</span>
                                            </div>
                                        )}
                                    </div>

                                    <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' }}>{plan.action}</p>

                                    {plan.resources && (
                                        <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(59, 130, 246, 0.03)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                                            <div style={{ fontSize: '10px', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Search size={10} /> Focus Areas
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5', fontWeight: 500 }}>{plan.resources}</div>
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <div style={{ padding: '40px', textAlign: 'center', background: '#020617', borderRadius: '20px', border: '1px dashed #334155' }}>
                                    <BookOpen size={40} color="#334155" style={{ marginBottom: '16px' }} />
                                    <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Insufficient data to generate a personalized study plan.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

