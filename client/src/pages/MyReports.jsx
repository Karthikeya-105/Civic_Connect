import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const catIcons = { garbage: '🗑️', roads: '🚧', water: '💧', sanitation: '🚽', lighting: '💡', electricity: '⚡', drainage: '🌊', other: '📌' };
const statusConfig = {
    submitted: { label: 'Submitted', color: '#2563EB', bg: '#EFF6FF' },
    verified: { label: 'Verified', color: '#059669', bg: '#ECFDF5' },
    assigned: { label: 'Assigned', color: '#D97706', bg: '#FFFBEB' },
    progress: { label: 'In Progress', color: '#D97706', bg: '#FFFBEB' },
    resolved: { label: 'Resolved ✅', color: '#16A34A', bg: '#F0FDF4' },
    closed: { label: 'Closed', color: '#64748B', bg: '#F1F5F9' },
};

const MyReports = () => {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ status: 'all', category: 'all', sort: '-createdAt' });
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    useEffect(() => { fetchIssues(); }, [filters, page]);

    const fetchIssues = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ ...filters, page, limit: 10, search });
            const { data } = await api.get(`/issues/user/mine?${params}`);
            setIssues(data.issues || []);
            setTotal(data.total || 0);
        } catch { setIssues([]); } finally { setLoading(false); }
    };

    return (
        <div className="page-content">
            <div className="container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                    <div className="section-header" style={{ margin: 0 }}>
                        <h2>📋 My Reports</h2>
                        <p>{total} total reports</p>
                    </div>
                    <Link to="/report" className="btn btn-saffron">📝 New Report</Link>
                </div>

                {/* Filters */}
                <div className="card" style={{ marginBottom: 20 }}>
                    <div className="card-body" style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                            <input className="form-control" style={{ maxWidth: 220, padding: '7px 12px', fontSize: 13 }} placeholder="🔍 Search issues..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchIssues()} />
                            <select className="form-control" style={{ width: 'auto', padding: '7px 12px', fontSize: 13 }} value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
                                <option value="all">All Status</option>
                                {Object.entries(statusConfig).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                            </select>
                            <select className="form-control" style={{ width: 'auto', padding: '7px 12px', fontSize: 13 }} value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}>
                                <option value="all">All Categories</option>
                                {Object.entries(catIcons).map(([v, icon]) => <option key={v} value={v}>{icon} {v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
                            </select>
                            <select className="form-control" style={{ width: 'auto', padding: '7px 12px', fontSize: 13 }} value={filters.sort} onChange={e => setFilters({ ...filters, sort: e.target.value })}>
                                <option value="-createdAt">Newest First</option>
                                <option value="createdAt">Oldest First</option>
                                <option value="-upvoteCount">Most Upvoted</option>
                            </select>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-overlay"><div className="spinner" /><span>Loading your reports...</span></div>
                ) : issues.length === 0 ? (
                    <div className="empty-state card">
                        <div className="icon">📋</div>
                        <h3>No reports found</h3>
                        <p>Start by reporting a civic issue in your area!</p>
                        <Link to="/report" className="btn btn-primary btn-sm" style={{ marginTop: 14 }}>Report Your First Issue</Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {issues.map(issue => {
                            const s = statusConfig[issue.status] || statusConfig.submitted;
                            return (
                                <Link key={issue._id} to={`/issues/${issue._id}`} className="card issue-card-hover" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                                    <div className="card-body" style={{ padding: '16px 20px' }}>
                                        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                            <div style={{ width: 48, height: 48, background: '#f0f4f8', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                                                {catIcons[issue.category] || '📌'}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                                    <h3 style={{ fontWeight: 700, fontSize: 15, color: '#1a202c', marginBottom: 4 }}>{issue.title}</h3>
                                                    <span style={{ background: s.bg, color: s.color, padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{s.label}</span>
                                                </div>
                                                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{issue.description}</p>
                                                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#94a3b8', flexWrap: 'wrap' }}>
                                                    <span>📅 {new Date(issue.createdAt).toLocaleDateString('en-IN')}</span>
                                                    <span>👍 {issue.upvoteCount || 0} upvotes</span>
                                                    {issue.assignedDept && <span>🏛️ {issue.assignedDept}</span>}
                                                    {issue.location?.address && <span>📍 {issue.location.address.slice(0, 40)}...</span>}
                                                </div>
                                            </div>

                                            {/* Progress bubble for resolved */}
                                            {issue.status === 'resolved' && (
                                                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                                                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#F0FDF4', border: '3px solid #16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🎉</div>
                                                    <div style={{ fontSize: 11, color: '#16A34A', marginTop: 4, fontWeight: 600 }}>+25 pts</div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Status Timeline bar */}
                                        <div style={{ marginTop: 14 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                                {['submitted', 'assigned', 'progress', 'resolved'].map((step, i) => {
                                                    const steps = ['submitted', 'assigned', 'progress', 'resolved'];
                                                    const currentIdx = steps.indexOf(issue.status);
                                                    const isCompleted = i <= currentIdx;
                                                    return (
                                                        <div key={step} style={{ textAlign: 'center', flex: 1 }}>
                                                            <div style={{ width: 16, height: 16, borderRadius: '50%', background: isCompleted ? '#16A34A' : '#e2e8f0', border: issue.status === step ? '3px solid #16A34A' : 'none', margin: '0 auto', fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>
                                                                {isCompleted ? '✓' : ''}
                                                            </div>
                                                            <div style={{ fontSize: 9, color: isCompleted ? '#16A34A' : '#94a3b8', marginTop: 3, textTransform: 'capitalize', fontWeight: isCompleted ? 600 : 400 }}>
                                                                {step === 'progress' ? 'In Progress' : step}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div style={{ height: 3, background: '#e2e8f0', borderRadius: 99, position: 'relative', top: -28 }}>
                                                <div style={{ height: '100%', background: 'linear-gradient(90deg,#16A34A,#22C55E)', borderRadius: 99, width: `${(['submitted', 'assigned', 'progress', 'resolved'].indexOf(issue.status) + 1) / 4 * 100}%`, transition: 'width 0.5s ease' }} />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {total > 10 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
                        <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                        <span style={{ fontSize: 13, color: '#64748b', alignSelf: 'center' }}>Page {page}</span>
                        <button className="btn btn-ghost btn-sm" disabled={page * 10 >= total} onClick={() => setPage(p => p + 1)}>Next →</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyReports;
