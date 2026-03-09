const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'AdminPortal.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

const regex = /<div className="modal-overlay" onClick=\{onClose\}>[\s\S]*?(?=\}\s*\/\/\s*==================== ADMIN ML REPORT MODAL ====================)/;

const newHTML = `<div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }}>
            <div className="modal-content p-0" onClick={e => e.stopPropagation()} style={{ width: '95%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', background: '#FFF7ED', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', display: 'flex', flexDirection: 'column' }}>
                
                {/* Header (Solid Orange) */}
                <div style={{ background: '#d97706', color: 'white', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                            STUDENT CRT REPORT
                        </h2>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, opacity: 0.9 }}>
                        {submission?.studentName || 'Student'} | {attempt?.company_name || 'Round Test'} | ID: {attempt?.student_id || submission?.studentId}
                        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', marginLeft: '16px', padding: 0, opacity: 0.8 }} onMouseOver={e=>e.currentTarget.style.opacity=1} onMouseOut={e=>e.currentTarget.style.opacity=0.8}>
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div style={{ padding: '0 24px 24px', flex: 1, overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '4rem', color: '#ea580c' }}>
                            <div className="loading-spinner" style={{ margin: '0 auto 1rem', borderColor: '#ea580c', borderTopColor: 'transparent' }}></div>
                            <span style={{ fontWeight: 600 }}>Loading report details...</span>
                        </div>
                    ) : !reportData ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#ea580c', fontWeight: 700 }}>No report data available.</div>
                    ) : (
                        <>
                            {/* Tabs */}
                            <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
                                <div style={{ background: 'white', border: '1px solid #fdba74', borderRadius: '30px', display: 'flex', padding: '4px', boxShadow: '0 4px 6px rgba(234, 88, 12, 0.05)', overflow: 'hidden' }}>
                                    {reportTabs.map(tab => (
                                        <button key={tab.id} onClick={() => { setActiveReportTab(tab.id); if (tab.id !== 'section') setSelectedSection(null); }}
                                            style={{
                                                padding: '10px 20px', border: 'none', cursor: 'pointer',
                                                background: activeReportTab === tab.id ? 'white' : 'transparent',
                                                color: activeReportTab === tab.id ? '#ea580c' : '#9a3412',
                                                fontSize: '0.85rem', fontWeight: 800,
                                                display: 'flex', alignItems: 'center', gap: '8px',
                                                borderRadius: '30px',
                                                boxShadow: activeReportTab === tab.id ? '0 2px 8px rgba(234, 88, 12, 0.15)' : 'none',
                                                transition: 'all 0.2s', textTransform: 'uppercase'
                                            }}
                                        >
                                            {tab.icon} {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* TAB: Overview */}
                            {activeReportTab === 'overview' && sections.length > 0 && (() => {
                                const totalCorrect = sections.reduce((s, sec) => s + (sectionScores[sec]?.correct || 0), 0);
                                const totalQs = sections.reduce((s, sec) => s + (sectionScores[sec]?.total || 0), 0);
                                const pct = Math.round(overallScore);
                                const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : 'C';

                                return (
                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', alignItems: 'start' }}>
                                    {/* OVERALL PERFORMANCE */}
                                    <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #fed7aa', padding: '24px', boxShadow: '0 4px 12px rgba(234,88,12,0.05)' }}>
                                        <h3 style={{ margin: '0 0 20px', fontSize: '1.05rem', fontWeight: 800, color: '#1f2937', textTransform: 'uppercase' }}>OVERALL PERFORMANCE</h3>
                                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '24px' }}>
                                            <div style={{ background: '#ffedd5', borderRadius: '12px', padding: '24px 20px', flex: 1, border: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                <div style={{ fontSize: '3.6rem', fontWeight: 900, color: '#b45309', lineHeight: 1 }}>{pct}%</div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1f2937', marginTop: '12px' }}>CRT Score: {grade}</div>
                                                <div style={{ fontSize: '0.9rem', color: '#1f2937', fontWeight: 600 }}>{totalCorrect}/{totalQs}</div>
                                            </div>
                                            
                                            <div style={{ width: '140px', height: '140px', position: 'relative', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', position: 'absolute', transform: 'rotate(-90deg)' }}>
                                                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#9ca3af" strokeWidth="4.5" />
                                                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#ea580c" strokeWidth="4.5" strokeDasharray={\`\${pct}, 100\`} style={{ transition: 'stroke-dasharray 1s ease' }}/>
                                                </svg>
                                                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                                                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#4b5563', textTransform: 'uppercase', marginBottom: '4px' }}>Total Score</div>
                                                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1f2937', lineHeight: 1 }}>{totalCorrect}</div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', fontWeight: 700, color: '#4b5563', marginBottom: '24px', paddingLeft: '8px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ea580c' }}></div> Points Gained: {pct}%</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: 12, height: 12, borderRadius: '50%', background: '#9ca3af' }}></div> Points Remaining: {100 - pct}%</span>
                                        </div>

                                        <h4 style={{ margin: '0 0 14px', fontSize: '1.05rem', fontWeight: 800, color: '#1f2937' }}>Key Indicators</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1f2937' }}>
                                                    <div style={{ background: '#10b981', color: 'white', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={14} strokeWidth={3}/></div> Proficient
                                                </span>
                                                <span style={{ color: '#1f2937' }}>{sections.filter(s => (sectionScores[s]?.score||0) >= 80).length > 0 ? Math.round((sections.filter(s => (sectionScores[s]?.score||0) >= 80).length / sections.length)*100) : 0}%</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1f2937' }}>
                                                    <div style={{ background: '#f97316', color: 'white', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trophy size={14} strokeWidth={3}/></div> Above Average
                                                </span>
                                                <span style={{ color: '#1f2937' }}>{sections.filter(s => (sectionScores[s]?.score||0) >= 60 && (sectionScores[s]?.score||0) < 80).length > 0 ? Math.round((sections.filter(s => (sectionScores[s]?.score||0) >= 60 && (sectionScores[s]?.score||0) < 80).length / sections.length)*100) : 0}%</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1f2937' }}>
                                                    <div style={{ background: '#eab308', color: 'white', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div> Needs Improvement
                                                </span>
                                                <span style={{ color: '#1f2937' }}>{sections.filter(s => (sectionScores[s]?.score||0) < 60).length > 0 ? Math.round((sections.filter(s => (sectionScores[s]?.score||0) < 60).length / sections.length)*100) : 0}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* KEY ACHIEVEMENTS */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div>
                                            <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', fontWeight: 800, color: '#1f2937', textTransform: 'uppercase' }}>KEY ACHIEVEMENTS</h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                {sections.map(sec => {
                                                    const def = SECTION_DEFS[sec]
                                                    const ss = sectionScores[sec] || {}
                                                    const secPct = Math.round(ss.score || 0)
                                                    return (
                                                        <div key={sec} onClick={() => { setActiveReportTab('section'); setSelectedSection(sec); }} style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'transform 0.2s', padding: '8px 0' }}>
                                                            <div style={{ background: '#ffedd5', width: 44, height: 44, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                                                {def?.icon || '📊'}
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontWeight: 800, color: '#1f2937', fontSize: '0.95rem' }}>{def?.label || sec}</div>
                                                                <div style={{ fontSize: '0.85rem', color: '#4b5563', fontWeight: 500, marginTop: '2px' }}>
                                                                    {secPct >= 80 ? 'High Score' : secPct >= 60 ? 'Consistent Growth' : 'Needs Review'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        {/* RECENT TREND */}
                                        <div>
                                            <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', fontWeight: 800, color: '#1f2937', textTransform: 'uppercase' }}>RECENT TREND</h3>
                                            <div style={{ height: '140px', background: 'linear-gradient(to bottom, rgba(251,146,60,0.1) 0%, transparent 100%)', borderRadius: '8px', borderBottom: '2px solid #fed7aa', position: 'relative', display: 'flex', alignItems: 'flex-end', padding: '10px 0' }}>
                                                {/* Mini chart dummy to match UI request perfectly */}
                                                <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ width: '100%', height: '100%', stroke: '#ea580c', strokeWidth: 2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                                                    <path d="M 0,35 L 20,25 L 40,28 L 60,15 L 80,15 L 100,5" />
                                                </svg>
                                                {/* Grid lines */}
                                                <div style={{ position: 'absolute', bottom: '25%', left: 0, right: 0, height: 1, background: 'rgba(0,0,0,0.05)' }}></div>
                                                <div style={{ position: 'absolute', bottom: '50%', left: 0, right: 0, height: 1, background: 'rgba(0,0,0,0.05)' }}></div>
                                                <div style={{ position: 'absolute', bottom: '75%', left: 0, right: 0, height: 1, background: 'rgba(0,0,0,0.05)' }}></div>
                                            </div>
                                        </div>
                                        
                                        {/* Download Report Button */}
                                        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                                            <button style={{ padding: '8px 20px', borderRadius: '30px', border: '1px solid #ea580c', background: 'white', color: '#ea580c', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                DOWNLOAD REPORT
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                )
                            })()}

                            {/* TAB: Section Analysis */}
                            {activeReportTab === 'section' && sections.length > 0 && (
                                <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #fed7aa', padding: '24px', boxShadow: '0 4px 12px rgba(234,88,12,0.05)' }}>
                                    <h3 style={{ margin: '0 0 20px', fontSize: '1.05rem', fontWeight: 800, color: '#1f2937', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <Layers size={18} color="#ea580c" /> Choose a Section to Review
                                    </h3>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                                        {sections.map(sec => {
                                            const def = SECTION_DEFS[sec]
                                            const ss = sectionScores[sec] || {}
                                            const pct = Math.round(ss.score || 0)
                                            const isActive = selectedSection === sec
                                            return (
                                                <button key={sec} onClick={() => setSelectedSection(isActive ? null : sec)}
                                                    style={{
                                                        padding: '16px', border: isActive ? '2px solid #ea580c' : '1px solid #fdba74',
                                                        borderRadius: '16px', cursor: 'pointer', textAlign: 'left',
                                                        background: isActive ? '#ffedd5' : 'white',
                                                        transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '12px',
                                                        boxShadow: isActive ? '0 4px 12px rgba(234,88,12,0.1)' : '0 2px 4px rgba(234,88,12,0.02)'
                                                    }}
                                                >
                                                    <span style={{ fontSize: '1.8rem' }}>{def?.icon || '📊'}</span>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '1rem', fontWeight: 800, color: isActive ? '#ea580c' : '#1f2937' }}>{def?.label || sec}</div>
                                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#9a3412', marginTop: 4 }}>
                                                            {ss.correct || 0} Correct · {pct}%
                                                        </div>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>

                                    {/* Detailed answers */}
                                    {selectedSection && (() => {
                                        const secAnswers = answersBySection[selectedSection] || []
                                        const def = SECTION_DEFS[selectedSection]
                                        if (secAnswers.length === 0) return (
                                            <div style={{ textAlign: 'center', padding: '3rem', color: '#9a3412', background: '#ffedd5', borderRadius: '16px', fontWeight: 700 }}>
                                                No answers recorded for this section.
                                            </div>
                                        )
                                        return (
                                            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '2px dashed #fdba74', animation: 'fadeIn 0.4s ease-out' }}>
                                                <h4 style={{ margin: '0 0 20px', fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px', color: '#1f2937' }}>
                                                    {def?.icon} {def?.label || selectedSection} — Question Review
                                                </h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                    {secAnswers.map((ans, idx) => (
                                                        <div key={ans.id || idx} style={{ padding: '16px 20px', background: ans.is_correct ? '#f0fdf4' : '#fef2f2', border: \`1px solid \${ans.is_correct ? '#86efac' : '#fca5a5'}\`, borderRadius: '12px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                                                                <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: '2px' }}>{ans.is_correct ? '✅' : '❌'}</span>
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1f2937', lineHeight: 1.5 }}>Q{idx + 1}: {ans.question}</div>
                                                                </div>
                                                                <span style={{
                                                                    fontSize: '0.85rem', padding: '4px 12px', borderRadius: '20px', fontWeight: 800, flexShrink: 0,
                                                                    background: ans.is_correct ? '#dcfce7' : '#fee2e2', color: ans.is_correct ? '#166534' : '#991b1b'
                                                                }}>{Math.round(ans.score || 0)}% Score</span>
                                                            </div>
                                                            {ans.question_type === 'mcq' && (
                                                                <div style={{ marginLeft: '36px', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                                                                    <div style={{ color: ans.is_correct ? '#15803d' : '#b91c1c', background: ans.is_correct ? '#dcfce7' : '#fee2e2', padding: '10px 14px', borderRadius: '8px', fontWeight: 600 }}>
                                                                        Student answer: <span style={{ fontWeight: 800 }}>{typeof ans.student_answer === 'object' ? JSON.stringify(ans.student_answer) : (ans.student_answer || 'Not answered')}</span>
                                                                    </div>
                                                                    {!ans.is_correct && (
                                                                        <div style={{ color: '#15803d', background: '#dcfce7', padding: '10px 14px', borderRadius: '8px', fontWeight: 600 }}>
                                                                            Correct answer: <span style={{ fontWeight: 800 }}>{typeof ans.correct_answer === 'object' ? JSON.stringify(ans.correct_answer) : ans.correct_answer}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    })()}
                                </div>
                            )}

                            {/* TAB: Time Analysis */}
                            {activeReportTab === 'time' && sections.length > 0 && (() => {
                                const timeLimits = attempt?.section_time_limits || {}
                                const timeSpentAdmin = {}
                                sections.forEach(sec => { timeSpentAdmin[sec] = sectionScores[sec]?.time_spent || 0 })
                                const totalTimeSecsAdmin = sections.reduce((s, sec) => s + (timeSpentAdmin[sec] || 0), 0)
                                const totalAllocatedSecs = sections.reduce((s, sec) => s + ((timeLimits[sec] || 0) * 60), 0)
                                const maxTimeAdmin = Math.max(...sections.map(sec => {
                                    const allocated = (timeLimits[sec] || 0) * 60
                                    return Math.max(timeSpentAdmin[sec] || 0, allocated)
                                }), 1)
                                return (
                                    <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #fed7aa', padding: '24px', boxShadow: '0 4px 12px rgba(234,88,12,0.05)' }}>
                                        <h3 style={{ margin: '0 0 24px', fontSize: '1.05rem', fontWeight: 800, color: '#1f2937', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <Clock size={18} color="#ea580c" /> Time Allocation Analysis
                                            <span style={{ marginLeft: 'auto', fontSize: '0.9rem', fontWeight: 800, color: '#c2410c', background: '#ffedd5', padding: '6px 16px', borderRadius: '20px' }}>
                                                Total Time: {fmtDur(totalTimeSecsAdmin)}{totalAllocatedSecs > 0 ? \` / \${fmtDur(totalAllocatedSecs)} allocated\` : ''}
                                            </span>
                                        </h3>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            {sections.map(sec => {
                                                const def = SECTION_DEFS[sec]
                                                const secSecs = timeSpentAdmin[sec] || 0
                                                const allocatedSecs = (timeLimits[sec] || 0) * 60
                                                const barPct = maxTimeAdmin > 0 ? Math.round((secSecs / maxTimeAdmin) * 100) : 0
                                                const allocBarPct = allocatedSecs > 0 && maxTimeAdmin > 0 ? Math.round((allocatedSecs / maxTimeAdmin) * 100) : 0
                                                const utilizationPct = allocatedSecs > 0 ? Math.min(100, Math.round((secSecs / allocatedSecs) * 100)) : null
                                                const overTime = utilizationPct > 100
                                                
                                                return (
                                                    <div key={sec} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <span style={{ fontSize: '1.2rem' }}>{def?.icon || '📊'}</span>
                                                                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1f2937' }}>{def?.label || sec}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                                {allocatedSecs > 0 && (
                                                                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: overTime ? '#ef4444' : '#10b981', background: overTime ? '#fee2e2' : '#dcfce7', padding: '2px 10px', borderRadius: '12px' }}>
                                                                        {utilizationPct}% Used
                                                                    </span>
                                                                )}
                                                                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ea580c' }}>{fmtDur(secSecs)}</span>
                                                            </div>
                                                        </div>
                                                        
                                                        <div style={{ height: 12, background: '#f3f4f6', borderRadius: 6, position: 'relative', overflow: 'hidden' }}>
                                                            {allocBarPct > 0 && (
                                                                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: \`\${allocBarPct}%\`, background: '#ffedd5', borderRight: '2px solid #fdba74' }} />
                                                            )}
                                                            <div style={{ position: 'relative', height: '100%', width: \`\${barPct}%\`, background: overTime ? '#ef4444' : 'linear-gradient(90deg,#ea580c,#f97316)', borderRadius: 6, transition: 'width 1s ease-out' }} />
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })()}
                        </>
                    )}
                </div>
            </div>
        </div>`;

content = content.replace(regex, newHTML);

fs.writeFileSync(filePath, content, 'utf-8');

const studentPath = path.join(__dirname, 'src', 'pages', 'StudentPortal.jsx');
let content2 = fs.readFileSync(studentPath, 'utf-8');
content2 = content2.replace(/<div className="modal-overlay" onClick=\{onClose\}>[\s\S]*?(?=\}\s*\/\/\s*==================== SUBMISSION REPORT MODAL WITH DETAILED SCORING ====================)/, newHTML+"\n    ");
fs.writeFileSync(studentPath, content2, 'utf-8');

console.log("Updated.");
