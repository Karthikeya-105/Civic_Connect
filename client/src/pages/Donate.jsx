import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Donate = () => {
    const { user } = useAuth();
    const [form, setForm] = useState({ itemType: '', quantity: '', condition: 'good', address: '', date: '' });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            toast.success('🎉 Pickup scheduled! You earned 20 Karma Points!');
            setForm({ itemType: '', quantity: '', condition: 'good', address: '', date: '' });
            setSubmitting(false);
        }, 1500);
    };

    return (
        <div className="page-content">
            <div className="container" style={{ maxWidth: 600 }}>
                <div style={{ background: 'linear-gradient(135deg,#FFF7ED,#FFEDD5)', borderRadius: 12, padding: '24px', marginBottom: 24, border: '1px solid #FED7AA', textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🤝</div>
                    <h2 style={{ margin: '0 0 8px', color: '#9A3412', fontSize: 24, fontWeight: 800 }}>Give Back Initiative</h2>
                    <p style={{ margin: 0, color: '#9A3412', fontSize: 14 }}>
                        Don't throw away usable items! Donate old clothes, books, and toys. We will pick them up during regular garbage collection and distribute them to NGOs.
                    </p>
                </div>

                <form className="card fade-in-up" onSubmit={handleSubmit}>
                    <div className="card-header">
                        <h3>📦 Schedule a Donation Pickup</h3>
                    </div>
                    <div className="card-body">
                        <div className="form-group">
                            <label className="form-label">What are you donating?</label>
                            <select className="form-control" value={form.itemType} onChange={e => setForm({ ...form, itemType: e.target.value })} required>
                                <option value="">Select item type...</option>
                                <option value="clothes">👕 Clothes</option>
                                <option value="books">📚 Books</option>
                                <option value="toys">🧸 Toys</option>
                                <option value="shoes">👞 Shoes</option>
                                <option value="mixed">📦 Mixed Items</option>
                            </select>
                        </div>

                        <div className="grid-2">
                            <div className="form-group">
                                <label className="form-label">Approx. Quantity / Weight</label>
                                <input type="text" className="form-control" placeholder="e.g. 2 bags, ~5kg" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Condition</label>
                                <select className="form-control" value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}>
                                    <option value="new">Like New</option>
                                    <option value="good">Good / Usable</option>
                                    <option value="fair">Fair (needs minor repair)</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Pickup Date</label>
                            <input type="date" className="form-control" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required min={new Date().toISOString().split('T')[0]} />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Pickup Address</label>
                            <textarea className="form-control" rows={3} placeholder="Enter full address for the pickup truck..." value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required />
                        </div>

                        <div style={{ background: '#F0FDF4', padding: 12, borderRadius: 8, border: '1px solid #BBF7D0', marginBottom: 20, fontSize: 13, color: '#166534', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 18 }}>⭐</span>
                            You will earn <strong>20 Karma Points</strong> for this donation!
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={submitting}>
                            {submitting ? '⏳ Scheduling...' : '🚚 Schedule Pickup'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Donate;
