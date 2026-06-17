import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const DRIVES = [
    { id: 1, title: 'MG Road Weekend Cleanup', date: '2024-11-20', time: '08:00 AM', location: 'MG Road Junction', participants: 45, max: 100, sponsor: 'Green City NGO' },
    { id: 2, title: 'Lake View Park Restoration', date: '2024-11-22', time: '07:30 AM', location: 'Lake View Park East Gate', participants: 120, max: 200, sponsor: 'Rotary Club' },
    { id: 3, title: 'Central Metro Station Dust Drive', date: '2024-11-25', time: '09:00 AM', location: 'Central Metro Station', participants: 30, max: 50, sponsor: 'Civic Authorities' },
];

const CleanupDrives = () => {
    const { user } = useAuth();
    const [drives, setDrives] = useState(DRIVES);
    const [rsvps, setRsvps] = useState([]);

    const handleRSVP = (id) => {
        if (!user) return toast.error('Please login to RSVP!');
        if (rsvps.includes(id)) return toast.error('You have already RSVP\'d to this drive!');

        setRsvps([...rsvps, id]);
        setDrives(prev => prev.map(d => d.id === id ? { ...d, participants: d.participants + 1 } : d));
        toast.success('🎉 RSVP Successful! See you there. (+50 Karma Points pending attendance)');
    };

    return (
        <div className="page-content">
            <div className="container" style={{ maxWidth: 900 }}>
                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg,#16A34A,#15803D)', borderRadius: 12, padding: '30px', color: 'white', marginBottom: 30, textAlign: 'center', boxShadow: '0 8px 30px rgba(22,163,74,0.3)' }}>
                    <div style={{ fontSize: 56, marginBottom: 12 }}>🧹</div>
                    <h2 style={{ margin: '0 0 10px', fontSize: 32, fontWeight: 800, fontFamily: 'Poppins' }}>Shramdaan — Community Drives</h2>
                    <p style={{ margin: 0, fontSize: 16, opacity: 0.9, maxWidth: 600, display: 'inline-block' }}>
                        Join hands with your neighbors to clean your city. Volunteer for upcoming cleanup drives, earn the "Community Leader" badge, and make a real difference.
                    </p>
                </div>

                <div className="section-header" style={{ textAlign: 'left', marginBottom: 20 }}>
                    <h3 style={{ margin: 0 }}>Upcoming Drives Near You</h3>
                </div>

                <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                    {drives.map(drive => (
                        <div key={drive.id} className="card fade-in-up" style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ height: 120, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, borderBottom: '1px solid #e2e8f0' }}>
                                🌳
                            </div>
                            <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>{drive.sponsor}</div>
                                <h4 style={{ margin: '0 0 12px', fontSize: 18, color: '#1e293b' }}>{drive.title}</h4>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b', marginBottom: 6 }}>
                                    <span>📅</span> {drive.date}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b', marginBottom: 6 }}>
                                    <span>⏰</span> {drive.time}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                                    <span>📍</span> {drive.location}
                                </div>

                                {/* Progress Bar */}
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4, fontWeight: 600 }}>
                                        <span color="#64748b">{drive.participants} / {drive.max} Volunteers</span>
                                        <span style={{ color: '#16A34A' }}>{Math.round((drive.participants / drive.max) * 100)}%</span>
                                    </div>
                                    <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                                        <div style={{ width: `${(drive.participants / drive.max) * 100}%`, height: '100%', background: '#16A34A', borderRadius: 3 }} />
                                    </div>
                                </div>

                                <div style={{ marginTop: 'auto' }}>
                                    {rsvps.includes(drive.id) ? (
                                        <button className="btn" disabled style={{ width: '100%', background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', cursor: 'default' }}>
                                            ✅ You're Going!
                                        </button>
                                    ) : (
                                        <button className="btn btn-primary" onClick={() => handleRSVP(drive.id)} style={{ width: '100%' }}>
                                            RSVP Now
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CleanupDrives;
