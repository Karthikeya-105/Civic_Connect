import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const DEPT_COLORS = {
    'Sanitation Department': '#16a34a',
    'Public Works Department': '#2563eb',
    'Water Supply Board': '#0891b2',
    'Electricity Department': '#d97706',
    'Drainage & Infrastructure': '#7c3aed',
    'Municipal Corporation': '#64748b',
};

const STATUS_CONFIG = {
    submitted: { label: 'Submitted', color: '#64748b', bg: '#f1f5f9', next: 'progress' },
    assigned: { label: 'Assigned', color: '#2563eb', bg: '#eff6ff', next: 'progress' },
    progress: { label: 'In Progress', color: '#d97706', bg: '#fffbeb', next: 'resolved' },
    verified: { label: 'Verified', color: '#0891b2', bg: '#ecfeff', next: 'resolved' },
    resolved: { label: 'Resolved ✓', color: '#16a34a', bg: '#f0fdf4', next: null },
    rejected: { label: 'Rejected', color: '#dc2626', bg: '#fef2f2', next: null },
};

const DeptAdminDashboard = () => {
    const { user } = useAuth();
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [updatingId, setUpdatingId] = useState(null);
    const [stats, setStats] = useState({ total: 0, resolved: 0, inProgress: 0, submitted: 0 });

    const deptColor = DEPT_COLORS[user?.department] || '#138808';

    const fetchIssues = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: 50 });
            if (filter !== 'all') params.append('status', filter);
            if (search) params.append('search', search);
            const { data } = await api.get(`/admin/issues?${params}`);
            // Filter client-side by department if dept_admin
            const deptIssues = (data.issues || []).filter(i =>
                !user?.department || i.assignedDept === user.department
            );
            setIssues(deptIssues);
            setStats({
                total: deptIssues.length,
                resolved: deptIssues.filter(i => i.status === 'resolved').length,
                inProgress: deptIssues.filter(i => i.status === 'progress').length,
                submitted: deptIssues.filter(i => i.status === 'submitted').length,
            });
        } catch (err) {
            toast.error('Failed to load issues');
        } finally {
            setLoading(false);
        }
    }, [filter, search, user?.department]);

    useEffect(() => { fetchIssues(); }, [fetchIssues]);

    const updateStatus = async (issueId, newStatus) => {
        setUpdatingId(issueId);
        try {
            await api.put(`/issues/${issueId}/status`, { status: newStatus, message: `Status updated to ${newStatus} by ${user?.department}` });
            toast.success(`✅ Status updated to ${newStatus}`);
            fetchIssues();
        } catch (err) {
            toast.error(err.message || 'Update failed');
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className="page-content">
            <div className="container" style={{ maxWidth: 1200 }}>
                {/* Header */}
                <div style={{
                    background: `linear-gradient(135deg, ${deptColor}, ${deptColor}cc)`,
                    borderRadius: 16, padding: '28px 32px', marginBottom: 28, color: 'white'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                        <div style={{ fontSize: 48 }}>🏢</div>
                        <div style={{ flex: 1 }}>
                            <h1 style={{ fontFamily: 'Poppins', fontSize: 22, fontWeight: 800, margin: 0 }}>
                                {user?.department || 'Department'} Admin Panel
                            </h1>
                            <p style={{ opacity: 0.85, fontSize: 13, margin: '4px 0 0' }}>
                                Welcome, {user?.name} — manage assigned issues for your department
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            {[
                                { label: 'Total', value: stats.total, icon: '📋' },
                                { label: 'Submitted', value: stats.submitted, icon: '🆕' },
                                { label: 'In Progress', value: stats.inProgress, icon: '🔧' },
                                { label: 'Resolved', value: stats.resolved, icon: '✅' },
                            ].map(s => (
                                <div key={s.label} style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '10px 16px', textAlign: 'center', minWidth: 70 }}>
                                    <div style={{ fontSize: 20 }}>{s.icon}</div>
                                    <div style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 20 }}>{s.value}</div>
                                    <div style={{ fontSize: 11, opacity: 0.85 }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                        className="form-control"
                        placeholder="🔍 Search issues..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ maxWidth: 280, flex: 1 }}
                    />
                    {['all', 'submitted', 'assigned', 'progress', 'verified', 'resolved'].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            style={{
                                padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                fontWeight: 600, fontSize: 13,
                                background: filter === s ? deptColor : '#f1f5f9',
                                color: filter === s ? 'white' : '#374151',
                            }}
                        >
                            {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label || s}
                        </button>
                    ))}
                </div>

                {/* Issues Table */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
                        <div className="spinner" style={{ margin: '0 auto 12px' }} />
                        Loading issues...
                    </div>
                ) : issues.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', background: 'white', borderRadius: 16, color: '#64748b' }}>
                        <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
                        <div style={{ fontWeight: 700, fontSize: 18 }}>No issues found</div>
                        <div style={{ fontSize: 14, marginTop: 8 }}>
                            {filter !== 'all' ? 'Try a different filter' : 'No issues assigned to your department yet'}
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {issues.map(issue => {
                            const sc = STATUS_CONFIG[issue.status] || STATUS_CONFIG.submitted;
                            return (
                                <div key={issue._id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                    <div style={{ display: 'flex', gap: 0, alignItems: 'stretch' }}>
                                        {/* Severity bar */}
                                        <div style={{
                                            width: 5, flexShrink: 0,
                                            background: issue.severity === 'critical' ? '#dc2626' : issue.severity === 'high' ? '#ea580c' : issue.severity === 'medium' ? '#d97706' : '#64748b'
                                        }} />
                                        <div style={{ flex: 1, padding: '16px 20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                                                        <h3 style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 15, margin: 0, color: '#111827' }}>
                                                            {issue.title}
                                                        </h3>
                                                        <span style={{
                                                            background: sc.bg, color: sc.color,
                                                            borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700
                                                        }}>
                                                            {sc.label}
                                                        </span>
                                                        <span style={{
                                                            background: issue.severity === 'critical' ? '#fef2f2' : '#fff7ed',
                                                            color: issue.severity === 'critical' ? '#dc2626' : '#ea580c',
                                                            borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700
                                                        }}>
                                                            {issue.severity?.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div style={{ fontSize: 13, color: '#64748b', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                                        <span>📍 {issue.location?.address || 'N/A'}</span>
                                                        <span>👤 {issue.reportedBy?.name || 'Citizen'}</span>
                                                        <span>📅 {new Date(issue.createdAt).toLocaleDateString()}</span>
                                                        <span>👍 {issue.upvoteCount || 0}</span>
                                                    </div>
                                                </div>
                                                {/* Action buttons */}
                                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                                    {sc.next && (
                                                        <button
                                                            onClick={() => updateStatus(issue._id, sc.next)}
                                                            disabled={updatingId === issue._id}
                                                            style={{
                                                                background: deptColor, color: 'white', border: 'none',
                                                                borderRadius: 8, padding: '8px 18px', cursor: 'pointer',
                                                                fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap',
                                                                opacity: updatingId === issue._id ? 0.6 : 1,
                                                            }}
                                                        >
                                                            {updatingId === issue._id ? '⏳' : `→ Mark ${STATUS_CONFIG[sc.next]?.label}`}
                                                        </button>
                                                    )}
                                                    {issue.status !== 'resolved' && issue.status !== 'rejected' && (
                                                        <button
                                                            onClick={() => updateStatus(issue._id, 'resolved')}
                                                            disabled={updatingId === issue._id}
                                                            style={{
                                                                background: '#16a34a', color: 'white', border: 'none',
                                                                borderRadius: 8, padding: '8px 18px', cursor: 'pointer',
                                                                fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap',
                                                                opacity: updatingId === issue._id ? 0.6 : 1,
                                                            }}
                                                        >
                                                            {updatingId === issue._id ? '⏳' : `✅ Quick Resolve`}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeptAdminDashboard;
