import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const StatCard = ({ value, label, emoji }) => (
    <div style={{ textAlign: 'center', padding: '20px 10px' }}>
        <div style={{ fontSize: 42, fontWeight: 900, color: 'white', fontFamily: 'Poppins' }}>{value}</div>
        <div style={{ fontSize: 20, margin: '4px 0' }}>{emoji}</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>{label}</div>
    </div>
);

const FeatureCard = ({ icon, title, desc, color }) => (
    <div className="card fade-in-up" style={{ padding: 24, borderTop: `4px solid ${color}`, transition: 'all 0.3s', cursor: 'default' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = ''; }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a202c', marginBottom: 8 }}>{title}</h3>
        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{desc}</p>
    </div>
);

const Landing = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const heroRef = useRef(null);

    useEffect(() => {
        // Parallax on scroll
        const handleScroll = () => {
            if (heroRef.current) {
                heroRef.current.style.backgroundPositionY = `${window.scrollY * 0.3}px`;
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const features = [
        { icon: '📸', title: 'Smart Issue Reporting', desc: 'Upload photos, record voice, and auto-detect your location for precise civic issue reporting with AI-powered categorization.', color: '#FF9933' },
        { icon: '🗺️', title: 'Live Issue Map', desc: 'See all reported issues on an interactive map with heatmap visualization. Identify problem hotspots instantly.', color: '#000080' },
        { icon: '🤖', title: 'AI Classification', desc: 'TensorFlow.js AI automatically detects issue category from uploaded images — potholes, garbage, broken lights, and more.', color: '#138808' },
        { icon: '🔔', title: 'Real-Time Updates', desc: 'Get instant notifications when your issue status changes — from submitted to in-progress to resolved.', color: '#FF9933' },
        { icon: '🏆', title: 'Gamification', desc: 'Earn points and badges for every report, upvote, and community contribution. Climb the civic leaderboard!', color: '#000080' },
        { icon: '📊', title: 'Analytics Dashboard', desc: 'Comprehensive insights into civic issues by category, location, resolution rate, and predictive trends.', color: '#138808' },
        { icon: '♻️', title: 'Sell Plastic & Manure', desc: 'Schedule pickup and earn money by selling plastic waste and organic compost to authorized recyclers.', color: '#FF9933' },
        { icon: '🛡️', title: 'Duplicate Prevention', desc: 'Geo-based duplicate detection prevents redundant reports. Automatically suggests upvoting existing nearby issues.', color: '#000080' },
        { icon: '🔗', title: 'Auto Department Routing', desc: 'AI automatically assigns each issue to the right government department for faster resolution.', color: '#138808' },
    ];

    const steps = [
        { icon: '📝', title: 'Report an Issue', desc: 'Take a photo, describe the problem, and let AI categorize it automatically' },
        { icon: '🗺️', title: 'It Goes on the Map', desc: 'Your report appears on the live city map for all citizens and authorities' },
        { icon: '👍', title: 'Community Upvotes', desc: 'Citizens upvote high-priority issues to push them to top of authority queue' },
        { icon: '✅', title: 'Authorities Resolve', desc: 'Admin dashboard tracks and resolves issues with before/after photo proof' },
    ];

    return (
        <div>
            {/* HERO */}
            <div ref={heroRef} style={{
                background: 'linear-gradient(135deg, #000080 0%, #1a1a8d 40%, #000066 100%)',
                padding: '80px 0 60px',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Background decorations */}
                {['10%', '30%', '60%', '80%', '95%'].map((left, i) => (
                    <div key={i} style={{
                        position: 'absolute',
                        width: [80, 120, 100, 60, 140][i],
                        height: [80, 120, 100, 60, 140][i],
                        borderRadius: '50%',
                        background: ['#FF993320', '#13880815', '#FFD70015', '#FF993318', '#13880810'][i],
                        left, top: ['10%', '60%', '20%', '70%', '40%'][i],
                    }} />
                ))}

                <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                    {/* Badge */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,153,51,0.2)', border: '1px solid rgba(255,153,51,0.5)', borderRadius: 30, padding: '6px 16px', marginBottom: 24, color: '#FFD700', fontSize: 13, fontWeight: 600 }}>
                        🇮🇳 Atmanirbhar Bharat — Digital India Initiative
                    </div>

                    <h1 style={{ fontFamily: 'Poppins', fontSize: 'clamp(28px,5vw,56px)', fontWeight: 900, color: 'white', lineHeight: 1.15, marginBottom: 20 }}>
                        {t('heroTitle')} <span style={{ background: 'linear-gradient(90deg,#FF9933,#FFD700)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t('heroTitle2')}</span>
                    </h1>

                    <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.82)', maxWidth: 560, margin: '0 auto 36px', lineHeight: 1.7 }}>
                        {t('heroSubtitle')}
                    </p>

                    <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                        {user ? (
                            <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="btn btn-saffron btn-lg">
                                📊 {t('heroTitle2')} Dashboard
                            </Link>
                        ) : (
                            <Link to="/signup" className="btn btn-saffron btn-lg">
                                📝 {t('getStarted')}
                            </Link>
                        )}
                        <Link to="/map" className="btn btn-outline btn-lg" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)' }}>
                            🗺️ {t('watchDemo')}
                        </Link>
                    </div>

                    {/* Hero stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, marginTop: 64, borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 40, maxWidth: 800, margin: '64px auto 0' }}>
                        <StatCard value="12,456" label="Issues Reported" emoji="📋" />
                        <StatCard value="89%" label="Resolution Rate" emoji="✅" />
                        <StatCard value="2.3 Days" label="Avg Resolution" emoji="⚡" />
                        <StatCard value="48,200" label="Active Citizens" emoji="👥" />
                    </div>
                </div>
            </div>

            {/* HOW IT WORKS */}
            <div style={{ background: '#f8fafc', padding: '70px 0' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: 48 }}>
                        <h2 style={{ fontFamily: 'Poppins', fontSize: 32, fontWeight: 800, color: '#000080', marginBottom: 10 }}>
                            How It Works
                        </h2>
                        <p style={{ color: '#64748b', fontSize: 16 }}>Four simple steps to fix your city</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 24 }}>
                        {steps.map((step, i) => (
                            <div key={i} style={{ textAlign: 'center', padding: '0 10px' }}>
                                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#000080,#1a1a8d)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28, boxShadow: '0 4px 20px rgba(0,0,128,0.3)' }}>
                                    {step.icon}
                                </div>
                                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#FF9933', color: 'white', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '-20px auto 12px', position: 'relative', zIndex: 1, boxShadow: '0 2px 8px rgba(255,153,51,0.4)' }}>
                                    {i + 1}
                                </div>
                                <h3 style={{ fontWeight: 700, fontSize: 15, color: '#1a202c', marginBottom: 8 }}>{step.title}</h3>
                                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FEATURES */}
            <div style={{ padding: '70px 0' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: 48 }}>
                        <h2 style={{ fontFamily: 'Poppins', fontSize: 32, fontWeight: 800, color: '#000080', marginBottom: 10 }}>
                            🚀 Powerful Civic Features
                        </h2>
                        <p style={{ color: '#64748b', fontSize: 16 }}>Everything you need for a cleaner, smarter city.</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
                        {features.map((f, i) => <FeatureCard key={i} {...f} />)}
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div style={{ background: 'linear-gradient(135deg,#138808 0%,#0f6b06 100%)', padding: '70px 0', textAlign: 'center' }}>
                <div className="container">
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🌿</div>
                    <h2 style={{ fontFamily: 'Poppins', fontSize: 32, fontWeight: 800, color: 'white', marginBottom: 14 }}>Start Making a Difference</h2>
                    <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.7 }}>
                        Join thousands of citizens already making their cities cleaner, safer, and smarter.
                    </p>
                    <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to={user ? '/report' : '/signup'} className="btn btn-lg" style={{ background: 'white', color: '#138808', fontWeight: 800 }}>
                            🎯 {user ? 'Report an Issue Now' : 'Join CivicConnect — Free'}
                        </Link>
                        {!user && <Link to="/login" className="btn btn-outline btn-lg" style={{ borderColor: 'rgba(255,255,255,0.5)', color: 'white' }}>Already a member? Login</Link>}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', maxWidth: 640, margin: '48px auto 0', gap: 16 }}>
                        {[['🌳 15k+', 'Trees Saved'], ['♻️ 4.2T', 'CO₂ Reduced'], ['🏭 78%', 'Local Tech'], ['💼 15k', 'Green Jobs']].map(([v, l], i) => (
                            <div key={i} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 22, fontWeight: 800, color: 'white' }}>{v}</div>
                                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{l}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <footer style={{ background: '#000080', color: 'white', padding: '40px 0 20px' }}>
                <div className="container">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 30, marginBottom: 30 }}>
                        <div>
                            <h4 style={{ fontFamily: 'Poppins', marginBottom: 14 }}>🏛️ CivicConnect</h4>
                            <p style={{ fontSize: 13, opacity: 0.8, lineHeight: 1.7 }}>Swadeshi CivicConnect — Empowering Atmanirbhar Bharat with indigenous solutions for civic management.</p>
                        </div>
                        <div>
                            <h4 style={{ marginBottom: 14 }}>Quick Links</h4>
                            {[['🗺️ Map View', '/map'], ['📝 Report Issue', '/report'], ['📊 Analytics', '/admin/analytics'], ['ℹ️ About', '/about']].map(([l, to]) => (
                                <Link key={to} to={to} style={{ display: 'block', color: 'rgba(255,255,255,0.8)', fontSize: 13, textDecoration: 'none', marginBottom: 6 }}>{l}</Link>
                            ))}
                        </div>
                        <div>
                            <h4 style={{ marginBottom: 14 }}>Emergency</h4>
                            <p style={{ fontSize: 13, opacity: 0.85, lineHeight: 2 }}>🚔 Police: 100<br />🚑 Ambulance: 108<br />👩 Women: 181<br />👶 Child: 1098</p>
                        </div>
                    </div>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 20, textAlign: 'center', fontSize: 13, opacity: 0.7 }}>
                        © 2024 Swadeshi CivicConnect — Atmanirbhar Bharat. Digital India Initiative.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
