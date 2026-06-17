import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const DEPARTMENTS = [
    { id: 'sanitation', label: 'Sanitation Department', email: 'sanitation@admin.com', icon: '🗑️', color: '#16a34a' },
    { id: 'roads', label: 'Public Works Department', email: 'roads@admin.com', icon: '🛣️', color: '#2563eb' },
    { id: 'water', label: 'Water Supply Board', email: 'water@admin.com', icon: '💧', color: '#0891b2' },
    { id: 'electricity', label: 'Electricity Department', email: 'electricity@admin.com', icon: '⚡', color: '#d97706' },
    { id: 'drainage', label: 'Drainage & Infrastructure', email: 'drainage@admin.com', icon: '🚧', color: '#7c3aed' },
];

const DeptAdminLogin = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [selectedDept, setSelectedDept] = useState(null);
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);

    const handleDeptSelect = (dept) => {
        setSelectedDept(dept);
        setForm({ email: dept.email, password: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await login(form.email, form.password);
            if (result?.user?.role === 'dept_admin') {
                toast.success(`Welcome, ${result.user.name}! 🏢`);
                navigate('/dept-admin');
            } else {
                toast.error('Please use department admin credentials');
            }
        } catch (err) {
            toast.error(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-content" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', minHeight: '100vh' }}>
            <div className="container" style={{ maxWidth: 900, paddingTop: 40, paddingBottom: 60 }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <div style={{ fontSize: 56, marginBottom: 12 }}>🏛️</div>
                    <h1 style={{ fontFamily: 'Poppins', fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 8 }}>
                        Department Admin Portal
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: 15 }}>
                        Select your department and sign in to manage civic issues
                    </p>
                </div>

                {/* Dept Selection Grid */}
                {!selectedDept && (
                    <div>
                        <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: 20, fontSize: 14 }}>
                            Select your department to continue
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                            {DEPARTMENTS.map(dept => (
                                <button
                                    key={dept.id}
                                    onClick={() => handleDeptSelect(dept)}
                                    style={{
                                        background: 'rgba(255,255,255,0.07)',
                                        border: '2px solid rgba(255,255,255,0.12)',
                                        borderRadius: 14,
                                        padding: '24px 20px',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        transition: 'all 0.2s ease',
                                        color: 'white',
                                    }}
                                    onMouseOver={e => { e.currentTarget.style.borderColor = dept.color; e.currentTarget.style.background = `${dept.color}22`; }}
                                    onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                                >
                                    <div style={{ fontSize: 40, marginBottom: 10 }}>{dept.icon}</div>
                                    <div style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 15 }}>{dept.label}</div>
                                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>Click to sign in</div>
                                </button>
                            ))}
                        </div>
                        <div style={{ textAlign: 'center', marginTop: 40 }}>
                            <Link to="/login" style={{ color: '#64748b', fontSize: 13, textDecoration: 'none' }}>
                                ← Back to Citizen Login
                            </Link>
                        </div>
                    </div>
                )}

                {/* Login Form */}
                {selectedDept && (
                    <div style={{ maxWidth: 480, margin: '0 auto' }}>
                        <button
                            onClick={() => setSelectedDept(null)}
                            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 14, cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                            ← Change Department
                        </button>

                        <div style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: `2px solid ${selectedDept.color}44`,
                            borderRadius: 20,
                            padding: 36,
                            backdropFilter: 'blur(16px)',
                        }}>
                            {/* Dept Badge */}
                            <div style={{
                                background: `${selectedDept.color}22`,
                                border: `1px solid ${selectedDept.color}55`,
                                borderRadius: 12,
                                padding: '14px 20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                marginBottom: 28
                            }}>
                                <span style={{ fontSize: 32 }}>{selectedDept.icon}</span>
                                <div>
                                    <div style={{ fontFamily: 'Poppins', fontWeight: 700, color: 'white', fontSize: 15 }}>{selectedDept.label}</div>
                                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Department Admin Access</div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ display: 'block', color: '#94a3b8', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                        style={{
                                            width: '100%', boxSizing: 'border-box',
                                            background: 'rgba(255,255,255,0.07)',
                                            border: '1px solid rgba(255,255,255,0.15)',
                                            borderRadius: 10, padding: '12px 16px',
                                            color: 'white', fontSize: 14, outline: 'none',
                                        }}
                                        required
                                    />
                                </div>
                                <div style={{ marginBottom: 24 }}>
                                    <label style={{ display: 'block', color: '#94a3b8', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="dept123"
                                        value={form.password}
                                        onChange={e => setForm({ ...form, password: e.target.value })}
                                        style={{
                                            width: '100%', boxSizing: 'border-box',
                                            background: 'rgba(255,255,255,0.07)',
                                            border: '1px solid rgba(255,255,255,0.15)',
                                            borderRadius: 10, padding: '12px 16px',
                                            color: 'white', fontSize: 14, outline: 'none',
                                        }}
                                        required
                                    />
                                    <p style={{ color: '#64748b', fontSize: 12, marginTop: 6 }}>Demo password: <strong style={{ color: '#94a3b8' }}>dept123</strong></p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        width: '100%',
                                        background: `linear-gradient(135deg, ${selectedDept.color}, ${selectedDept.color}cc)`,
                                        color: 'white', border: 'none', borderRadius: 12,
                                        padding: '14px 20px', fontFamily: 'Poppins',
                                        fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
                                        opacity: loading ? 0.7 : 1, transition: 'all 0.2s',
                                    }}
                                >
                                    {loading ? '⏳ Signing in...' : `🏢 Sign in to ${selectedDept.label}`}
                                </button>
                            </form>
                        </div>

                        <div style={{ textAlign: 'center', marginTop: 20 }}>
                            <Link to="/login" style={{ color: '#64748b', fontSize: 13, textDecoration: 'none' }}>
                                ← Back to Citizen Login
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeptAdminLogin;
