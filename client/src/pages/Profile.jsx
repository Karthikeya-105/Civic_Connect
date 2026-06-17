import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Profile = () => {
    const { user } = useAuth();
    const [notifSettings, setNotifSettings] = useState({
        push: true,
        email: false,
        sms: false
    });
    const [saving, setSaving] = useState(false);

    const handleSave = () => {
        setSaving(true);
        // Simulate API call to save preferences
        setTimeout(() => {
            if (notifSettings.push && 'Notification' in window) {
                Notification.requestPermission().then(perm => {
                    if (perm === 'granted') toast.success('Push notifications enabled!');
                    else toast.error('Push permission denied by browser.');
                });
            }
            toast.success('Notification preferences saved successfully.');
            setSaving(false);
        }, 800);
    };

    if (!user) return <div className="container" style={{ padding: '40px 20px', textAlign: 'center' }}>Please log in to view your profile.</div>;

    return (
        <div className="page-content">
            <div className="container" style={{ maxWidth: 800 }}>
                <div className="section-header">
                    <h2>👤 My Profile</h2>
                    <p>Manage your account and preferences</p>
                </div>

                <div className="grid-2" style={{ alignItems: 'start' }}>
                    {/* User Info Card */}
                    <div className="card fade-in-up">
                        <div className="card-header" style={{ background: 'linear-gradient(135deg,#000080,#1a1a8d)', color: 'white', textAlign: 'center', padding: '30px 20px' }}>
                            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#FF9933,#FFD700)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700, color: 'white', border: '4px solid rgba(255,255,255,0.2)' }}>
                                {user.name.charAt(0)}
                            </div>
                            <h3 style={{ margin: '0 0 4px', fontSize: 22 }}>{user.name}</h3>
                            <p style={{ margin: 0, opacity: 0.8, fontSize: 13 }}>{user.email}</p>
                            <div style={{ marginTop: 16, display: 'inline-block', background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                                🏆 {user.level || 'Civic Newcomer'}
                            </div>
                        </div>
                        <div className="card-body">
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                                <span style={{ color: '#64748b', fontWeight: 600, fontSize: 13 }}>Total Points</span>
                                <span style={{ fontWeight: 700, color: '#FF9933' }}>⭐ {user.points}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                                <span style={{ color: '#64748b', fontWeight: 600, fontSize: 13 }}>Issues Reported</span>
                                <span style={{ fontWeight: 700 }}>📝 {user.reportCount || 0}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                                <span style={{ color: '#64748b', fontWeight: 600, fontSize: 13 }}>Issues Resolved</span>
                                <span style={{ fontWeight: 700, color: '#16A34A' }}>✅ {user.resolvedCount || 0}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                                <span style={{ color: '#64748b', fontWeight: 600, fontSize: 13 }}>Trees Saved Equivalent</span>
                                <span style={{ fontWeight: 700, color: '#059669' }}>🌳 {user.treesSaved || 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* Settings Card */}
                    <div className="card fade-in-up" style={{ animationDelay: '0.1s' }}>
                        <div className="card-header">
                            <h3>🔔 Smart Notifications</h3>
                        </div>
                        <div className="card-body">
                            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
                                Choose how you want to be notified when your reported issues are updated or resolved by the municipality.
                            </p>

                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 12 }}>
                                <div>
                                    <h4 style={{ margin: '0 0 4px', fontSize: 14 }}>💻 Browser Push Alerts</h4>
                                    <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Get instant alerts on your device</p>
                                </div>
                                <label className="switch">
                                    <input type="checkbox" checked={notifSettings.push} onChange={e => setNotifSettings({ ...notifSettings, push: e.target.checked })} />
                                    <span className="slider round"></span>
                                </label>
                            </div>

                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 12 }}>
                                <div>
                                    <h4 style={{ margin: '0 0 4px', fontSize: 14 }}>📧 Email Notifications</h4>
                                    <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Receive updates to {user.email}</p>
                                </div>
                                <label className="switch">
                                    <input type="checkbox" checked={notifSettings.email} onChange={e => setNotifSettings({ ...notifSettings, email: e.target.checked })} />
                                    <span className="slider round"></span>
                                </label>
                            </div>

                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 24 }}>
                                <div>
                                    <h4 style={{ margin: '0 0 4px', fontSize: 14 }}>📱 SMS Alerts</h4>
                                    <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Get text messages for urgent updates</p>
                                </div>
                                <label className="switch">
                                    <input type="checkbox" checked={notifSettings.sms} onChange={e => setNotifSettings({ ...notifSettings, sms: e.target.checked })} />
                                    <span className="slider round"></span>
                                </label>
                            </div>

                            <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ width: '100%' }}>
                                {saving ? '⏳ Saving...' : '💾 Save Preferences'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                /* Toggle Switch CSS */
                .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
                .switch input { opacity: 0; width: 0; height: 0; }
                .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e1; transition: .4s; }
                .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; }
                input:checked + .slider { background-color: #16A34A; }
                input:focus + .slider { box-shadow: 0 0 1px #16A34A; }
                input:checked + .slider:before { transform: translateX(20px); }
                .slider.round { border-radius: 24px; }
                .slider.round:before { border-radius: 50%; }
            `}</style>
        </div>
    );
};

export default Profile;
