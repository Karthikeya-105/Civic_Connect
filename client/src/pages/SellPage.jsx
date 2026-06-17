import React, { useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

const SellPage = ({ type }) => {
    const isPlastic = type === 'plastic';
    const isManure = type === 'manure';
    const isEwaste = type === 'ewaste';
    const [form, setForm] = useState({ weight: '', condition: '', address: '', phone: '', notes: '', ewasteType: '' });
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const rates = isPlastic
        ? { good: 18, average: 12, poor: 6 }
        : isManure
            ? { good: 8, average: 5, poor: 2 }
            : { mobile: 50, laptop: 200, battery: 5, appliance: 80, other: 20 }; // e-waste per unit

    const estimate = isEwaste
        ? form.weight && form.ewasteType ? (parseFloat(form.weight) * (rates[form.ewasteType] || rates.other)).toFixed(0) : 0
        : form.weight && form.condition ? (parseFloat(form.weight) * (rates[form.condition] || rates.average)).toFixed(0) : 0;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        await new Promise(r => setTimeout(r, 1200));
        toast.success(`🎉 Pickup scheduled! Estimated earnings: ₹${estimate}`);
        setSubmitted(true);
        setSubmitting(false);
    };

    if (submitted) return (
        <div className="page-content">
            <div className="container" style={{ maxWidth: 600, textAlign: 'center' }}>
                <div style={{ background: 'white', borderRadius: 16, padding: 48, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginTop: 40 }}>
                    <div style={{ fontSize: 72, marginBottom: 20 }}>{isPlastic ? '♻️' : isManure ? '🌿' : '📱'}</div>
                    <h2 style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 800, color: '#15803D', marginBottom: 12 }}>Pickup Scheduled!</h2>
                    <p style={{ color: '#64748b', marginBottom: 20 }}>Our team will arrive at your location within 24 hours.</p>
                    <div style={{ background: '#F0FDF4', borderRadius: 12, padding: '16px 24px', marginBottom: 20 }}>
                        <div style={{ fontSize: 32, fontWeight: 900, color: '#15803D', fontFamily: 'Poppins' }}>₹{estimate}</div>
                        <div style={{ color: '#166534', fontSize: 14 }}>Estimated Earnings</div>
                    </div>
                    <div style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>+{isEwaste ? 10 : 5} Civic Points added to your account!</div>
                    <button className="btn btn-green" onClick={() => setSubmitted(false)}>Schedule Another</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="page-content">
            <div className="container" style={{ maxWidth: 700 }}>

                {/* Header */}
                <div style={{ background: `linear-gradient(135deg,${isPlastic ? '#000080,#1a1a8d' : isManure ? '#138808,#16a34a' : '#b45309,#d97706'})`, borderRadius: 14, padding: '28px 32px', marginBottom: 28, color: 'white' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>{isPlastic ? '♻️' : isManure ? '🌿' : '📱'}</div>
                    <h1 style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
                        Sell {isPlastic ? 'Plastic Waste' : isManure ? 'Organic Manure' : 'E-Waste'}
                    </h1>
                    <p style={{ opacity: 0.85, fontSize: 14, lineHeight: 1.6 }}>
                        {isPlastic
                            ? 'Schedule a free pickup and earn money for your plastic waste. We partner with certified recyclers.'
                            : isManure
                                ? 'Convert your organic waste into income. Our partners collect compost and organic manure from your doorstep.'
                                : 'Responsibly recycle your old electronics and earn cash. Certified e-waste recyclers ensure safe disposal.'}
                    </p>
                    <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
                        {(isPlastic
                            ? [['Good (PET bottles, HDPE)', '₹18/kg'], ['Average (Mixed plastic)', '₹12/kg'], ['Poor (Low grade)', '₹6/kg']]
                            : isManure
                                ? [['Fresh organic manure', '₹8/kg'], ['Dry compost', '₹5/kg'], ['Mixed organic', '₹2/kg']]
                                : [['Mobile Phone', '₹50/unit'], ['Laptop/Tablet', '₹200/unit'], ['Battery/Charger', '₹5/unit'], ['Appliance', '₹80/unit']]
                        ).map(([label, rate], i) => (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: '8px 14px', fontSize: 13 }}>
                                <div style={{ fontWeight: 600 }}>{rate}</div>
                                <div style={{ opacity: 0.85, fontSize: 11 }}>{label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Earnings Calculator */}
                {form.weight && form.condition && (
                    <div style={{ background: 'linear-gradient(135deg,#FFD700,#FF9933)', borderRadius: 12, padding: '16px 24px', marginBottom: 20, color: 'white', display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ fontSize: 36 }}>💰</div>
                        <div>
                            <div style={{ fontFamily: 'Poppins', fontSize: 32, fontWeight: 900 }}>₹{estimate}</div>
                            <div style={{ opacity: 0.9, fontSize: 14 }}>Estimated earnings for {form.weight} kg of {form.condition} quality {type}</div>
                        </div>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="card">
                    <div className="card-header"><h3>{isPlastic ? '♻️' : '🌿'} Schedule Pickup</h3></div>
                    <div className="card-body">
                        <div className="grid-2" style={{ gap: 16 }}>
                            <div className="form-group">
                                <label className="form-label">⚖️ {isEwaste ? 'Quantity (units)' : 'Estimated Weight (kg)'} <span style={{ color: 'red' }}>*</span></label>
                                <input className="form-control" type="number" min="1" max="1000" placeholder={isEwaste ? 'e.g. 3 units' : 'e.g. 25 kg'}
                                    value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">🏷️ {isEwaste ? 'Item Type' : 'Material Quality'} <span style={{ color: 'red' }}>*</span></label>
                                <select className="form-control" value={isEwaste ? form.ewasteType : form.condition}
                                    onChange={e => setForm(isEwaste ? { ...form, ewasteType: e.target.value } : { ...form, condition: e.target.value })} required>
                                    <option value="">Select {isEwaste ? 'item type' : 'quality'}...</option>
                                    {(isPlastic
                                        ? [['good', 'Good (PET bottles, HDPE)'], ['average', 'Average (Mixed plastic)'], ['poor', 'Poor (Low grade)']]
                                        : isManure
                                            ? [['good', 'Fresh organic manure'], ['average', 'Dry compost'], ['poor', 'Mixed organic']]
                                            : [['mobile', '📱 Mobile Phone (₹50/unit)'], ['laptop', '💻 Laptop / Tablet (₹200/unit)'], ['battery', '🔋 Battery / Charger (₹5/unit)'], ['appliance', '🖥️ Appliance / TV (₹80/unit)'], ['other', '📦 Other Electronics (₹20/unit)']]
                                    ).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">📍 Pickup Address <span style={{ color: 'red' }}>*</span></label>
                            <textarea className="form-control" rows={2} placeholder="Full address for pickup..." value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">📱 Contact Phone <span style={{ color: 'red' }}>*</span></label>
                            <input className="form-control" type="tel" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">📝 Additional Notes</label>
                            <textarea className="form-control" rows={2} placeholder="e.g. Please call before arriving, material stored in backyard..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                        </div>

                        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: '#1D4ED8', display: 'flex', gap: 8 }}>
                            <span>ℹ️</span>
                            <span>Payment via UPI/bank transfer within 2 working days of pickup. You also earn <strong>+{isEwaste ? 10 : 5} Civic Points</strong>!</span>
                        </div>

                        <button className="btn btn-green btn-lg" type="submit" disabled={submitting} style={{ width: '100%', justifyContent: 'center' }}>
                            {submitting ? '⏳ Scheduling...' : `📅 Schedule ${isPlastic ? 'Plastic' : isManure ? 'Manure' : 'E-Waste'} Pickup`}
                        </button>
                    </div>
                </form>

                {/* Impact card */}
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '16px 20px', marginTop: 16, display: 'flex', gap: 12 }}>
                    <span style={{ fontSize: 28 }}>🌍</span>
                    <div>
                        <div style={{ fontWeight: 700, color: '#15803D', fontSize: 14 }}>Your Environmental Impact</div>
                        <div style={{ fontSize: 13, color: '#166534', marginTop: 4 }}>
                            {isPlastic
                                ? `Recycling ${form.weight || 'X'} kg of plastic saves ~${((parseFloat(form.weight) || 1) * 2.5).toFixed(1)} kg CO₂ and prevents it from polluting our rivers and oceans.`
                                : isManure
                                    ? `Selling ${form.weight || 'X'} kg of organic manure reduces landfill burden and provides farmers natural fertilizer, reducing chemical usage.`
                                    : `E-waste contains toxic materials. Recycling ${form.weight || 'X'} unit(s) prevents hazardous chemicals from entering soil and groundwater.`}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellPage;
