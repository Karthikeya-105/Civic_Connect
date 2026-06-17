import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
    const { login, loading } = useAuth();
    const navigate = useNavigate();
    const [loginType, setLoginType] = useState('citizen'); // 'citizen' or 'admin'
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPw, setShowPw] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await login(form.email, form.password);
        if (result.success) {
            toast.success('Welcome back! 🎉');
            if (result.user.role === 'admin') navigate('/admin');
            else if (result.user.role === 'dept_admin') navigate('/dept-admin');
            else navigate('/dashboard');
        } else {
            toast.error(result.message);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#FF990011 0%,#f0f4f8 50%,#13880811 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ width: '100%', maxWidth: 420 }}>
                <div className="card fade-in-up" style={{ overflow: 'hidden' }}>
                    <div style={{ background: loginType === 'citizen' ? 'linear-gradient(135deg,#000080,#1a1a8d)' : 'linear-gradient(135deg,#1e293b,#0f172a)', padding: '28px 32px', textAlign: 'center', color: 'white', transition: 'background 0.3s ease' }}>
                        <div style={{ fontSize: 40, marginBottom: 8 }}>{loginType === 'citizen' ? '🏛️' : '🛡️'}</div>
                        <h1 style={{ fontFamily: 'Poppins', fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>CivicConnect</h1>
                        <p style={{ opacity: 0.8, fontSize: 13 }}>Sign in to your account</p>
                    </div>

                    <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
                        <button type="button" onClick={() => { setLoginType('citizen'); setForm({ email: '', password: '' }); }} style={{ flex: 1, padding: 14, background: loginType === 'citizen' ? 'white' : '#f8fafc', border: 'none', borderBottom: loginType === 'citizen' ? '2px solid #000080' : '2px solid transparent', fontWeight: loginType === 'citizen' ? 700 : 500, color: loginType === 'citizen' ? '#000080' : '#64748b', cursor: 'pointer', fontSize: 14, transition: 'all 0.2s' }}>
                            👤 Citizen Login
                        </button>
                        <button type="button" onClick={() => { setLoginType('admin'); setForm({ email: '', password: '' }); }} style={{ flex: 1, padding: 14, background: loginType === 'admin' ? 'white' : '#f8fafc', border: 'none', borderBottom: loginType === 'admin' ? '2px solid #0f172a' : '2px solid transparent', fontWeight: loginType === 'admin' ? 700 : 500, color: loginType === 'admin' ? '#0f172a' : '#64748b', cursor: 'pointer', fontSize: 14, transition: 'all 0.2s' }}>
                            🛡️ Admin Portal
                        </button>
                    </div>

                    <div className="card-body" style={{ padding: '28px 32px' }}>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">{loginType === 'admin' ? '🛡️ Admin Email' : '📧 Email Address'}</label>
                                <input className="form-control" type="email" required placeholder={loginType === 'admin' ? "admin@gov.in" : "you@example.com"}
                                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">🔒 Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input className="form-control" type={showPw ? 'text' : 'password'} required placeholder="Enter your password"
                                        value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={{ paddingRight: 44 }} />
                                    <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>
                                        {showPw ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4, background: loginType === 'admin' ? '#0f172a' : '' }}>
                                {loading ? '⏳ Signing in...' : '🚀 Sign In'}
                            </button>
                        </form>

                        <div style={{ marginTop: 24, padding: '14px', background: loginType === 'admin' ? '#f1f5f9' : '#FFF7ED', borderRadius: 8, border: loginType === 'admin' ? '1px solid #cbd5e1' : '1px solid #FED7AA' }}>
                            <p style={{ fontSize: 12, color: loginType === 'admin' ? '#334155' : '#92400E', marginBottom: 6, fontWeight: 700 }}>Quick Demo Access:</p>
                            {loginType === 'citizen' ? (
                                <button type="button" onClick={() => { setForm({ email: 'citizen@demo.com', password: 'demo123' }); toast('Click Sign In!', { icon: '👆' }); }} style={{ background: 'none', border: 'none', padding: 0, color: '#78350F', fontSize: 13, cursor: 'pointer', textAlign: 'left', fontWeight: 500 }}>
                                    Login as Citizen (citizen@demo.com / demo123)
                                </button>
                            ) : (
                                <button type="button" onClick={() => { setForm({ email: 'admin@demo.com', password: 'admin123' }); toast('Click Sign In!', { icon: '👆' }); }} style={{ background: 'none', border: 'none', padding: 0, color: '#0f172a', fontSize: 13, cursor: 'pointer', textAlign: 'left', fontWeight: 500 }}>
                                    Login as Admin (admin@demo.com / admin123)
                                </button>
                            )}
                        </div>

                        {loginType === 'citizen' && (
                            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748b' }}>
                                Don't have an account? <Link to="/signup" style={{ color: '#000080', fontWeight: 600 }}>Sign up →</Link>
                            </p>
                        )}
                        <div style={{ textAlign: 'center', marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                            <Link to="/dept-login" style={{ fontSize: 13, color: '#7c3aed', fontWeight: 600, textDecoration: 'none' }}>
                                🏢 Department Admin Login →
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
