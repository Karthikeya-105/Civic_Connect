import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../api';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const catColors = { garbage: '#FF9933', roads: '#64748B', water: '#2563EB', sanitation: '#7C3AED', lighting: '#D97706', electricity: '#F59E0B', drainage: '#0369A1', other: '#64748B' };
const catIcons = { garbage: '🗑️', roads: '🚧', water: '💧', sanitation: '🚽', lighting: '💡', electricity: '⚡', drainage: '🌊', other: '📌' };

const TRUCK_STATUS_COLORS = {
    active: '#16a34a',
    idle: '#d97706',
    offline: '#64748b',
    maintenance: '#dc2626',
};

function makeIcon(category, severity) {
    const color = catColors[category] || '#64748B';
    const sevColor = severity === 'high' || severity === 'critical' ? '#DC2626' : severity === 'medium' ? '#D97706' : '#16A34A';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
    <ellipse cx="16" cy="40" rx="6" ry="2" fill="rgba(0,0,0,0.2)"/>
    <path d="M16 2 C9 2 4 7 4 14 C4 24 16 38 16 38 C16 38 28 24 28 14 C28 7 23 2 16 2Z" fill="${color}" stroke="white" stroke-width="2"/>
    <circle cx="16" cy="14" r="6" fill="white" opacity="0.9"/>
    <circle cx="24" cy="6" r="5" fill="${sevColor}" stroke="white" stroke-width="1.5"/>
  </svg>`;
    return L.divIcon({ html: svg, iconSize: [32, 42], iconAnchor: [16, 42], popupAnchor: [0, -42], className: '' });
}

function makeTruckIcon(status) {
    const color = TRUCK_STATUS_COLORS[status] || '#64748b';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
    <circle cx="22" cy="22" r="20" fill="${color}" stroke="white" stroke-width="2" opacity="0.95"/>
    <text x="22" y="29" text-anchor="middle" font-size="20">🚛</text>
  </svg>`;
    return L.divIcon({ html: svg, iconSize: [44, 44], iconAnchor: [22, 22], popupAnchor: [0, -26], className: '' });
}

function HeatmapLayer({ issues, active }) {
    const map = useMap();
    const layerRef = useRef(null);

    useEffect(() => {
        if (!active) { if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; } return; }
        if (layerRef.current) map.removeLayer(layerRef.current);
        const layerGroup = L.layerGroup();
        issues.forEach(issue => {
            const sev = issue.severity;
            const r = sev === 'critical' ? 1200 : sev === 'high' ? 800 : sev === 'medium' ? 500 : 300;
            const c = sev === 'critical' || sev === 'high' ? '#DC2626' : sev === 'medium' ? '#D97706' : '#16A34A';
            L.circle([issue.location.lat, issue.location.lng], { radius: r, color: c, fillColor: c, fillOpacity: 0.2, weight: 1, opacity: 0.4 }).addTo(layerGroup);
        });
        layerGroup.addTo(map);
        layerRef.current = layerGroup;
        return () => { if (layerRef.current) map.removeLayer(layerRef.current); };
    }, [issues, active, map]);

    return null;
}

const MapView = () => {
    const [issues, setIssues] = useState([]);
    const [trucks, setTrucks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [heatmap, setHeatmap] = useState(false);
    const [showTrucks, setShowTrucks] = useState(true);
    const [filters, setFilters] = useState({ category: 'all', severity: 'all', status: 'all' });
    const [stats, setStats] = useState(null);
    const socketRef = useRef(null);

    const fetchIssues = async () => {
        try {
            const { data } = await api.get('/issues?limit=200');
            setIssues(data.issues || []);
        } catch { setIssues([]); }
        finally { setLoading(false); }
    };

    const fetchStats = async () => {
        try {
            const { data } = await api.get('/issues/stats');
            setStats(data);
        } catch { }
    };

    const fetchTrucks = async () => {
        try {
            const { data } = await api.get('/trucks');
            setTrucks(Array.isArray(data) ? data : []);
        } catch { setTrucks([]); }
    };

    useEffect(() => {
        fetchIssues();
        fetchStats();
        fetchTrucks();

        // Connect socket for live truck updates
        const BACKEND = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
        socketRef.current = io(BACKEND, { transports: ['websocket', 'polling'] });

        socketRef.current.on('truck_update', (updatedTruck) => {
            setTrucks(prev => {
                const idx = prev.findIndex(t => t._id === updatedTruck._id);
                if (idx >= 0) {
                    const updated = [...prev];
                    updated[idx] = updatedTruck;
                    return updated;
                }
                return [...prev, updatedTruck];
            });
        });

        return () => { socketRef.current?.disconnect(); };
    }, []);

    const filtered = issues.filter(i => {
        if (filters.category !== 'all' && i.category !== filters.category) return false;
        if (filters.severity !== 'all' && i.severity !== filters.severity) return false;
        if (filters.status !== 'all' && i.status !== filters.status) return false;
        return true;
    });

    const center = filtered.length > 0
        ? [filtered.reduce((sum, i) => sum + i.location.lat, 0) / filtered.length, filtered.reduce((sum, i) => sum + i.location.lng, 0) / filtered.length]
        : [20.5937, 78.9629];

    const activeTrucks = trucks.filter(t => t.status === 'active').length;

    return (
        <div className="page-content">
            <div className="container">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                    <div className="section-header" style={{ margin: 0 }}>
                        <h2>🗺️ Live Issue Map & Truck Tracking</h2>
                        <p>{filtered.length} issues · {trucks.length} trucks ({activeTrucks} active)</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        <button className={`btn btn-sm ${heatmap ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setHeatmap(!heatmap)}>
                            🔥 {heatmap ? 'Hide' : 'Show'} Heatmap
                        </button>
                        <button
                            className={`btn btn-sm ${showTrucks ? 'btn-green' : 'btn-ghost'}`}
                            onClick={() => setShowTrucks(!showTrucks)}
                        >
                            🚛 {showTrucks ? 'Hide' : 'Show'} Trucks
                        </button>
                        <Link to="/report" className="btn btn-saffron btn-sm">📝 Report New</Link>
                    </div>
                </div>

                {/* Filter chips */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                    <select className="form-control" style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }} value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}>
                        <option value="all">🏷️ All Categories</option>
                        {['garbage', 'roads', 'water', 'sanitation', 'lighting', 'electricity', 'drainage', 'other'].map(c => (
                            <option key={c} value={c}>{catIcons[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>
                        ))}
                    </select>
                    <select className="form-control" style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }} value={filters.severity} onChange={e => setFilters({ ...filters, severity: e.target.value })}>
                        <option value="all">⚡ All Severities</option>
                        {['low', 'medium', 'high', 'critical'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                    <select className="form-control" style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }} value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
                        <option value="all">📋 All Status</option>
                        {['submitted', 'progress', 'resolved'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                </div>

                {/* Stats row */}
                {stats && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10, marginBottom: 16 }}>
                        {[
                            { label: 'Total', value: stats.total, color: '#000080' },
                            { label: 'Resolved', value: stats.resolved, color: '#16A34A' },
                            { label: 'In Progress', value: stats.inProgress, color: '#D97706' },
                            { label: 'Rate', value: `${stats.resolutionRate}%`, color: '#7C3AED' },
                            { label: 'Active Trucks', value: activeTrucks, color: '#16a34a', icon: '🚛' },
                        ].map((s, i) => (
                            <div key={i} style={{ background: 'white', borderRadius: 10, padding: '10px 14px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                                <div style={{ fontWeight: 800, fontSize: 20, color: s.color }}>{s.value}</div>
                                <div style={{ fontSize: 11, color: '#64748b' }}>{s.icon || ''} {s.label}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Map */}
                <div className="card" style={{ overflow: 'hidden', marginBottom: 20 }}>
                    <div style={{ height: 520 }}>
                        {loading ? (
                            <div className="loading-overlay"><div className="spinner" /><span>Loading map...</span></div>
                        ) : (
                            <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={true}>
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                />
                                <HeatmapLayer issues={filtered} active={heatmap} />

                                {/* Issue markers */}
                                {filtered.map(issue => (
                                    <Marker key={issue._id} position={[issue.location.lat, issue.location.lng]} icon={makeIcon(issue.category, issue.severity)}>
                                        <Popup maxWidth={280}>
                                            <div style={{ fontFamily: 'Inter, sans-serif' }}>
                                                <div style={{ fontWeight: 700, fontSize: 14, color: '#000080', marginBottom: 6 }}>{issue.title}</div>
                                                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{issue.description?.slice(0, 100)}...</div>
                                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                                                    <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>{catIcons[issue.category]} {issue.category}</span>
                                                    <span style={{ background: issue.severity === 'high' ? '#FEF2F2' : '#FFFBEB', color: issue.severity === 'high' ? '#DC2626' : '#D97706', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>{issue.severity}</span>
                                                </div>
                                                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>👍 {issue.upvoteCount || 0} upvotes • {new Date(issue.createdAt).toLocaleDateString()}</div>
                                                {issue.images?.[0] && <img src={issue.images[0]} alt="" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 6, marginBottom: 8 }} onError={e => e.target.style.display = 'none'} />}
                                                <a href={`/issues/${issue._id}`} style={{ color: '#000080', fontWeight: 700, fontSize: 12 }}>View Details →</a>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}

                                {/* Truck markers */}
                                {showTrucks && trucks.map(truck => (
                                    <Marker key={truck._id} position={[truck.lat, truck.lng]} icon={makeTruckIcon(truck.status)}>
                                        <Popup maxWidth={260}>
                                            <div style={{ fontFamily: 'Inter, sans-serif' }}>
                                                <div style={{ fontWeight: 700, fontSize: 14, color: '#15803d', marginBottom: 4 }}>🚛 {truck.vehicleName}</div>
                                                <div style={{
                                                    display: 'inline-block', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700, marginBottom: 8,
                                                    background: truck.status === 'active' ? '#f0fdf4' : truck.status === 'idle' ? '#fffbeb' : '#f8fafc',
                                                    color: TRUCK_STATUS_COLORS[truck.status] || '#64748b',
                                                }}>
                                                    {truck.status?.toUpperCase()}
                                                </div>
                                                <div style={{ fontSize: 12, color: '#374151' }}><strong>Vehicle ID:</strong> {truck.vehicleId}</div>
                                                <div style={{ fontSize: 12, color: '#374151' }}><strong>Driver:</strong> {truck.driverName || 'N/A'}</div>
                                                <div style={{ fontSize: 12, color: '#374151' }}><strong>Area:</strong> {truck.area || 'N/A'}</div>
                                                <div style={{ fontSize: 12, color: '#374151' }}><strong>Route:</strong> {truck.route || 'N/A'}</div>
                                                <div style={{ fontSize: 12, color: '#374151' }}><strong>Schedule:</strong> {truck.schedule || 'N/A'}</div>
                                                {truck.driverPhone && <div style={{ fontSize: 12, color: '#374151' }}><strong>Contact:</strong> {truck.driverPhone}</div>}
                                                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
                                                    Last updated: {truck.lastUpdated ? new Date(truck.lastUpdated).toLocaleTimeString() : 'N/A'}
                                                </div>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                        )}
                    </div>
                </div>

                {/* Truck status panel */}
                {showTrucks && trucks.length > 0 && (
                    <div className="card" style={{ marginBottom: 20 }}>
                        <div className="card-header">
                            <h3>🚛 Garbage Truck Fleet — Live Status</h3>
                        </div>
                        <div className="card-body" style={{ padding: 0 }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                            {['Vehicle', 'Driver', 'Area / Route', 'Status', 'Last Updated'].map(h => (
                                                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#374151', fontSize: 12 }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {trucks.map((truck, i) => (
                                            <tr key={truck._id} style={{ borderBottom: i < trucks.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                                <td style={{ padding: '10px 14px', fontWeight: 600 }}>{truck.vehicleName}<br /><span style={{ fontSize: 11, color: '#94a3b8' }}>{truck.vehicleId}</span></td>
                                                <td style={{ padding: '10px 14px', color: '#374151' }}>{truck.driverName}<br /><span style={{ fontSize: 11, color: '#94a3b8' }}>{truck.driverPhone}</span></td>
                                                <td style={{ padding: '10px 14px', color: '#374151' }}>{truck.area}<br /><span style={{ fontSize: 11, color: '#94a3b8' }}>{truck.route}</span></td>
                                                <td style={{ padding: '10px 14px' }}>
                                                    <span style={{
                                                        borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700,
                                                        background: truck.status === 'active' ? '#f0fdf4' : truck.status === 'idle' ? '#fffbeb' : truck.status === 'maintenance' ? '#fef2f2' : '#f8fafc',
                                                        color: TRUCK_STATUS_COLORS[truck.status] || '#64748b'
                                                    }}>
                                                        {truck.status === 'active' ? '🟢' : truck.status === 'idle' ? '🟡' : truck.status === 'maintenance' ? '🔴' : '⚫'} {truck.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: 12 }}>
                                                    {truck.lastUpdated ? new Date(truck.lastUpdated).toLocaleTimeString() : 'N/A'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Legend */}
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: '#64748b' }}>Issues:</div>
                    {Object.entries(catColors).map(([cat, color]) => (
                        <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                            <div style={{ width: 12, height: 12, borderRadius: '50%', background: color }} />
                            <span style={{ color: '#64748b' }}>{catIcons[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                        </div>
                    ))}
                    <div style={{ width: 1, height: 20, background: '#e2e8f0' }} />
                    <div style={{ fontWeight: 700, fontSize: 12, color: '#64748b' }}>Trucks:</div>
                    {Object.entries(TRUCK_STATUS_COLORS).map(([status, color]) => (
                        <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                            <div style={{ width: 12, height: 12, borderRadius: '50%', background: color }} />
                            <span style={{ color: '#64748b' }}>{status}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MapView;
