import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const Dashboard = () => {
    const { user, refreshUser } = useAuth();
    const [stats, setStats] = useState(null);
    const [recentIssues, setRecentIssues] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
        refreshUser();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, issuesRes] = await Promise.all([
                api.get('/issues/stats'),
                api.get('/issues/user/mine?limit=5')
            ]);
            setStats(statsRes.data);
            setRecentIssues(issuesRes.data.issues || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const statusConfig = {
        submitted: { label: 'Submitted', color: '#2563EB', bg: '#EFF6FF' },
        verified: { label: 'Verified', color: '#059669', bg: '#ECFDF5' },
        assigned: { label: 'Assigned', color: '#D97706', bg: '#FFFBEB' },
        progress: { label: 'In Progress', color: '#D97706', bg: '#FFFBEB' },
        resolved: { label: 'Resolved ✅', color: '#16A34A', bg: '#F0FDF4' },
        closed: { label: 'Closed', color: '#64748B', bg: '#F1F5F9' },
    };

    const categoryIcons = { garbage: '🗑️', roads: '🚧', water: '💧', sanitation: '🚽', lighting: '💡', electricity: '⚡', drainage: '🌊', other: '📌' };

    const getLevelEmoji = (level) => {
        const map = { 'Civic Champion': '🏆', 'Eco Warrior': '🌍', 'Community Guardian': '🛡️', 'Civic Volunteer': '🌱', 'Civic Newcomer': '🌟' };
        return map[level] || '⭐';
    };

    const getProgressToNextLevel = (points) => {
        if (points >= 500) return 100;
        if (points >= 200) return Math.round(((points - 200) / 300) * 100);
        if (points >= 100) return Math.round(((points - 100) / 100) * 100);
        if (points >= 50) return Math.round(((points - 50) / 50) * 100);
        return Math.round((points / 50) * 100);
    };

    if (loading) return <div className="loading-overlay"><div className="spinner" /><span>Loading your dashboard...</span></div>;

    return (
        <div className="page-content">
            <div className="container">
                {/* Welcome Banner */}
                <div style={{ background: 'linear-gradient(135deg,#000080,#1a1a8d)', borderRadius: 16, padding: '28px 32px', marginBottom: 24, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
                    <div>
                        <h1 style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
                            {getLevelEmoji(user?.level)} Namaste, {user?.name?.split(' ')[0]}!
                        </h1>
                        <p style={{ opacity: 0.85, fontSize: 14 }}>You are a <strong>{user?.level || 'Civic Newcomer'}</strong> — keep reporting to level up!</p>
                        <div style={{ marginTop: 14 }}>
                            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Progress to next level</div>
                            <div className="progress-bar-wrapper" style={{ width: 220 }}>
                                <div className="progress-bar-fill" style={{ width: `${getProgressToNextLevel(user?.points || 0)}%` }} />
                            </div>
                            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>{user?.points || 0} points</div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div className="points-badge" style={{ fontSize: 18, padding: '8px 20px' }}>⭐ {user?.points || 0} Points</div>
                        <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            <Link to="/report" className="btn btn-saffron">📝 Report Issue</Link>
                            <Link to="/map" className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'white' }}>🗺️ View Map</Link>
                        </div>
                    </div>
                </div>

                {/* Personal Stats */}
                <div className="grid-4" style={{ marginBottom: 24 }}>
                    {[
                        { label: 'Issues Reported', value: user?.reportCount || 0, icon: '📋', color: '#EFF6FF', ic: '#2563EB' },
                        { label: 'Issues Resolved', value: user?.resolvedCount || 0, icon: '✅', color: '#F0FDF4', ic: '#16A34A' },
                        { label: 'Points Earned', value: user?.points || 0, icon: '⭐', color: '#FFFBEB', ic: '#D97706' },
                        { label: 'Badges', value: user?.badges?.length || 0, icon: '🏅', color: '#FDF4FF', ic: '#7C3AED' },
                    ].map((s, i) => (
                        <div key={i} className="stat-card">
                            <div className="stat-icon" style={{ background: s.color }}>
                                <span style={{ fontSize: 22 }}>{s.icon}</span>
                            </div>
                            <div>
                                <div className="stat-value">{s.value}</div>
                                <div className="stat-label">{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Environmental Impact */}
                <div style={{ background: 'linear-gradient(135deg,#e8f5e9,#c8e6c9)', borderRadius: 12, padding: '20px 24px', marginBottom: 24, border: '1px solid #BBF7D0' }}>
                    <h3 style={{ color: '#15803D', marginBottom: 16, fontSize: 16, fontWeight: 700 }}>🌿 Your Environmental Impact</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12 }}>
                        {[
                            { icon: '🌳', value: (user?.treesSaved || 0).toFixed(1), label: 'Trees Saved' },
                            { icon: '☁️', value: (user?.co2Reduced || 0).toFixed(1), label: 'kg CO₂ Reduced' },
                            { icon: '📄', value: user?.paperSaved || 0, label: 'Sheets Saved' },
                        ].map((item, i) => (
                            <div key={i} style={{ textAlign: 'center', background: 'white', borderRadius: 10, padding: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                                <div style={{ fontSize: 26 }}>{item.icon}</div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: '#15803D', margin: '4px 0' }}>{item.value}</div>
                                <div style={{ fontSize: 12, color: '#64748b' }}>{item.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Issues + Community Stats */}
                <div className="grid-2">
                    {/* Recent Reports */}
                    <div className="card">
                        <div className="card-header">
                            <h3>📋 My Recent Reports</h3>
                            <Link to="/my-reports" className="btn btn-ghost btn-sm">View All</Link>
                        </div>
                        <div style={{ padding: '0 0 8px' }}>
                            {recentIssues.length === 0 ? (
                                <div className="empty-state">
                                    <div className="icon">📝</div>
                                    <h3>No reports yet</h3>
                                    <p>Be the first to report a civic issue!</p>
                                    <Link to="/report" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>Report Now</Link>
                                </div>
                            ) : recentIssues.map(issue => {
                                const s = statusConfig[issue.status] || statusConfig.submitted;
                                return (
                                    <Link key={issue._id} to={`/issues/${issue._id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid #f1f5f9', textDecoration: 'none', color: 'inherit', transition: 'background 0.2s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                                        <span style={{ fontSize: 24 }}>{categoryIcons[issue.category] || '📌'}</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.title}</div>
                                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{new Date(issue.createdAt).toLocaleDateString('en-IN')}</div>
                                        </div>
                                        <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>{s.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Community & Badges */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Community Stats */}
                        <div className="card">
                            <div className="card-header"><h3>🌐 City Stats</h3></div>
                            <div className="card-body">
                                {stats && [
                                    { label: 'Total Issues', value: stats.total, icon: '📋' },
                                    { label: 'Resolved', value: stats.resolved, icon: '✅' },
                                    { label: 'Resolution Rate', value: `${stats.resolutionRate}%`, icon: '📊' },
                                    { label: 'Avg Resolution', value: `${stats.avgResolutionDays} days`, icon: '⏱️' },
                                ].map((item, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none' }}>
                                        <span style={{ fontSize: 13, color: '#64748b' }}>{item.icon} {item.label}</span>
                                        <span style={{ fontWeight: 700, color: '#000080', fontSize: 14 }}>{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Badges */}
                        <div className="card">
                            <div className="card-header"><h3>🏅 My Badges</h3><Link to="/awards" className="btn btn-ghost btn-sm">View All</Link></div>
                            <div className="card-body">
                                {(user?.badges || []).length === 0 ? (
                                    <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center' }}>Report issues to earn badges! 🏆</p>
                                ) : (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                        {(user?.badges || []).map((badge, i) => (
                                            <div key={i} style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 600, color: '#92400E' }}>
                                                {badge.icon || '🏅'} {badge.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick actions */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginTop: 24 }}>
                    {[
                        { to: '/report', label: '📝 Report Issue', color: '#000080', bg: '#EFF6FF' },
                        { to: '/map', label: '🗺️ View Map', color: '#138808', bg: '#F0FDF4' },
                        { to: '/sell/plastic', label: '♻️ Sell Plastic', color: '#D97706', bg: '#FFFBEB' },
                        { to: '/sell/manure', label: '🌿 Sell Manure', color: '#15803D', bg: '#F0FDF4' },
                        { to: '/awards', label: '🏆 Awards', color: '#7C3AED', bg: '#FDF4FF' },
                    ].map((q, i) => (
                        <Link key={i} to={q.to} style={{ background: q.bg, border: `1px solid ${q.color}20`, borderRadius: 10, padding: '14px 16px', color: q.color, fontWeight: 700, fontSize: 14, textDecoration: 'none', display: 'block', textAlign: 'center', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = q.color; e.currentTarget.style.color = 'white'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = q.bg; e.currentTarget.style.color = q.color; }}>
                            {q.label}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
