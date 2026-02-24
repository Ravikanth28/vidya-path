import React from 'react';

/**
 * Premium Robot Interviewer — Sitting in chair behind desk
 * Layout: Chair back → Robot → Desk in front → Items on desk
 * Mouth is large, visible, with clear speaking animation
 */
export function AvatarViewer({ speaking }) {
    const accent = speaking ? '#38BDF8' : '#0EA5E9';

    return (
        <div style={{
            width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center',
            filter: 'drop-shadow(0 10px 40px rgba(14, 165, 233, 0.12))'
        }}>
            <svg width="100%" viewBox="0 0 500 480" style={{ overflow: 'visible', maxHeight: '380px' }}>
                <defs>
                    <linearGradient id="bodyG" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFFFFF" /><stop offset="100%" stopColor="#CBD5E1" />
                    </linearGradient>
                    <linearGradient id="bodyG2" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#F8FAFC" /><stop offset="100%" stopColor="#94A3B8" />
                    </linearGradient>
                    <linearGradient id="chairG" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#334155" /><stop offset="100%" stopColor="#1E293B" />
                    </linearGradient>
                    <radialGradient id="faceG"><stop offset="0%" stopColor="#1E293B" /><stop offset="100%" stopColor="#020617" /></radialGradient>
                    <radialGradient id="eyeG"><stop offset="0%" stopColor="#60A5FA" /><stop offset="50%" stopColor="#3B82F6" /><stop offset="100%" stopColor="#1D4ED8" /></radialGradient>
                    <filter id="gl"><feGaussianBlur stdDeviation="4" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                    <filter id="sgl"><feGaussianBlur stdDeviation="2" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                    <filter id="bgl"><feGaussianBlur stdDeviation="6" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                </defs>

                {/* ===== HOLO SCREENS (Background) ===== */}
                <g opacity="0.35">
                    <rect x="30" y="15" width="115" height="75" rx="6" fill="none" stroke={accent} strokeWidth="1">
                        <animate attributeName="opacity" values="0.3;0.6;0.3" dur="4s" repeatCount="indefinite" />
                    </rect>
                    {[28, 36, 44, 52].map((y, i) => <line key={i} x1="44" y1={y} x2={100 + i * 10} y2={y} stroke={accent} strokeWidth="1.2" opacity="0.3" />)}
                    <g transform="translate(50,62)">{[0, 1, 2, 3, 4].map(i => <rect key={i} x={i * 13} y={0} width="9" height={8 + i * 3} rx="1" fill={accent} opacity="0.3">
                        <animate attributeName="height" values={`${8 + i * 3};${15 + i * 2};${8 + i * 3}`} dur={`${2 + i * 0.4}s`} repeatCount="indefinite" />
                    </rect>)}</g>
                    <rect x="355" y="20" width="115" height="70" rx="6" fill="none" stroke={accent} strokeWidth="1">
                        <animate attributeName="opacity" values="0.2;0.5;0.2" dur="5s" repeatCount="indefinite" />
                    </rect>
                    {[35, 43, 51, 59, 67].map((y, i) => <line key={i} x1="368" y1={y} x2={420 + i * 8} y2={y} stroke={accent} strokeWidth="1" opacity="0.2" />)}
                </g>

                {/* ===== OFFICE CHAIR (Behind Robot) ===== */}
                <g>
                    {/* Chair back */}
                    <rect x="190" y="120" width="120" height="160" rx="18" fill="url(#chairG)" stroke="#475569" strokeWidth="1.5" />
                    <rect x="200" y="135" width="100" height="130" rx="12" fill="#1E293B" stroke="#334155" strokeWidth="1" />
                    {/* Chair headrest */}
                    <rect x="210" y="108" width="80" height="22" rx="10" fill="#334155" stroke="#475569" strokeWidth="1" />
                    {/* Chair armrests */}
                    <rect x="155" y="250" width="40" height="12" rx="4" fill="#334155" stroke="#475569" strokeWidth="1" />
                    <rect x="305" y="250" width="40" height="12" rx="4" fill="#334155" stroke="#475569" strokeWidth="1" />
                    {/* Chair armrest supports */}
                    <rect x="160" y="260" width="8" height="40" rx="3" fill="#475569" />
                    <rect x="332" y="260" width="8" height="40" rx="3" fill="#475569" />
                    {/* Chair base/seat (partially visible) */}
                    <rect x="175" y="290" width="150" height="20" rx="8" fill="#334155" />
                    {/* Chair pole */}
                    <rect x="245" y="308" width="10" height="50" rx="3" fill="#475569" />
                    {/* Chair wheels base */}
                    <ellipse cx="250" cy="360" rx="55" ry="8" fill="#334155" stroke="#475569" strokeWidth="1" />
                    <circle cx="200" cy="363" r="6" fill="#1E293B" stroke="#475569" strokeWidth="1" />
                    <circle cx="250" cy="366" r="6" fill="#1E293B" stroke="#475569" strokeWidth="1" />
                    <circle cx="300" cy="363" r="6" fill="#1E293B" stroke="#475569" strokeWidth="1" />
                </g>

                {/* ===== ROBOT BODY (Sitting on chair) — Humanoid Torso ===== */}
                <g transform="translate(250, 265)">
                    {/* Torso — Broad shoulders, tapered waist, angular */}
                    <path d="M-65 -25 L-55 55 Q-30 70 0 72 Q30 70 55 55 L65 -25 L45 -42 Q0 -32 -45 -42 Z" fill="url(#bodyG)" stroke="#CBD5E1" strokeWidth="2" />
                    {/* Shoulder plates */}
                    <path d="M-65 -25 L-75 -15 L-65 5 Z" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" />
                    <path d="M65 -25 L75 -15 L65 5 Z" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" />
                    {/* Chest center plate */}
                    <path d="M-28 -15 L-22 40 Q0 50 22 40 L28 -15 Q0 -8 -28 -15 Z" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" />
                    {/* Chest glow lines */}
                    <line x1="-14" y1="-5" x2="-14" y2="30" stroke={accent} strokeWidth="2.5" strokeLinecap="round" opacity="0.35">
                        {speaking && <animate attributeName="opacity" values="0.2;0.7;0.2" dur="0.5s" repeatCount="indefinite" />}
                    </line>
                    <line x1="0" y1="0" x2="0" y2="35" stroke={accent} strokeWidth="2.5" strokeLinecap="round" opacity="0.35">
                        {speaking && <animate attributeName="opacity" values="0.3;0.8;0.3" dur="0.4s" repeatCount="indefinite" />}
                    </line>
                    <line x1="14" y1="-5" x2="14" y2="30" stroke={accent} strokeWidth="2.5" strokeLinecap="round" opacity="0.35">
                        {speaking && <animate attributeName="opacity" values="0.2;0.7;0.2" dur="0.6s" repeatCount="indefinite" />}
                    </line>
                    {/* Chest core */}
                    <circle cx="0" cy="12" r="14" fill="#1E293B" stroke="#334155" strokeWidth="2" />
                    <circle cx="0" cy="12" r="7" fill={speaking ? accent : '#334155'} filter={speaking ? 'url(#gl)' : 'none'}>
                        {speaking && <animate attributeName="opacity" values="0.5;1;0.5" dur="0.8s" repeatCount="indefinite" />}
                    </circle>
                    {/* Waist detail */}
                    <rect x="-30" y="48" width="60" height="5" rx="2" fill="#94A3B8" opacity="0.3" />
                    {/* Neck */}
                    <rect x="-14" y="-52" width="28" height="18" rx="5" fill="#475569" />
                    <rect x="-11" y="-47" width="22" height="3" rx="1" fill="#64748B" opacity="0.6" />
                    <rect x="-11" y="-40" width="22" height="3" rx="1" fill="#64748B" opacity="0.6" />
                </g>

                {/* ===== LEFT ARM ===== */}
                <g transform="translate(185, 240)">
                    <circle cx="0" cy="0" r="13" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" />
                    <circle cx="0" cy="0" r="5" fill="#475569" />
                    <g>
                        {speaking ? (
                            <animateTransform attributeName="transform" type="rotate" values="5;-22;5;-15;5" dur="2.2s" repeatCount="indefinite" />
                        ) : (
                            <animateTransform attributeName="transform" type="rotate" values="10;16;10" dur="4s" repeatCount="indefinite" />
                        )}
                        <rect x="-8" y="2" width="16" height="42" rx="7" fill="url(#bodyG)" stroke="#CBD5E1" strokeWidth="1" />
                        <rect x="-6" y="16" width="12" height="3" rx="1" fill="#475569" opacity="0.25" />
                        <g transform="translate(0, 44)">
                            <circle cx="0" cy="0" r="8" fill="#CBD5E1" />
                            <g>
                                {speaking ? (
                                    <animateTransform attributeName="transform" type="rotate" values="-15;-40;-15;-30;-15" dur="1.8s" repeatCount="indefinite" />
                                ) : (
                                    <animateTransform attributeName="transform" type="rotate" values="-20;-25;-20" dur="3s" repeatCount="indefinite" />
                                )}
                                <rect x="-7" y="2" width="14" height="36" rx="6" fill="url(#bodyG)" stroke="#CBD5E1" strokeWidth="1" />
                                {/* Hand with fingers */}
                                <g transform="translate(0, 40)">
                                    <ellipse cx="0" cy="3" rx="9" ry="7" fill="#E2E8F0" />
                                    <rect x="-9" y="1" width="4" height="11" rx="2" fill="#E2E8F0" transform="rotate(-10)" />
                                    <rect x="-3" y="4" width="4" height="12" rx="2" fill="#E2E8F0" />
                                    <rect x="3" y="4" width="4" height="12" rx="2" fill="#E2E8F0" />
                                    <rect x="8" y="1" width="4" height="11" rx="2" fill="#E2E8F0" transform="rotate(10)" />
                                </g>
                            </g>
                        </g>
                    </g>
                </g>

                {/* ===== RIGHT ARM ===== */}
                <g transform="translate(315, 240)">
                    <circle cx="0" cy="0" r="13" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" />
                    <circle cx="0" cy="0" r="5" fill="#475569" />
                    <g>
                        {speaking ? (
                            <animateTransform attributeName="transform" type="rotate" values="-5;-3;-5" dur="3s" repeatCount="indefinite" />
                        ) : (
                            <animateTransform attributeName="transform" type="rotate" values="-10;-16;-10" dur="2s" repeatCount="indefinite" />
                        )}
                        <rect x="-8" y="2" width="16" height="42" rx="7" fill="url(#bodyG)" stroke="#CBD5E1" strokeWidth="1" />
                        <rect x="-6" y="16" width="12" height="3" rx="1" fill="#475569" opacity="0.25" />
                        <g transform="translate(0, 44)">
                            <circle cx="0" cy="0" r="8" fill="#CBD5E1" />
                            <g>
                                {!speaking ? (
                                    <animateTransform attributeName="transform" type="rotate" values="20;26;18;24;20" dur="1.3s" repeatCount="indefinite" />
                                ) : (
                                    <animateTransform attributeName="transform" type="rotate" values="15;12;15" dur="3s" repeatCount="indefinite" />
                                )}
                                <rect x="-7" y="2" width="14" height="36" rx="6" fill="url(#bodyG)" stroke="#CBD5E1" strokeWidth="1" />
                                <g transform="translate(0, 40)">
                                    <ellipse cx="0" cy="3" rx="7" ry="5" fill="#E2E8F0" />
                                    <rect x="-2" y="1" width="5" height="9" rx="2.5" fill="#E2E8F0" />
                                    {/* Pen */}
                                    <line x1="2" y1="-3" x2="16" y2="-26" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                                    <line x1="16" y1="-26" x2="18" y2="-30" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" />
                                </g>
                            </g>
                        </g>
                    </g>
                </g>

                {/* ===== DESK (In front of robot) ===== */}
                <g>
                    {/* Desk surface — wide, in front */}
                    <rect x="40" y="330" width="420" height="14" rx="4" fill="#475569" stroke="#64748B" strokeWidth="1" />
                    {/* Desk front panel */}
                    <rect x="45" y="342" width="410" height="60" rx="3" fill="#334155" stroke="#475569" strokeWidth="0.5" />
                    {/* Desk legs */}
                    <rect x="65" y="400" width="8" height="80" rx="2" fill="#1E293B" />
                    <rect x="427" y="400" width="8" height="80" rx="2" fill="#1E293B" />

                    {/* === Desk Items ON TOP of desk === */}
                    {/* Papers (left side) */}
                    <g transform="translate(80, 300) rotate(-2)">
                        <rect width="55" height="35" rx="2" fill="#F8FAFC" opacity="0.12" stroke="#64748B" strokeWidth="0.5" />
                        <line x1="8" y1="9" x2="44" y2="9" stroke="#94A3B8" strokeWidth="0.7" opacity="0.25" />
                        <line x1="8" y1="15" x2="38" y2="15" stroke="#94A3B8" strokeWidth="0.7" opacity="0.2" />
                        <line x1="8" y1="21" x2="42" y2="21" stroke="#94A3B8" strokeWidth="0.7" opacity="0.15" />
                    </g>
                    <g transform="translate(95, 305) rotate(3)">
                        <rect width="48" height="30" rx="2" fill="#F8FAFC" opacity="0.08" stroke="#64748B" strokeWidth="0.5" />
                        <line x1="7" y1="9" x2="36" y2="9" stroke="#94A3B8" strokeWidth="0.7" opacity="0.2" />
                        <line x1="7" y1="15" x2="30" y2="15" stroke="#94A3B8" strokeWidth="0.7" opacity="0.15" />
                    </g>

                    {/* Pen cup (center-right) */}
                    <g transform="translate(265, 308)">
                        <rect width="14" height="22" rx="3" fill="#475569" stroke="#64748B" strokeWidth="0.5" />
                        <line x1="4" y1="0" x2="3" y2="-12" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
                        <line x1="10" y1="0" x2="12" y2="-10" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
                    </g>

                    {/* Laptop (right side) */}
                    <g transform="translate(340, 285)">
                        <rect width="80" height="48" rx="4" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />
                        {[14, 22, 30, 38].map((y, i) => <line key={i} x1="10" y1={y} x2={45 + i * 6} y2={y} stroke={accent} strokeWidth="1" opacity="0.2" />)}
                        <rect x="-4" y="48" width="88" height="5" rx="2" fill="#64748B" />
                    </g>

                    {/* Writing scribbles on paper when idle */}
                    {!speaking && (
                        <g transform="translate(105, 312)" opacity="0.4">
                            <line x1="0" y1="0" x2="0" y2="0" stroke={accent} strokeWidth="1" strokeLinecap="round">
                                <animate attributeName="x2" values="0;28;0" dur="1.8s" repeatCount="indefinite" />
                            </line>
                            <line x1="0" y1="5" x2="0" y2="5" stroke={accent} strokeWidth="0.8" strokeLinecap="round">
                                <animate attributeName="x2" values="0;20;0" dur="2.2s" repeatCount="indefinite" />
                            </line>
                        </g>
                    )}
                </g>

                {/* ===== HEAD (on top of everything) ===== */}
                <g transform="translate(250, 160)">
                    <g>
                        {speaking ? (
                            <animateTransform attributeName="transform" type="rotate" values="0;3;-2;3;0" dur="3s" repeatCount="indefinite" />
                        ) : (
                            <animateTransform attributeName="transform" type="rotate" values="4;7;4;5;4" dur="6s" repeatCount="indefinite" />
                        )}

                        {/* Head shape */}
                        <ellipse cx="0" cy="-5" rx="72" ry="68" fill="url(#bodyG2)" stroke="#CBD5E1" strokeWidth="2" />
                        {/* 3D highlight */}
                        <ellipse cx="-15" cy="-40" rx="30" ry="15" fill="white" opacity="0.12" />

                        {/* Face visor */}
                        <rect x="-50" y="-40" width="100" height="68" rx="24" fill="url(#faceG)" stroke="#334155" strokeWidth="2" />

                        {/* === LEFT EYE === */}
                        <g transform="translate(-22, -15)">
                            <circle cx="0" cy="0" r="20" fill={accent} opacity="0.06" filter="url(#bgl)" />
                            <circle cx="0" cy="0" r="16" fill="none" stroke={accent} strokeWidth="2" opacity="0.5" />
                            <circle cx="0" cy="0" r="13" fill="#050A15" />
                            <circle cx="0" cy="0" r="10" fill="url(#eyeG)" filter="url(#sgl)">
                                {speaking && <animate attributeName="r" values="10;12;10" dur="0.5s" repeatCount="indefinite" />}
                            </circle>
                            <circle cx="0" cy="0" r="4" fill="#0F172A" />
                            <circle cx="4" cy="-4" r="3" fill="white" opacity="0.75" />
                            <circle cx="-2" cy="3" r="1.5" fill="white" opacity="0.25" />
                            {!speaking && <ellipse cx="0" cy="0" rx="16" ry="0" fill="url(#faceG)">
                                <animate attributeName="ry" values="0;0;0;16;0;0;0" keyTimes="0;0.44;0.47;0.5;0.53;0.56;1" dur="5s" repeatCount="indefinite" />
                            </ellipse>}
                        </g>

                        {/* === RIGHT EYE === */}
                        <g transform="translate(22, -15)">
                            <circle cx="0" cy="0" r="20" fill={accent} opacity="0.06" filter="url(#bgl)" />
                            <circle cx="0" cy="0" r="16" fill="none" stroke={accent} strokeWidth="2" opacity="0.5" />
                            <circle cx="0" cy="0" r="13" fill="#050A15" />
                            <circle cx="0" cy="0" r="10" fill="url(#eyeG)" filter="url(#sgl)">
                                {speaking && <animate attributeName="r" values="10;12;10" dur="0.5s" repeatCount="indefinite" />}
                            </circle>
                            <circle cx="0" cy="0" r="4" fill="#0F172A" />
                            <circle cx="4" cy="-4" r="3" fill="white" opacity="0.75" />
                            <circle cx="-2" cy="3" r="1.5" fill="white" opacity="0.25" />
                            {!speaking && <ellipse cx="0" cy="0" rx="16" ry="0" fill="url(#faceG)">
                                <animate attributeName="ry" values="0;0;0;16;0;0;0" keyTimes="0;0.44;0.47;0.5;0.53;0.56;1" dur="5s" repeatCount="indefinite" />
                            </ellipse>}
                        </g>

                        {/* === MOUTH — CLEAR LIP-SYNC ANIMATION === */}
                        <g transform="translate(0, 14)">
                            {speaking ? (
                                <>
                                    {/* Outer mouth glow */}
                                    <ellipse cx="0" cy="0" rx="18" ry="4" fill={accent} opacity="0.15" filter="url(#bgl)">
                                        <animate attributeName="ry" values="4;12;6;10;4" dur="0.3s" repeatCount="indefinite" />
                                    </ellipse>
                                    {/* Upper lip */}
                                    <path d="M-14 -2 Q-7 -6 0 -4 Q7 -6 14 -2" fill="#1E293B" stroke={accent} strokeWidth="2" strokeLinecap="round">
                                        <animate attributeName="d" values="M-14 -2 Q-7 -6 0 -4 Q7 -6 14 -2; M-14 -1 Q-7 -8 0 -7 Q7 -8 14 -1; M-14 -2 Q-7 -6 0 -4 Q7 -6 14 -2" dur="0.25s" repeatCount="indefinite" />
                                    </path>
                                    {/* Lower lip */}
                                    <path d="M-14 -2 Q-7 6 0 8 Q7 6 14 -2" fill="#1E293B" stroke={accent} strokeWidth="2" strokeLinecap="round">
                                        <animate attributeName="d" values="M-14 -2 Q-7 6 0 8 Q7 6 14 -2; M-14 -1 Q-7 14 0 16 Q7 14 14 -1; M-14 -2 Q-7 3 0 4 Q7 3 14 -2; M-14 -2 Q-7 10 0 12 Q7 10 14 -2; M-14 -2 Q-7 6 0 8 Q7 6 14 -2" dur="0.35s" repeatCount="indefinite" />
                                    </path>
                                    {/* Inner mouth (dark opening) */}
                                    <ellipse cx="0" cy="3" rx="10" ry="3" fill="#020617">
                                        <animate attributeName="ry" values="3;8;2;6;3" dur="0.3s" repeatCount="indefinite" />
                                    </ellipse>
                                    {/* Teeth hint */}
                                    <rect x="-6" y="-1" width="12" height="3" rx="1" fill="#F0F4F8" opacity="0.6">
                                        <animate attributeName="height" values="3;1;3;2;3" dur="0.3s" repeatCount="indefinite" />
                                    </rect>
                                </>
                            ) : (
                                /* Gentle smile when idle */
                                <path d="M-12 0 Q-4 8 0 8 Q4 8 12 0" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
                            )}
                        </g>

                        {/* Antennas */}
                        <line x1="32" y1="-62" x2="44" y2="-86" stroke="#94A3B8" strokeWidth="3.5" strokeLinecap="round" />
                        <circle cx="44" cy="-86" r="6" fill={accent} filter="url(#gl)">
                            <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" />
                        </circle>
                        <line x1="-22" y1="-65" x2="-18" y2="-82" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
                        <circle cx="-18" cy="-82" r="4" fill={accent} opacity="0.7">
                            <animate attributeName="opacity" values="0.4;0.9;0.4" dur="3s" repeatCount="indefinite" />
                        </circle>

                        {/* Headphone — Left */}
                        <g transform="translate(-72, -10)">
                            <rect x="-2" y="-4" width="7" height="28" rx="2" fill="#CBD5E1" />
                            <rect x="-10" y="-7" width="13" height="36" rx="5" fill="#F0F4F8" stroke="#CBD5E1" strokeWidth="1" />
                            <circle cx="-3" cy="11" r="9" fill="#1E293B" />
                            <circle cx="-3" cy="11" r="5" fill={accent} opacity="0.5" filter="url(#sgl)">
                                {speaking && <animate attributeName="opacity" values="0.2;0.7;0.2" dur="0.6s" repeatCount="indefinite" />}
                            </circle>
                        </g>
                        {/* Headphone — Right */}
                        <g transform="translate(72, -10)">
                            <rect x="-5" y="-4" width="7" height="28" rx="2" fill="#CBD5E1" />
                            <rect x="-3" y="-7" width="13" height="36" rx="5" fill="#F0F4F8" stroke="#CBD5E1" strokeWidth="1" />
                            <circle cx="3" cy="11" r="9" fill="#1E293B" />
                            <circle cx="3" cy="11" r="5" fill={accent} opacity="0.5" filter="url(#sgl)">
                                {speaking && <animate attributeName="opacity" values="0.2;0.7;0.2" dur="0.6s" repeatCount="indefinite" />}
                            </circle>
                        </g>
                    </g>
                </g>
            </svg>

            {/* Status Badge */}
            <div style={{
                marginTop: '-15px', padding: '5px 18px',
                background: speaking ? 'rgba(56,189,248,0.08)' : 'rgba(30,41,59,0.85)',
                backdropFilter: 'blur(4px)', borderRadius: '20px',
                border: `1px solid ${accent}30`,
                display: 'flex', alignItems: 'center', gap: '8px', zIndex: 10
            }}>
                <span style={{
                    width: '7px', height: '7px', borderRadius: '50%', display: 'block',
                    backgroundColor: speaking ? '#22C55E' : '#F59E0B',
                    boxShadow: `0 0 8px ${speaking ? '#22C55E' : '#F59E0B'}`,
                    animation: 'avP 1.2s infinite'
                }} />
                <span style={{ color: '#E2E8F0', fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                    {speaking ? 'Asking Question' : 'Taking Notes'}
                </span>
            </div>
            <style>{`@keyframes avP{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.8)}}`}</style>
        </div>
    );
}
