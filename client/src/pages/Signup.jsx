import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Signup = () => {
    const { signup, loading } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', confirmPw: '' });
    const [showPw, setShowPw] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.confirmPw) { toast.error('Passwords do not match!'); return; }
        if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
        const result = await signup(form.name, form.email, form.password, form.phone);
        if (result.success) {
            toast.success('Account created! Welcome to CivicConnect 🇮🇳');
            navigate('/dashboard');
        } else {
            toast.error(result.message);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#FF990011 0%,#f0f4f8 50%,#13880811 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ width: '100%', maxWidth: 460 }}>
                <div className="card fade-in-up">
                    <div style={{ background: 'linear-gradient(135deg,#138808,#1a9a0a)', padding: '24px 32px', borderRadius: '12px 12px 0 0', textAlign: 'center', color: 'white' }}>
                        <div style={{ fontSize: 36, marginBottom: 6 }}>🌱</div>
                        <h1 style={{ fontFamily: 'Poppins', fontSize: 20, fontWeight: 800, margin: '0 0 4px' }}>Join CivicConnect</h1>
                        <p style={{ opacity: 0.85, fontSize: 13 }}>Be a part of the Digital India movement</p>
                    </div>
                    <div className="card-body" style={{ padding: '24px 32px' }}>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">👤 Full Name</label>
                                <input className="form-control" type="text" required placeholder="Ramesh Kumar"
                                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">📧 Email Address</label>
                                <input className="form-control" type="email" required placeholder="you@example.com"
                                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">📱 Phone (optional)</label>
                                <input className="form-control" type="tel" placeholder="+91 XXXXX XXXXX"
                                    value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">🔒 Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input className="form-control" type={showPw ? 'text' : 'password'} required placeholder="Min 6 characters"
                                        value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={{ paddingRight: 44 }} />
                                    <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>
                                        {showPw ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">🔒 Confirm Password</label>
                                <input className="form-control" type="password" required placeholder="Re-enter password"
                                    value={form.confirmPw} onChange={e => setForm({ ...form, confirmPw: e.target.value })} />
                            </div>

                            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: '#15803D' }}>
                                🌿 By joining, you'll earn <strong>10 welcome points</strong> and the **Early Adopter** badge!
                            </div>

                            <button type="submit" className="btn btn-green" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                                {loading ? '⏳ Creating account...' : '🎯 Create Account & Start Reporting'}
                            </button>
                        </form>
                        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748b' }}>
                            Already have an account? <Link to="/login" style={{ color: '#000080', fontWeight: 600 }}>Sign in →</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
