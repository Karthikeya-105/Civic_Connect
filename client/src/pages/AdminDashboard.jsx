import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend, LineElement, PointElement, BarElement, CategoryScale, LinearScale } from 'chart.js';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

Chart.register(ArcElement, Tooltip, Legend, LineElement, PointElement, BarElement, CategoryScale, LinearScale);

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const catIcons = { garbage: '🗑️', roads: '🚧', water: '💧', sanitation: '🚽', lighting: '💡', electricity: '⚡', drainage: '🌊', other: '📌' };
const statusConfig = {
    submitted: { label: 'Submitted', color: '#2563EB', bg: '#EFF6FF' },
    verified: { label: 'Verified', color: '#059669', bg: '#ECFDF5' },
    assigned: { label: 'Assigned', color: '#D97706', bg: '#FFFBEB' },
    progress: { label: 'In Progress', color: '#D97706', bg: '#FFFBEB' },
    resolved: { label: 'Resolved ✅', color: '#16A34A', bg: '#F0FDF4' },
    closed: { label: 'Closed', color: '#64748B', bg: '#F1F5F9' },
};
const depts = ['Sanitation Department', 'Public Works Department', 'Water Supply Board', 'Electricity Department', 'Municipal Corporation'];

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [issues, setIssues] = useState([]);
    const [trucks, setTrucks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [statusForm, setStatusForm] = useState({ status: '', message: '', dept: '' });
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({ status: 'all', category: 'all' });
    const [resFile, setResFile] = useState(null);
    const [truckStatusUpdate, setTruckStatusUpdate] = useState({});

    useEffect(() => { fetchData(); fetchTrucks(); }, []);

    const fetchData = async () => {
        try {
            const [s, i] = await Promise.all([api.get('/admin/stats'), api.get('/admin/issues?limit=10')]);
            setStats(s.data);
            setIssues(i.data.issues || []);
        } catch (err) { toast.error('Access denied or server error'); }
        finally { setLoading(false); }
    };

    const fetchTrucks = async () => {
        try {
            const { data } = await api.get('/trucks');
            setTrucks(Array.isArray(data) ? data : []);
        } catch { }
    };

    const updateTruckStatus = async (truckId, status) => {
        try {
            await api.put(`/trucks/${truckId}/location`, { status });
            toast.success(`🚛 Truck status updated to ${status}`);
            fetchTrucks();
        } catch { toast.error('Failed to update truck'); }
    };

    const fetchIssues = async () => {
        const params = new URLSearchParams({ ...filters, search, limit: 20 });
        try {
            const { data } = await api.get(`/admin/issues?${params}`);
            setIssues(data.issues || []);
        } catch { }
    };

    const updateStatus = async () => {
        if (!statusForm.status) { toast.error('Select a status'); return; }
        setUpdating(true);
        try {
            const fd = new FormData();
            fd.append('status', statusForm.status);
            fd.append('message', statusForm.message);
            fd.append('assignedDept', statusForm.dept);
            if (resFile) fd.append('resolvedImage', resFile);

            const { data: updatedIssue } = await api.put(`/issues/${selectedIssue._id}/status`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });

            // Update UI instantly
            setIssues(prev => prev.map(issue => issue._id === updatedIssue._id ? updatedIssue : issue));
            toast.success('Issue updated! Citizen notified 🔔');
            setSelectedIssue(null);
            fetchData(); // refresh stats
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to update'); }
        finally { setUpdating(false); }
    };

    if (loading) return <div className="loading-overlay"><div className="spinner" /><span>Loading admin dashboard...</span></div>;

    const overview = stats?.overview || {};

    return (
        <div className="page-content">
            <div className="container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                    <div className="section-header" style={{ margin: 0 }}>
                        <h2>📊 Admin Dashboard</h2>
                        <p>Manage all civic issues across the city</p>
                    </div>
                    <Link to="/admin/analytics" className="btn btn-saffron btn-sm">📈 Full Analytics</Link>
                </div>

                {/* Stats row */}
                <div className="grid-4" style={{ marginBottom: 24 }}>
                    {[
                        { label: 'Total Issues', value: overview.total || 0, icon: '📋', color: '#EFF6FF', ic: '#2563EB' },
                        { label: 'Resolved', value: overview.resolved || 0, icon: '✅', color: '#F0FDF4', ic: '#16A34A' },
                        { label: 'In Progress', value: overview.inProgress || 0, icon: '⏳', color: '#FFFBEB', ic: '#D97706' },
                        { label: 'Resolution Rate', value: `${overview.resolutionRate || 0}%`, icon: '📊', color: '#FDF4FF', ic: '#7C3AED' },
                    ].map((s, i) => (
                        <div key={i} className="stat-card">
                            <div className="stat-icon" style={{ background: s.color }}><span style={{ fontSize: 22 }}>{s.icon}</span></div>
                            <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
                        </div>
                    ))}
                </div>

                <div className="grid-2" style={{ marginBottom: 24 }}>
                    {/* Map */}
                    <div className="card">
                        <div className="card-header"><h3>🗺️ Issues on Map</h3></div>
                        <div style={{ height: 350 }}>
                            <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                {issues.map(issue => issue.location?.lat && (
                                    <Marker key={issue._id} position={[issue.location.lat, issue.location.lng]}>
                                        <Popup>
                                            <b>{issue.title}</b><br />
                                            Status: {issue.status}<br />
                                            Dept: {issue.assignedDept}
                                        </Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                        </div>
                    </div>

                    {/* Distribution chart */}
                    <div className="card">
                        <div className="card-header"><h3>🥧 By Category</h3></div>
                        <div className="card-body">
                            {stats?.byCategory && (
                                <Doughnut data={{
                                    labels: stats.byCategory.map(x => x._id),
                                    datasets: [{ data: stats.byCategory.map(x => x.count), backgroundColor: ['#FF9933', '#138808', '#000080', '#7C3AED', '#2563EB', '#D97706', '#0369A1', '#64748B'] }]
                                }} options={{ plugins: { legend: { position: 'bottom' } }, responsive: true }} />
                            )}
                        </div>
                    </div>
                </div>

                {/* Issue Management Table */}
                <div className="card">
                    <div className="card-header">
                        <h3>📋 Issue Management</h3>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input className="form-control" style={{ width: 180, padding: '6px 10px', fontSize: 13 }} placeholder="🔍 Search..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchIssues()} />
                            <select className="form-control" style={{ width: 'auto', padding: '6px 10px', fontSize: 13 }} value={filters.status} onChange={e => { setFilters({ ...filters, status: e.target.value }); }}>
                                <option value="all">All Status</option>
                                {Object.entries(statusConfig).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                            </select>
                            <button className="btn btn-ghost btn-sm" onClick={fetchIssues}>Filter</button>
                        </div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                    {['Issue', 'Category', 'Reporter', 'Department', 'Status', 'Upvotes', 'Date', 'Action'].map(h => (
                                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {issues.map(issue => {
                                    const s = statusConfig[issue.status] || statusConfig.submitted;
                                    return (
                                        <tr key={issue._id} style={{ borderBottom: '1px solid #f1f5f9' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                                            <td style={{ padding: '10px 14px', maxWidth: 200 }}>
                                                <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.title}</div>
                                                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{issue.location?.address?.slice(0, 30) || ''}</div>
                                            </td>
                                            <td style={{ padding: '10px 14px' }}><span>{catIcons[issue.category]} {issue.category}</span></td>
                                            <td style={{ padding: '10px 14px' }}>{issue.reportedBy?.name || 'N/A'}</td>
                                            <td style={{ padding: '10px 14px', fontSize: 12 }}>{issue.assignedDept || 'Unassigned'}</td>
                                            <td style={{ padding: '10px 14px' }}><span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontWeight: 600, fontSize: 11 }}>{s.label}</span></td>
                                            <td style={{ padding: '10px 14px' }}>👍 {issue.upvoteCount || 0}</td>
                                            <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>{new Date(issue.createdAt).toLocaleDateString('en-IN')}</td>
                                            <td style={{ padding: '10px 14px' }}>
                                                <button className="btn btn-primary btn-sm" onClick={() => { setSelectedIssue(issue); setStatusForm({ status: issue.status, message: '', dept: issue.assignedDept || '' }); }}>
                                                    ✏️ Update
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Truck Fleet Management */}
                <div className="card" style={{ marginTop: 20 }}>
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>🚛 Garbage Truck Fleet Management</h3>
                        <Link to="/map" className="btn btn-ghost btn-sm">🗺️ View on Map</Link>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                    {['Vehicle', 'Driver', 'Area', 'Status', 'Last Updated', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: 12 }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {trucks.map((truck, i) => (
                                    <tr key={truck._id} style={{ borderBottom: i < trucks.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                        <td style={{ padding: '10px 14px' }}>
                                            <div style={{ fontWeight: 600 }}>{truck.vehicleName}</div>
                                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{truck.vehicleId}</div>
                                        </td>
                                        <td style={{ padding: '10px 14px' }}>{truck.driverName || 'N/A'}</td>
                                        <td style={{ padding: '10px 14px', fontSize: 12 }}>{truck.area || 'N/A'}</td>
                                        <td style={{ padding: '10px 14px' }}>
                                            <span style={{
                                                borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700,
                                                background: truck.status === 'active' ? '#f0fdf4' : truck.status === 'idle' ? '#fffbeb' : truck.status === 'maintenance' ? '#fef2f2' : '#f8fafc',
                                                color: truck.status === 'active' ? '#16a34a' : truck.status === 'idle' ? '#d97706' : truck.status === 'maintenance' ? '#dc2626' : '#64748b',
                                            }}>
                                                {truck.status === 'active' ? '🟢' : truck.status === 'idle' ? '🟡' : truck.status === 'maintenance' ? '🔴' : '⚫'} {truck.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: 12 }}>
                                            {truck.lastUpdated ? new Date(truck.lastUpdated).toLocaleTimeString() : 'N/A'}
                                        </td>
                                        <td style={{ padding: '10px 14px' }}>
                                            <select
                                                style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', cursor: 'pointer' }}
                                                value={truck.status}
                                                onChange={e => updateTruckStatus(truck._id, e.target.value)}
                                            >
                                                {['active', 'idle', 'offline', 'maintenance'].map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                                {trucks.length === 0 && (
                                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>No trucks registered</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Auto-Routing Panel */}
                <div className="card" style={{ marginTop: 20 }}>
                    <div className="card-header"><h3>🤖 AI Auto-Routing Rules</h3><span style={{ fontSize: 12, color: '#64748b' }}>Issues auto-assigned by AI</span></div>
                    <div className="card-body">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
                            {[
                                { cat: '🗑️ Garbage', dept: 'Sanitation Department', color: '#FF9933' },
                                { cat: '🚧 Roads', dept: 'Public Works Department', color: '#64748B' },
                                { cat: '💧 Water', dept: 'Water Supply Board', color: '#2563EB' },
                                { cat: '⚡ Electricity', dept: 'Electricity Department', color: '#D97706' },
                                { cat: '🌊 Drainage', dept: 'Drainage & Infrastructure', color: '#0369A1' },
                                { cat: '📌 Others', dept: 'Municipal Corporation', color: '#7C3AED' },
                            ].map((r, i) => (
                                <div key={i} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', borderLeft: `3px solid ${r.color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 600, fontSize: 13 }}>{r.cat}</span>
                                    <span style={{ fontSize: 12, color: '#64748b' }}>→ {r.dept}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Update Status Modal */}
            {selectedIssue && (
                <div className="modal-overlay" onClick={() => setSelectedIssue(null)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>✏️ Update Issue Status</h3>
                            <button onClick={() => setSelectedIssue(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#64748b' }}>×</button>
                        </div>
                        <div className="modal-body">
                            <p style={{ fontWeight: 700, marginBottom: 16, color: '#000080' }}>{selectedIssue.title}</p>
                            <div className="form-group">
                                <label className="form-label">New Status</label>
                                <select className="form-control" value={statusForm.status} onChange={e => setStatusForm({ ...statusForm, status: e.target.value })}>
                                    <option value="">Select status...</option>
                                    {Object.entries(statusConfig).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Department</label>
                                <select className="form-control" value={statusForm.dept} onChange={e => setStatusForm({ ...statusForm, dept: e.target.value })}>
                                    <option value="">Select department...</option>
                                    {depts.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Update Message (sent to citizen)</label>
                                <textarea className="form-control" rows={3} placeholder="e.g. Team dispatched. Estimated resolution in 2 days." value={statusForm.message} onChange={e => setStatusForm({ ...statusForm, message: e.target.value })} />
                            </div>
                            {statusForm.status === 'resolved' && (
                                <div className="form-group">
                                    <label className="form-label">📷 Resolution Proof Image</label>
                                    <input type="file" accept="image/*" onChange={e => setResFile(e.target.files[0])} className="form-control" />
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setSelectedIssue(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={updateStatus} disabled={updating}>{updating ? 'Updating...' : '✅ Update & Notify'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
