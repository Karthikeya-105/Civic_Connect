import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CATEGORY_COLORS = {
    fuel: { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
    grocery: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
    electricity: { bg: '#fefce8', color: '#ca8a04', border: '#fef08a' },
    transport: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
    environment: { bg: '#f0fdf4', color: '#15803d', border: '#86efac' },
    entertainment: { bg: '#fdf4ff', color: '#9333ea', border: '#e9d5ff' },
    utility: { bg: '#ecfeff', color: '#0891b2', border: '#a5f3fc' },
    shopping: { bg: '#fff1f2', color: '#e11d48', border: '#fecdd3' },
    general: { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' },
};

const Vouchers = () => {
    const { user, setUser } = useAuth();
    const [vouchers, setVouchers] = useState([]);
    const [myVouchers, setMyVouchers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [redeeming, setRedeeming] = useState(null);
    const [activeTab, setActiveTab] = useState('browse');
    const [lastCode, setLastCode] = useState(null);
    const [categoryFilter, setCategoryFilter] = useState('all');

    useEffect(() => {
        Promise.all([
            api.get('/vouchers'),
            api.get('/vouchers/my'),
        ]).then(([v, my]) => {
            setVouchers(Array.isArray(v.data) ? v.data : []);
            setMyVouchers(Array.isArray(my.data) ? my.data : []);
        }).catch(() => toast.error('Failed to load vouchers')).finally(() => setLoading(false));
    }, []);

    const redeemVoucher = async (voucherId, pointsCost) => {
        if ((user?.points || 0) < pointsCost) {
            toast.error(`Not enough points! You need ${pointsCost} pts, you have ${user?.points || 0}`);
            return;
        }
        setRedeeming(voucherId);
        try {
            const result = await api.post(`/vouchers/redeem/${voucherId}`, {});
            const data = result.data;
            toast.success(`🎉 Voucher redeemed! Code: ${data.code}`);
            setLastCode({ code: data.code, title: data.voucher?.title });
            if (data.newPoints !== undefined && setUser) {
                setUser(prev => ({ ...prev, points: data.newPoints }));
            }
            // Refresh
            const [v, my] = await Promise.all([api.get('/vouchers'), api.get('/vouchers/my')]);
            setVouchers(Array.isArray(v.data) ? v.data : []);
            setMyVouchers(Array.isArray(my.data) ? my.data : []);
        } catch (err) {
            toast.error(err.message || 'Redemption failed');
        } finally {
            setRedeeming(null);
        }
    };

    const categories = ['all', ...new Set(vouchers.map(v => v.category).filter(Boolean))];
    const filtered = categoryFilter === 'all' ? vouchers : vouchers.filter(v => v.category === categoryFilter);

    return (
        <div className="page-content">
            <div className="container" style={{ maxWidth: 1100 }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                    borderRadius: 16, padding: '28px 32px', marginBottom: 28, color: 'white'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                        <div>
                            <div style={{ fontSize: 48, marginBottom: 8 }}>🎟️</div>
                            <h1 style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 800, margin: 0 }}>
                                Rewards & Vouchers
                            </h1>
                            <p style={{ opacity: 0.85, margin: '6px 0 0', fontSize: 14 }}>
                                Redeem your civic points for real-world discounts and rewards!
                            </p>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 16, padding: '16px 28px', textAlign: 'center' }}>
                            <div style={{ fontFamily: 'Poppins', fontSize: 36, fontWeight: 900 }}>{user?.points || 0}</div>
                            <div style={{ fontSize: 13, opacity: 0.9 }}>🌟 Available Points</div>
                        </div>
                    </div>
                </div>

                {/* Last redeemed code popup */}
                {lastCode && (
                    <div style={{
                        background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                        borderRadius: 14, padding: '20px 28px', marginBottom: 20, color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
                    }}>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 16 }}>🎉 Voucher Redeemed: {lastCode.title}</div>
                            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>Your unique code (save it!):</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <code style={{
                                background: 'rgba(255,255,255,0.25)', borderRadius: 8, padding: '10px 20px',
                                fontFamily: 'monospace', fontSize: 20, fontWeight: 900, letterSpacing: 3
                            }}>
                                {lastCode.code}
                            </code>
                            <button
                                onClick={() => { navigator.clipboard.writeText(lastCode.code); toast.success('Copied!'); }}
                                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '10px 16px', color: 'white', cursor: 'pointer', fontWeight: 700 }}
                            >
                                📋 Copy
                            </button>
                            <button onClick={() => setLastCode(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: 18 }}>✕</button>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 12, padding: 4, marginBottom: 24, width: 'fit-content' }}>
                    {[['browse', '🛍️ Browse Vouchers'], ['my', `📁 My Vouchers (${myVouchers.length})`]].map(([tab, label]) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                                fontWeight: 700, fontSize: 13,
                                background: activeTab === tab ? 'white' : 'transparent',
                                color: activeTab === tab ? '#7c3aed' : '#64748b',
                                boxShadow: activeTab === tab ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s',
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <div className="spinner" style={{ margin: '0 auto' }} />
                    </div>
                ) : activeTab === 'browse' ? (
                    <>
                        {/* Category Filter */}
                        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setCategoryFilter(cat)}
                                    style={{
                                        padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                                        fontWeight: 600, fontSize: 12, textTransform: 'capitalize',
                                        background: categoryFilter === cat ? '#7c3aed' : '#f1f5f9',
                                        color: categoryFilter === cat ? 'white' : '#64748b',
                                    }}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                            {filtered.map(v => {
                                const scheme = CATEGORY_COLORS[v.category] || CATEGORY_COLORS.general;
                                const canAfford = (user?.points || 0) >= v.pointsCost;
                                const alreadyClaimed = myVouchers.some(m => m.voucherId === v._id);
                                const remaining = v.remaining ?? (v.totalStock - (v.claimedBy?.length || 0));
                                return (
                                    <div key={v._id} style={{
                                        background: 'white', borderRadius: 16, overflow: 'hidden',
                                        border: `2px solid ${alreadyClaimed ? '#a855f7' : scheme.border}`,
                                        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                                        opacity: remaining <= 0 ? 0.6 : 1,
                                        position: 'relative',
                                    }}>
                                        {alreadyClaimed && (
                                            <div style={{ position: 'absolute', top: 10, right: 10, background: '#7c3aed', color: 'white', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                                                ✓ Claimed
                                            </div>
                                        )}
                                        {/* Top band */}
                                        <div style={{ background: scheme.bg, padding: '20px 20px 16px', borderBottom: `1px solid ${scheme.border}` }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{ fontSize: 40 }}>{v.imageEmoji}</div>
                                                <div>
                                                    <div style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 16, color: '#111827' }}>{v.title}</div>
                                                    <div style={{ color: scheme.color, fontWeight: 700, fontSize: 14 }}>{v.discountValue}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ padding: '16px 20px' }}>
                                            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 12 }}>{v.description}</p>
                                            {v.partner && <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>Partner: {v.partner}</div>}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: 22, color: '#7c3aed' }}>{v.pointsCost}</span>
                                                    <span style={{ fontSize: 13, color: '#94a3b8' }}>pts</span>
                                                </div>
                                                <span style={{ fontSize: 12, color: remaining <= 20 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
                                                    {remaining <= 0 ? '❌ Out of stock' : `${remaining} remaining`}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => !alreadyClaimed && remaining > 0 && redeemVoucher(v._id, v.pointsCost)}
                                                disabled={!canAfford || alreadyClaimed || remaining <= 0 || redeeming === v._id}
                                                style={{
                                                    width: '100%', padding: '11px', borderRadius: 10, border: 'none',
                                                    fontWeight: 700, fontSize: 13, cursor: (!canAfford || alreadyClaimed || remaining <= 0) ? 'not-allowed' : 'pointer',
                                                    background: alreadyClaimed ? '#a855f7' : canAfford && remaining > 0 ? '#7c3aed' : '#e2e8f0',
                                                    color: alreadyClaimed || (canAfford && remaining > 0) ? 'white' : '#94a3b8',
                                                    transition: 'all 0.2s',
                                                }}
                                            >
                                                {redeeming === v._id ? '⏳ Redeeming...'
                                                    : alreadyClaimed ? '✅ Already Claimed'
                                                        : !canAfford ? `Need ${v.pointsCost - (user?.points || 0)} more pts`
                                                            : remaining <= 0 ? 'Out of Stock'
                                                                : `🎟️ Redeem for ${v.pointsCost} pts`}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    /* My Vouchers */
                    myVouchers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', background: 'white', borderRadius: 16 }}>
                            <div style={{ fontSize: 56, marginBottom: 12 }}>🎟️</div>
                            <div style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 18, color: '#111827' }}>No vouchers yet</div>
                            <div style={{ color: '#64748b', marginTop: 8 }}>Redeem your civic points for rewards!</div>
                            <button onClick={() => setActiveTab('browse')} style={{ marginTop: 16, background: '#7c3aed', color: 'white', border: 'none', borderRadius: 10, padding: '10px 24px', cursor: 'pointer', fontWeight: 700 }}>
                                Browse Vouchers
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                            {myVouchers.map((rv, i) => (
                                <div key={i} style={{ background: 'white', borderRadius: 14, padding: '20px', border: '2px solid #e9d5ff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                                        <span style={{ fontSize: 32 }}>{rv.imageEmoji || rv.voucher?.imageEmoji || '🎟️'}</span>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 15 }}>{rv.voucher?.title || rv.title || 'Voucher'}</div>
                                            <div style={{ fontSize: 12, color: '#64748b' }}>{rv.voucher?.partner || ''}</div>
                                        </div>
                                    </div>
                                    <div style={{ background: '#f5f3ff', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <code style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 900, color: '#7c3aed', letterSpacing: 2 }}>
                                            {rv.code}
                                        </code>
                                        <button
                                            onClick={() => { navigator.clipboard.writeText(rv.code); toast.success('Copied!'); }}
                                            style={{ background: '#7c3aed', color: 'white', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
                                        >
                                            Copy
                                        </button>
                                    </div>
                                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 10 }}>
                                        Redeemed: {new Date(rv.redeemedAt).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default Vouchers;
