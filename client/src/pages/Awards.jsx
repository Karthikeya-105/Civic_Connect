import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';

const BADGES = [
    { name: 'Early Adopter', icon: '🌟', desc: 'Be among the first 100 citizens to join', points: 0, earned: true },
    { name: 'First Report', icon: '📝', desc: 'Submit your first civic issue report', points: 15, earned: false },
    { name: 'Civic Volunteer', icon: '🌱', desc: 'Earn 50 points through community contributions', points: 50, earned: false },
    { name: 'Upvote Champion', icon: '👍', desc: 'Upvote 10 issues to prioritize resolution', points: 20, earned: false },
    { name: 'Community Guardian', icon: '🛡️', desc: 'Earn 100 points — Trusted civic member', points: 100, earned: false },
    { name: 'Eco Warrior', icon: '🌍', desc: 'Earn 200 points — Environmental Champion', points: 200, earned: false },
    { name: 'Civic Champion', icon: '🏆', desc: 'Earn 500 points — Top civic contributor', points: 500, earned: false },
    { name: 'Pothole Hunter', icon: '🕵️', desc: 'Report 5 road issues', points: 75, earned: false },
    { name: 'Plastic Warrior', icon: '♻️', desc: 'Sell plastic through the platform', points: 10, earned: false },
    { name: 'Swadeshi Star', icon: '🇮🇳', desc: 'Indian excellence in civic contributions', points: 50, earned: false },
    { name: 'E-Waste Recycler', icon: '💻', desc: 'Sell E-Waste through the platform', points: 20, earned: false },
];

const Awards = () => {
    const { user, refreshUser } = useAuth();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        refreshUser();
        api.get('/admin/users').then(r => setLeaderboard(r.data || [])).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const userBadgeNames = (user?.badges || []).map(b => b.name);

    const getProgressPct = (points) => {
        if (points >= 500) return 100;
        if (points >= 200) return Math.round((points / 500) * 100);
        if (points >= 100) return Math.round((points / 200) * 100);
        if (points >= 50) return Math.round((points / 100) * 100);
        return Math.round((points / 50) * 100);
    };

    return (
        <div className="page-content">
            <div className="container">
                {/* Hero */}
                <div style={{ background: 'linear-gradient(135deg,#FF9933 0%,#FFD700 50%,#FF9933 100%)', borderRadius: 16, padding: '32px', marginBottom: 28, textAlign: 'center', boxShadow: '0 8px 30px rgba(255,153,51,0.4)' }}>
                    <div style={{ fontSize: 60, marginBottom: 12 }}>🏆</div>
                    <h1 style={{ fontFamily: 'Poppins', fontSize: 28, fontWeight: 900, color: 'white', textShadow: '0 2px 8px rgba(0,0,0,0.2)', marginBottom: 8 }}>Civic Awards & Gamification</h1>
                    <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16 }}>Earn badges, climb rankings, and win rewards for civic contributions!</p>
                    {user && (
                        <div style={{ display: 'inline-flex', gap: 20, marginTop: 20, background: 'rgba(255,255,255,0.25)', borderRadius: 16, padding: '16px 32px', flexWrap: 'wrap', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 30, fontWeight: 900, color: 'white', fontFamily: 'Poppins' }}>{user.points || 0}</div>
                                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>Points</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 30, fontWeight: 900, color: 'white', fontFamily: 'Poppins' }}>{user.badges?.length || 0}</div>
                                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>Badges</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 30, fontWeight: 900, color: 'white', fontFamily: 'Poppins' }}>{user.reportCount || 0}</div>
                                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>Reports</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Level progress */}
                {user && (
                    <div className="card" style={{ marginBottom: 24 }}>
                        <div className="card-body">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <div style={{ fontWeight: 700, fontSize: 16, color: '#000080' }}>
                                    {user.level || 'Civic Newcomer'} Level Progress
                                </div>
                                <div style={{ fontSize: 13, color: '#64748b' }}>{user.points || 0} pts</div>
                            </div>
                            <div className="progress-bar-wrapper" style={{ height: 12 }}>
                                <div className="progress-bar-fill" style={{ width: `${getProgressPct(user.points || 0)}%` }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: '#64748b' }}>
                                <span>🌱 Newcomer</span><span>🌳 Volunteer</span><span>🛡️ Guardian</span><span>🌍 Warrior</span><span>🏆 Champion</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Vouchers and Rewards Banner */}
                <div style={{ background: 'linear-gradient(135deg,#138808 0%,#16a34a 100%)', borderRadius: 16, padding: '24px 32px', marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', flexWrap: 'wrap', gap: 16, boxShadow: '0 8px 25px rgba(19,136,8,0.3)' }}>
                    <div>
                        <h2 style={{ margin: 0, fontFamily: 'Poppins', fontSize: 24, fontWeight: 800 }}>🎁 Vouchers & External Rewards</h2>
                        <p style={{ margin: '8px 0 0', opacity: 0.9, fontSize: 15 }}>Redeem your hard-earned points for discounts, solar chargers, and organic farming kits!</p>
                    </div>
                    <Link to="/vouchers" style={{ background: 'white', color: '#138808', padding: '12px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 800, fontFamily: 'Poppins', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        Browse Vouchers →
                    </Link>
                </div>

                <div className="grid-2" style={{ gap: 24 }}>
                    {/* Badges Grid */}
                    <div>
                        <h3 style={{ fontWeight: 800, color: '#000080', marginBottom: 16, fontSize: 18 }}>🏅 All Badges</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            {BADGES.map((badge, i) => {
                                const earned = userBadgeNames.includes(badge.name) || (user?.points >= badge.points && badge.points > 0);
                                return (
                                    <div key={i} className="card" style={{ padding: 16, opacity: earned ? 1 : 0.5, background: earned ? 'white' : '#f8fafc', borderTop: earned ? '3px solid #FFD700' : '3px solid #e2e8f0', transition: 'all 0.2s', position: 'relative' }}>
                                        {earned && (
                                            <div style={{ position: 'absolute', top: -8, right: -8, background: '#138808', color: 'white', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, border: '2px solid white' }}>✓</div>
                                        )}
                                        <div style={{ fontSize: 32, marginBottom: 6 }}>{badge.icon}</div>
                                        <div style={{ fontWeight: 700, fontSize: 13, color: '#1a202c', marginBottom: 3 }}>{badge.name}</div>
                                        <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>{badge.desc}</div>
                                        {badge.points > 0 && <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: '#D97706' }}>🎯 Requires: {badge.points} pts</div>}
                                        {earned && <div style={{ marginTop: 6, fontSize: 11, color: '#16A34A', fontWeight: 700 }}>✅ Earned!</div>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Leaderboard */}
                    <div>
                        <h3 style={{ fontWeight: 800, color: '#000080', marginBottom: 16, fontSize: 18 }}>🥇 Citizen Leaderboard</h3>
                        <div className="card">
                            <div style={{ padding: '12px 0' }}>
                                {loading ? (
                                    <div className="loading-overlay"><div className="spinner" /></div>
                                ) : leaderboard.length === 0 ? (
                                    <div className="empty-state"><div className="icon">👥</div><h3>No data yet</h3><p>Be the first to earn points!</p></div>
                                ) : leaderboard.slice(0, 15).map((u, i) => (
                                    <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: '1px solid #f1f5f9', background: u._id === user?.id ? '#EFF6FF' : 'white' }}>
                                        <div style={{ width: 28, textAlign: 'center', fontWeight: 900, fontSize: 16, color: i === 0 ? '#FFD700' : i === 1 ? '#94A3B8' : i === 2 ? '#D97706' : '#64748b' }}>
                                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                                        </div>
                                        <div className="avatar" style={{ background: `linear-gradient(135deg,${['#FF9933', '#138808', '#000080', '#7C3AED'][i % 4]},${['#FFD700', '#16A34A', '#1a1a8d', '#A855F7'][i % 4]})` }}>
                                            {u.name?.[0] || 'U'}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700, fontSize: 14 }}>{u.name} {u._id === user?.id ? '(You)' : ''}</div>
                                            <div style={{ fontSize: 12, color: '#64748b' }}>{u.level || 'Civic Newcomer'} • {u.reportCount || 0} reports</div>
                                        </div>
                                        <div className="points-badge">{u.points || 0} pts</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* How to earn */}
                        <div className="card" style={{ marginTop: 16 }}>
                            <div className="card-header"><h3>💡 How to Earn Points</h3></div>
                            <div className="card-body">
                                {[
                                    ['📝 Report an issue', '+15 pts'],
                                    ['✅ Issue gets resolved', '+25 pts'],
                                    ['👍 Upvote an issue', '+2 pts'],
                                    ['💬 Comment on issue', '+3 pts'],
                                    ['🌟 First report bonus', '+10 pts'],
                                    ['♻️ Sell plastic/manure', '+5 pts'],
                                    ['💻 Sell E-Waste', '+10 pts'],
                                ].map(([a, p], i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < 5 ? '1px solid #f1f5f9' : 'none', fontSize: 13 }}>
                                        <span>{a}</span>
                                        <span style={{ fontWeight: 700, color: '#D97706' }}>{p}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Awards;
