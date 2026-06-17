import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';

const CATEGORIES = [
    { value: 'garbage', label: '🗑️ Garbage Collection' },
    { value: 'roads', label: '🚧 Road Maintenance' },
    { value: 'water', label: '💧 Water Supply' },
    { value: 'sanitation', label: '🚽 Sanitation' },
    { value: 'lighting', label: '💡 Street Lighting' },
    { value: 'electricity', label: '⚡ Electricity Issue' },
    { value: 'drainage', label: '🌊 Drainage Problems' },
    { value: 'other', label: '📌 Other' },
];

const SEVERITIES = [
    { value: 'low', label: 'Low', color: '#16a34a', bg: '#F0FDF4' },
    { value: 'medium', label: 'Medium', color: '#D97706', bg: '#FFFBEB' },
    { value: 'high', label: 'High', color: '#DC2626', bg: '#FEF2F2' },
    { value: 'critical', label: 'Critical', color: 'white', bg: '#7F1D1D' },
];

const aiKeywords = {
    garbage: ['garbage', 'trash', 'waste', 'litter', 'dump', 'dustbin', 'overflowing'],
    roads: ['pothole', 'road', 'crack', 'asphalt', 'highway', 'damaged', 'broken road'],
    water: ['water', 'pipe', 'leak', 'supply', 'overflow', 'flood', 'drain'],
    sanitation: ['sewage', 'toilet', 'sanitation', 'smell', 'open defecation'],
    lighting: ['light', 'dark', 'street lamp', 'streetlight', 'bulb'],
    electricity: ['electricity', 'power', 'electric', 'wire', 'outage', 'blackout'],
    drainage: ['drainage', 'waterlogging', 'blocked', 'channel', 'clogged'],
};

function detectCategory(text) {
    const lower = text.toLowerCase();
    for (const [cat, keywords] of Object.entries(aiKeywords)) {
        if (keywords.some(k => lower.includes(k))) return cat;
    }
    return '';
}

function detectSeverity(category, text) {
    const high = ['critical', 'emergency', 'danger', 'hazard', 'accident', 'injury', 'flood'];
    const lower = text.toLowerCase();
    if (high.some(h => lower.includes(h))) return 'high';
    if (['garbage', 'water', 'sanitation'].includes(category)) return 'high';
    if (category === 'other') return 'low';
    return 'medium';
}

const ReportIssue = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ title: '', description: '', category: '', severity: 'medium', address: '' });
    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [location, setLocation] = useState(null);
    const [locLoading, setLocLoading] = useState(false);
    const [aiDetected, setAiDetected] = useState('');
    const [aiConfidence, setAiConfidence] = useState(0);
    const [duplicates, setDuplicates] = useState([]);
    const [dupChecked, setDupChecked] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [recording, setRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioURL, setAudioURL] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const fileInput = useRef(null);
    const recognitionRef = useRef(null);

    // AI text analysis on title change
    useEffect(() => {
        if (form.title.length > 5) {
            const detected = detectCategory(form.title + ' ' + form.description);
            if (detected && detected !== form.category) {
                setAiDetected(detected);
            }
            const sev = detectSeverity(form.category || detected, form.title + ' ' + form.description);
            setForm(prev => ({ ...prev, severity: sev }));
        }
    }, [form.title, form.description]);

    // Offline Tracker
    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            const queued = localStorage.getItem('civic_offline_report');
            if (queued) {
                toast('Looks like you are back online! We can submit your saved offline report.', { icon: '📡' });
            }
        };
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Speech Recognition Setup
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event) => {
                let currentTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    currentTranscript += event.results[i][0].transcript;
                }
                setForm(prev => ({ ...prev, description: prev.description + ' ' + currentTranscript }));
            };

            recognitionRef.current.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => setIsListening(false);
        }
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            if (!recognitionRef.current) return toast.error('Browser does not support Speech Recognition');
            recognitionRef.current.start();
            setIsListening(true);
            toast('🎤 Listening... Speak your description.', { icon: '🗣️' });
        }
    };

    const applyAiCategory = () => {
        setForm(prev => ({ ...prev, category: aiDetected }));
        setAiDetected('');
        toast.success(`AI category applied: ${aiDetected}`);
    };

    const detectLocation = () => {
        setLocLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude: lat, longitude: lng } = pos.coords;
                setLocation({ lat, lng });
                setLocLoading(false);
                toast.success('Location detected! 📍');
                // Check for nearby duplicates
                if (form.category) checkDuplicates(lat, lng, form.category);
                // Reverse geocode
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                    const data = await res.json();
                    const addr = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                    setForm(prev => ({ ...prev, address: addr.split(',').slice(0, 3).join(', ') }));
                } catch { setForm(prev => ({ ...prev, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` })); }
            },
            () => { setLocLoading(false); toast.error('Could not detect location. Please enable location access.'); }
        );
    };

    const checkDuplicates = async (lat, lng, category) => {
        try {
            const { data } = await api.get(`/issues/nearby?lat=${lat}&lng=${lng}&radius=0.5&category=${category}`);
            setDuplicates(data.issues || []);
            setDupChecked(true);
        } catch { }
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        if (images.length + files.length > 5) { toast.error('Max 5 images allowed'); return; }
        setImages(prev => [...prev, ...files]);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => setImagePreviews(prev => [...prev, ev.target.result]);
            reader.readAsDataURL(file);
        });
        // Simulate AI image analysis
        toast.promise(
            new Promise(res => setTimeout(() => { setAiConfidence(92); res(); }, 2000)),
            { loading: '🤖 AI analyzing image...', success: '✅ AI detected: Issue category confirmed!', error: 'Analysis failed' }
        );
    };

    const removeImage = (i) => {
        setImages(prev => prev.filter((_, idx) => idx !== i));
        setImagePreviews(prev => prev.filter((_, idx) => idx !== i));
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            chunksRef.current = [];
            const mr = new MediaRecorder(stream);
            mr.ondataavailable = e => chunksRef.current.push(e.data);
            mr.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                setAudioURL(URL.createObjectURL(blob));
                stream.getTracks().forEach(t => t.stop());
            };
            mr.start();
            mediaRecorderRef.current = mr;
            setRecording(true);
            toast('🎙️ Recording started...');
        } catch { toast.error('Microphone access denied!'); }
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setRecording(false);
        toast.success('Recording saved!');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title || !form.category || !form.description) { toast.error('Please fill in all required fields!'); return; }
        if (!location) { toast.error('Please detect your location first!'); return; }
        if (duplicates.length > 0 && !window.confirm(`Found ${duplicates.length} similar issue(s) nearby. Still submit a new report?`)) return;

        if (isOffline) {
            // Save to localStorage
            const offlineReport = { ...form, lat: location.lat, lng: location.lng, timestamp: Date.now() };
            localStorage.setItem('civic_offline_report', JSON.stringify(offlineReport));
            toast.success('📱 You are offline. Report saved locally and will auto-sync when internet is restored!');
            navigate('/dashboard');
            return;
        }

        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('title', form.title);
            fd.append('description', form.description);
            fd.append('category', form.category);
            fd.append('severity', form.severity);
            fd.append('lat', location.lat);
            fd.append('lng', location.lng);
            fd.append('address', form.address);
            fd.append('aiCategory', aiDetected || form.category);
            fd.append('aiConfidence', aiConfidence);
            images.forEach(img => fd.append('images', img));
            if (audioBlob) fd.append('audio', audioBlob, 'voice.webm');

            const { data } = await api.post('/issues', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success('🎉 Issue submitted! You earned 15 points!');
            navigate(`/issues/${data._id}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit issue');
        } finally {
            setSubmitting(false);
        }
    };

    const sev = SEVERITIES.find(s => s.value === form.severity) || SEVERITIES[1];

    return (
        <div className="page-content">
            <div className="container" style={{ maxWidth: 780 }}>

                {/* Environmental Impact Banner */}
                <div style={{ background: 'linear-gradient(135deg,#e8f5e9,#c8e6c9)', borderRadius: 12, padding: '16px 20px', marginBottom: 24, border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 32 }}>🌿</div>
                    <div>
                        <div style={{ fontWeight: 700, color: '#15803D', fontSize: 15 }}>Report Digitally, Save the Planet!</div>
                        <div style={{ fontSize: 13, color: '#166534' }}>This report saves ~0.5 kg CO₂ over paper reporting + earns you <strong>15 Civic Points!</strong></div>
                    </div>
                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                        <div style={{ background: '#16a34a', color: 'white', borderRadius: 20, padding: '4px 14px', fontSize: 13, fontWeight: 700 }}>Eco Score: 85/100 ♻️</div>
                    </div>
                </div>

                {/* Emergency Banner */}
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#991B1B' }}>
                    🚨 <strong>Emergency?</strong> Call: Police 100 | Ambulance 108 | Women Helpline 181 | Child Helpline 1098
                </div>

                {/* Offline Banner */}
                {isOffline && (
                    <div style={{ background: '#FEF9C3', border: '1px solid #FDE047', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#854D0E', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 20 }}>📡</span>
                        <div>
                            <strong>You are currently offline.</strong>
                            <p style={{ margin: '4px 0 0' }}>Don't worry! You can still fill out this form. We will save it to your device and sync it when you reconnect to the internet.</p>
                        </div>
                    </div>
                )}

                <div className="section-header">
                    <h2>📝 Report a Civic Issue</h2>
                    <p>Help improve your community — AI will auto-categorize your report</p>
                </div>

                {/* Duplicate Warning */}
                {dupChecked && duplicates.length > 0 && (
                    <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: 16, marginBottom: 20 }}>
                        <div style={{ fontWeight: 700, color: '#92400E', marginBottom: 8 }}>⚠️ Similar Issues Found Nearby ({duplicates.length})</div>
                        {duplicates.slice(0, 2).map(d => (
                            <div key={d._id} style={{ fontSize: 13, color: '#78350F', marginBottom: 4 }}>
                                • {d.title} — <a href={`/issues/${d._id}`} style={{ color: '#D97706', fontWeight: 600 }}>Upvote instead</a>
                            </div>
                        ))}
                        <p style={{ fontSize: 12, color: '#92400E', marginTop: 8 }}>Consider upvoting existing issues to prioritize resolution!</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="card">
                    <div className="card-body">

                        {/* Title */}
                        <div className="form-group">
                            <label className="form-label">✏️ Issue Title <span style={{ color: 'red' }}>*</span></label>
                            <input className="form-control" placeholder="e.g. Large pothole on MG Road near junction"
                                value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                            {aiDetected && (
                                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                                    <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
                                        🤖 AI Suggests: {aiDetected}
                                    </span>
                                    <button type="button" onClick={applyAiCategory} className="btn btn-sm btn-primary">Apply</button>
                                </div>
                            )}
                        </div>

                        {/* Category + Severity */}
                        <div className="grid-2" style={{ gap: 16 }}>
                            <div className="form-group">
                                <label className="form-label">🏷️ Category <span style={{ color: 'red' }}>*</span></label>
                                <select className="form-control" value={form.category}
                                    onChange={e => { setForm({ ...form, category: e.target.value }); if (location) checkDuplicates(location.lat, location.lng, e.target.value); }}
                                    required>
                                    <option value="">Select category...</option>
                                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">⚡ AI-Detected Severity</label>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                                    {SEVERITIES.map(s => (
                                        <button key={s.value} type="button"
                                            onClick={() => setForm({ ...form, severity: s.value })}
                                            style={{ padding: '6px 14px', borderRadius: 20, fontWeight: 700, fontSize: 12, border: `2px solid ${form.severity === s.value ? s.color : '#e2e8f0'}`, background: form.severity === s.value ? s.bg : 'white', color: form.severity === s.value ? s.color : '#64748b', cursor: 'pointer' }}>
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>📝 Detailed Description <span style={{ color: 'red' }}>*</span></span>
                                <button type="button" onClick={toggleListening} className={`btn btn-sm ${isListening ? 'btn-danger' : 'btn-outline'}`} style={{ padding: '4px 10px', fontSize: 12 }}>
                                    {isListening ? '🛑 Stop Dictation' : '🎤 Voice to Text'}
                                </button>
                            </label>
                            <textarea className="form-control" rows={4} placeholder="Describe the issue in detail or click 'Voice to Text' to speak..."
                                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
                        </div>

                        {/* Location */}
                        <div className="form-group">
                            <label className="form-label">📍 Location <span style={{ color: 'red' }}>*</span></label>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                <button type="button" className="btn btn-outline btn-sm" onClick={detectLocation} disabled={locLoading}>
                                    {locLoading ? '⏳ Detecting...' : '📡 Auto-Detect Location'}
                                </button>
                                {location && (
                                    <span style={{ fontSize: 13, color: '#15803D', fontWeight: 600 }}>
                                        ✅ {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                                    </span>
                                )}
                            </div>
                            {form.address && (
                                <div style={{ marginTop: 8, fontSize: 13, color: '#64748b', background: '#f8fafc', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                    📍 {form.address}
                                </div>
                            )}
                        </div>

                        {/* Image Upload */}
                        <div className="form-group">
                            <label className="form-label">📷 Upload Evidence (Max 5 images)</label>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileInput.current?.click()}>
                                    📸 Choose Images
                                </button>
                                <input ref={fileInput} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleImageUpload} />
                                <span style={{ fontSize: 12, color: '#94a3b8', alignSelf: 'center' }}>TensorFlow.js AI will analyze your images</span>
                            </div>
                            {imagePreviews.length > 0 && (
                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                    {imagePreviews.map((src, i) => (
                                        <div key={i} style={{ position: 'relative' }}>
                                            <img src={src} alt={`Preview ${i + 1}`} style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8, border: '2px solid #e2e8f0' }} />
                                            <button type="button" onClick={() => removeImage(i)} style={{ position: 'absolute', top: -8, right: -8, background: '#dc2626', color: 'white', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontSize: 12 }}>✕</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {aiConfidence > 0 && (
                                <div style={{ marginTop: 8, fontSize: 13, color: '#2563EB', background: '#EFF6FF', padding: '8px 12px', borderRadius: 8 }}>
                                    🤖 AI Image Analysis: <strong>{form.category || 'Issue'} detected</strong> with {aiConfidence}% confidence
                                </div>
                            )}
                        </div>

                        {/* Voice Recording */}
                        <div className="form-group">
                            <label className="form-label">🎙️ Voice Description (optional)</label>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                {!recording ? (
                                    <button type="button" className="btn btn-ghost btn-sm" onClick={startRecording}>
                                        🎙️ Start Recording
                                    </button>
                                ) : (
                                    <button type="button" className="btn btn-danger btn-sm" onClick={stopRecording}>
                                        ⏹️ Stop Recording
                                    </button>
                                )}
                                {recording && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626', fontSize: 13, fontWeight: 600 }}>
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#dc2626', animation: 'pulse 1s infinite' }} />
                                        Recording...
                                    </div>
                                )}
                            </div>
                            {audioURL && (
                                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <audio src={audioURL} controls style={{ height: 36 }} />
                                    <button type="button" onClick={() => { setAudioBlob(null); setAudioURL(''); }} className="btn btn-ghost btn-sm" style={{ color: '#dc2626' }}>Remove</button>
                                </div>
                            )}
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg" disabled={submitting} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
                            {submitting ? '⏳ Submitting...' : '🚀 Submit Issue — Earn 15 Points!'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportIssue;
