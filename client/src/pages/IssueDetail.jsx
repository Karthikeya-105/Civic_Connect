import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const catIcons = { garbage: '🗑️', roads: '🚧', water: '💧', sanitation: '🚽', lighting: '💡', electricity: '⚡', drainage: '🌊', other: '📌' };
const statusConfig = {
    submitted: { label: 'Submitted', color: '#2563EB', bg: '#EFF6FF' },
    verified: { label: 'Verified', color: '#059669', bg: '#ECFDF5' },
    assigned: { label: 'Assigned', color: '#D97706', bg: '#FFFBEB' },
    progress: { label: 'In Progress', color: '#D97706', bg: '#FFFBEB' },
    resolved: { label: 'Resolved ✅', color: '#16A34A', bg: '#F0FDF4' },
    closed: { label: 'Closed', color: '#64748B', bg: '#F1F5F9' },
};

const IssueDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [issue, setIssue] = useState(null);
    const [comments, setComments] = useState([]);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [upvoting, setUpvoting] = useState(false);
    const [commenting, setCommenting] = useState(false);
    const [showBefore, setShowBefore] = useState(true);

    useEffect(() => { fetchIssue(); fetchComments(); }, [id]);

    const fetchIssue = async () => {
        try {
            const { data } = await api.get(`/issues/${id}`);
            setIssue(data);
        } catch { toast.error('Issue not found'); }
        finally { setLoading(false); }
    };

    const fetchComments = async () => {
        try {
            const { data } = await api.get(`/comments/issue/${id}`);
            setComments(data);
        } catch { }
    };

    const handleUpvote = async () => {
        if (!user) { toast.error('Login to upvote!'); return; }
        setUpvoting(true);
        try {
            const { data } = await api.put(`/issues/${id}/upvote`);
            setIssue(prev => ({ ...prev, upvoteCount: data.upvoteCount }));
            toast.success(data.upvoted ? '👍 Upvoted! +2 points' : '👎 Upvote removed');
        } catch { toast.error('Failed to upvote'); }
        finally { setUpvoting(false); }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;
        setCommenting(true);
        try {
            const { data } = await api.post(`/comments/issue/${id}`, { text: comment });
            setComments(prev => [...prev, data]);
            setComment('');
            toast.success('Comment posted!');
        } catch { toast.error('Failed to post comment'); }
        finally { setCommenting(false); }
    };

    if (loading) return <div className="loading-overlay"><div className="spinner" /><span>Loading issue details...</span></div>;
    if (!issue) return <div className="container page-content"><div className="empty-state"><div className="icon">❌</div><h3>Issue not found</h3><Link to="/my-reports" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>Back to Reports</Link></div></div>;

    const s = statusConfig[issue.status] || statusConfig.submitted;
    const userUpvoted = user && issue.upvotes?.includes(user.id);

    return (
        <div className="page-content">
            <div className="container" style={{ maxWidth: 860 }}>

                {/* Breadcrumb */}
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
                    <Link to="/my-reports" style={{ color: '#000080', textDecoration: 'none' }}>← My Reports</Link>
                    <span style={{ margin: '0 8px' }}>/</span>
                    <span>{issue.title.slice(0, 40)}{issue.title.length > 40 ? '...' : ''}</span>
                </div>

                <div className="grid-2" style={{ gap: 20 }}>
                    {/* LEFT COLUMN */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Header Card */}
                        <div className="card">
                            <div className="card-body">
                                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
                                    <div style={{ fontSize: 36 }}>{catIcons[issue.category] || '📌'}</div>
                                    <div style={{ flex: 1 }}>
                                        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1a202c', marginBottom: 8 }}>{issue.title}</h1>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            <span style={{ background: s.bg, color: s.color, padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>{s.label}</span>
                                            <span className={`badge badge-${issue.severity}`}>{issue.severity?.toUpperCase()}</span>
                                            <span className={`badge badge-${issue.category}`}>{catIcons[issue.category]} {issue.category}</span>
                                        </div>
                                    </div>
                                </div>

                                <p style={{ color: '#475569', lineHeight: 1.7, fontSize: 14, marginBottom: 16 }}>{issue.description}</p>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                                    {[
                                        ['📅 Reported', new Date(issue.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })],
                                        ['🏛️ Department', issue.assignedDept || 'Pending'],
                                        ['📍 Location', issue.location?.address || `${issue.location?.lat?.toFixed(4)}, ${issue.location?.lng?.toFixed(4)}`],
                                        ['⏱️ Est. Resolution', issue.estimatedResolution ? new Date(issue.estimatedResolution).toLocaleDateString('en-IN') : 'TBD'],
                                        ...(issue.aiCategory ? [['🤖 AI Category', `${issue.aiCategory} (${issue.aiConfidence}% confidence)`]] : []),
                                    ].map(([label, value], i) => (
                                        <div key={i} style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 12px' }}>
                                            <div style={{ fontWeight: 600, color: '#000080', fontSize: 12 }}>{label}</div>
                                            <div style={{ color: '#475569', marginTop: 2, fontSize: 13 }}>{value}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Upvote Button */}
                                <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                                    <button className={`btn ${userUpvoted ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={handleUpvote} disabled={upvoting}>
                                        👍 {userUpvoted ? 'Upvoted' : 'Upvote'} ({issue.upvoteCount || 0})
                                    </button>
                                    <span style={{ fontSize: 13, color: '#64748b' }}>Upvotes help prioritize issues for faster resolution!</span>
                                </div>
                            </div>
                        </div>

                        {/* Status Timeline */}
                        <div className="card">
                            <div className="card-header"><h3>📊 Status Timeline</h3></div>
                            <div className="card-body">
                                <div className="timeline">
                                    {(issue.timeline || []).map((t, i) => (
                                        <div key={i} className="timeline-item">
                                            <div className={`timeline-dot ${i === issue.timeline.length - 1 ? 'active' : ''}`} />
                                            <div className="timeline-content">
                                                <div style={{ fontWeight: 600, fontSize: 13, textTransform: 'capitalize' }}>{t.status}</div>
                                                <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>{t.message}</div>
                                                <div className="timeline-time">{new Date(t.timestamp).toLocaleString('en-IN')}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Images */}
                        {(issue.images?.length > 0 || issue.resolvedImage) && (
                            <div className="card">
                                <div className="card-header">
                                    <h3>📷 Evidence {issue.resolvedImage ? '(Before/After)' : ''}</h3>
                                    {issue.resolvedImage && (
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <button className={`btn btn-sm ${showBefore ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setShowBefore(true)}>Before</button>
                                            <button className={`btn btn-sm ${!showBefore ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setShowBefore(false)}>After</button>
                                        </div>
                                    )}
                                </div>
                                <div className="card-body" style={{ padding: 12 }}>
                                    {showBefore && issue.images?.map((img, i) => (
                                        <img key={i} src={img} alt={`Issue ${i + 1}`} style={{ width: '100%', borderRadius: 8, marginBottom: 8, objectFit: 'cover', maxHeight: 220 }} onError={e => e.target.style.display = 'none'} />
                                    ))}
                                    {!showBefore && issue.resolvedImage && (
                                        <div>
                                            <img src={issue.resolvedImage} alt="Resolved" style={{ width: '100%', borderRadius: 8, objectFit: 'cover', maxHeight: 220 }} />
                                            <div style={{ textAlign: 'center', marginTop: 8, color: '#16A34A', fontWeight: 700, fontSize: 14 }}>✅ Issue Resolved!</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Blockchain verification */}
                        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#166534', display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ fontSize: 18 }}>🔗</span>
                            <span>This report is secured on blockchain for transparent, tamper-proof record keeping.</span>
                        </div>

                        {/* Comments */}
                        <div className="card">
                            <div className="card-header"><h3>💬 Community Discussion ({comments.length})</h3></div>
                            <div className="card-body">
                                {user && (
                                    <form onSubmit={handleComment} style={{ marginBottom: 16 }}>
                                        <textarea className="form-control" rows={3} placeholder="Share your thoughts or additional info..." value={comment} onChange={e => setComment(e.target.value)} style={{ marginBottom: 8, fontSize: 13 }} />
                                        <button className="btn btn-primary btn-sm" type="submit" disabled={commenting || !comment.trim()}>
                                            {commenting ? 'Posting...' : '💬 Post Comment'}
                                        </button>
                                    </form>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {comments.length === 0 ? (
                                        <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>Be the first to comment!</p>
                                    ) : comments.map(c => (
                                        <div key={c._id} style={{ background: c.isOfficial ? '#EFF6FF' : '#f8fafc', border: c.isOfficial ? '1px solid #BFDBFE' : '1px solid #f1f5f9', borderRadius: 8, padding: '10px 12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                                <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                                                    {c.author?.name?.[0] || 'U'}
                                                </div>
                                                <span style={{ fontWeight: 700, fontSize: 13 }}>{c.author?.name || 'User'}</span>
                                                {c.isOfficial && <span style={{ background: '#2563EB', color: 'white', padding: '1px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>OFFICIAL</span>}
                                            </div>
                                            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{c.text}</p>
                                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>{new Date(c.createdAt).toLocaleString('en-IN')}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IssueDetail;
