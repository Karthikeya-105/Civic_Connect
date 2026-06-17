import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../api';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { lang, setLang, t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const [notifs, setNotifs] = useState([]);
    const [unread, setUnread] = useState(0);
    const [showNotifs, setShowNotifs] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showServices, setShowServices] = useState(false);
    const notifRef = useRef(null);
    const profileRef = useRef(null);
    const servicesRef = useRef(null);

    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Request push notification permission
            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }
        const interval = setInterval(() => user && fetchNotifications(), 30000);
        return () => clearInterval(interval);
    }, [user]);

    useEffect(() => {
        const handleClick = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
            if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
            if (servicesRef.current && !servicesRef.current.contains(e.target)) setShowServices(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const fetchNotifications = async () => {
        try {
            const { data } = await api.get('/notifications/mine');

            // Check for new unread notifications to trigger push alert
            if (data.unreadCount > unread && 'Notification' in window && Notification.permission === 'granted') {
                const newNotifs = data.notifications.filter(n => !n.read && !notifs.find(old => old._id === n._id));
                newNotifs.forEach(n => {
                    new Notification('CivicConnect Update', {
                        body: n.message || n.title,
                        icon: '/favicon.ico'
                    });
                });
            }

            setNotifs(data.notifications || []);
            setUnread(data.unreadCount || 0);
        } catch { }
    };

    const markAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setUnread(0);
            setNotifs(prev => prev.map(n => ({ ...n, read: true })));
        } catch { }
    };

    const handleLogout = () => { logout(); navigate('/'); };

    const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
    const isActive = (path) => location.pathname === path;

    const navStyle = (active) => ({
        color: active ? '#FFD700' : 'rgba(255,255,255,0.85)',
        textDecoration: 'none',
        padding: '8px 14px',
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: 'Inter, sans-serif'
    });

    const dropdownStyle = {
        padding: '10px 14px',
        textDecoration: 'none',
        color: '#1e293b',
        fontSize: 14,
        fontWeight: 500,
        borderRadius: 6,
        display: 'block',
        transition: 'background 0.2s',
    };

    const navLinks = user?.role === 'admin'
        ? [
            { to: '/admin', label: `📊 ${t('home', 'Home')}` },
            { to: '/admin/analytics', label: `📈 Analytics` },
            { to: '/map', label: `🗺️ ${t('map', 'Map')}` },
            { to: '/about', label: `ℹ️ ${t('about', 'About')}` }
        ]
        : user ? [
            { to: '/dashboard', label: `🏠 ${t('home', 'Home')}` },
            { to: '/report', label: `📝 ${t('report', 'Report')}` },
            { to: '/map', label: `🗺️ ${t('map', 'Map')}` },
            { to: '/my-reports', label: `📋 ${t('myReports', 'My Reports')}` },
            { to: '/donate', label: `👕 ${t('donate', 'Donate')}` },
            { to: '/cleanup-drives', label: `🧹 ${t('cleanupDrives', 'Cleanup Drives')}` },
            { to: '/sell/plastic', label: `♻️ ${t('sellPlastic', 'Sell Plastic')}` },
            { to: '/sell/manure', label: `🌿 ${t('sellManure', 'Sell Manure')}` },
            { to: '/sell/ewaste', label: `📱 Sell E-Waste` },
            { to: '/awards', label: `🏆 ${t('awards', 'Awards')}` }
        ] : [
            { to: '/login', label: 'Login' },
            { to: '/signup', label: 'Sign Up' }
        ];

    return (
        <>
            {/* Top banner */}
            <div style={{ background: 'linear-gradient(135deg,#FF9933 0%,#ffffff 50%,#138808 100%)', borderBottom: '2px solid #000080', padding: '8px 0', textAlign: 'center' }}>
                <span style={{ color: '#000080', fontWeight: 700, fontSize: 13, letterSpacing: 0.5 }}>🇮🇳 Swadeshi CivicConnect — Atmanirbhar Bharat Initiative</span>
            </div>

            {/* Header */}
            <header style={{ background: '#000080', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', position: 'sticky', top: 0, zIndex: 100 }}>
                <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
                    {/* Logo */}
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
                        <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#FF9933,#FFD700)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>🏛️</div>
                        <div>
                            <div style={{ color: 'white', fontFamily: 'Poppins', fontWeight: 800, fontSize: 18, letterSpacing: 0.5, lineHeight: 1.2 }}>CivicConnect</div>
                            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 500 }}>Digital India Initiative</div>
                        </div>
                    </Link>

                    {/* Nav links - desktop */}
                    <nav style={{ display: 'flex', gap: 6, alignItems: 'center' }} className="nav-desktop">
                        {user?.role === 'admin' ? (
                            <>
                                <Link to="/admin" style={navStyle(isActive('/admin'))}>📊 {t('home')}</Link>
                                <Link to="/admin/analytics" style={navStyle(isActive('/admin/analytics'))}>📈 Analytics</Link>
                                <Link to="/map" style={navStyle(isActive('/map'))}>🗺️ {t('map')}</Link>
                                <Link to="/about" style={navStyle(isActive('/about'))}>ℹ️ {t('about')}</Link>
                            </>
                        ) : (
                            <>
                                <Link to="/dashboard" style={navStyle(isActive('/dashboard'))}>🏠 {t('home')}</Link>
                                <Link to="/report" style={navStyle(isActive('/report'))}>📝 {t('report')}</Link>
                                <Link to="/map" style={navStyle(isActive('/map'))}>🗺️ {t('map')}</Link>

                                {/* Services Dropdown */}
                                <div ref={servicesRef} style={{ position: 'relative' }} onMouseEnter={() => setShowServices(true)} onMouseLeave={() => setShowServices(false)}>
                                    <button style={navStyle(showServices || ['/my-reports', '/donate', '/cleanup-drives', '/sell/plastic', '/sell/manure', '/sell/ewaste'].some(isActive))} onClick={() => setShowServices(!showServices)}>
                                        🛠️ Services ▾
                                    </button>
                                    {showServices && (
                                        <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 8, background: 'white', borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.15)', minWidth: 200, padding: 8, zIndex: 50, display: 'flex', flexDirection: 'column', gap: 2, border: '1px solid #e2e8f0' }}>
                                            <Link to="/my-reports" style={dropdownStyle} onMouseEnter={e => e.target.style.background = '#f1f5f9'} onMouseLeave={e => e.target.style.background = 'transparent'}>📋 {t('myReports')}</Link>
                                            <Link to="/donate" style={dropdownStyle} onMouseEnter={e => e.target.style.background = '#f1f5f9'} onMouseLeave={e => e.target.style.background = 'transparent'}>👕 {t('donate')}</Link>
                                            <Link to="/cleanup-drives" style={dropdownStyle} onMouseEnter={e => e.target.style.background = '#f1f5f9'} onMouseLeave={e => e.target.style.background = 'transparent'}>🧹 {t('cleanupDrives')}</Link>
                                            <Link to="/sell/plastic" style={dropdownStyle} onMouseEnter={e => e.target.style.background = '#f1f5f9'} onMouseLeave={e => e.target.style.background = 'transparent'}>♻️ {t('sellPlastic')}</Link>
                                            <Link to="/sell/manure" style={dropdownStyle} onMouseEnter={e => e.target.style.background = '#f1f5f9'} onMouseLeave={e => e.target.style.background = 'transparent'}>🌿 {t('sellManure')}</Link>
                                            <Link to="/sell/ewaste" style={dropdownStyle} onMouseEnter={e => e.target.style.background = '#f1f5f9'} onMouseLeave={e => e.target.style.background = 'transparent'}>📱 Sell E-Waste</Link>
                                        </div>
                                    )}
                                </div>

                                <Link to="/awards" style={navStyle(isActive('/awards'))}>🏆 {t('awards')}</Link>
                            </>
                        )}
                    </nav>

                    {/* Right actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {user ? (
                            <>
                                {/* Points pill */}
                                <div className="points-badge" style={{ fontSize: 12 }}>⭐ {user.points || 0}</div>

                                {/* Notifications */}
                                <div ref={notifRef} style={{ position: 'relative' }}>
                                    <button onClick={() => setShowNotifs(!showNotifs)} style={{
                                        background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
                                        width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, position: 'relative'
                                    }}>
                                        🔔
                                        {unread > 0 && (
                                            <span style={{ position: 'absolute', top: -4, right: -4, background: '#dc2626', color: 'white', borderRadius: '50%', width: 18, height: 18, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                                                {unread > 9 ? '9+' : unread}
                                            </span>
                                        )}
                                    </button>

                                    {showNotifs && (
                                        <div style={{ position: 'absolute', top: 46, right: 0, width: 320, background: 'white', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.2)', border: '1px solid #e2e8f0', zIndex: 200 }}>
                                            <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontWeight: 700, fontSize: 14 }}>Notifications</span>
                                                {unread > 0 && <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Mark all read</button>}
                                            </div>
                                            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                                                {notifs.length === 0 ? (
                                                    <div style={{ padding: 20, textAlign: 'center', color: '#64748b', fontSize: 13 }}>No notifications yet</div>
                                                ) : notifs.map(n => (
                                                    <div key={n._id} style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', background: n.read ? 'white' : '#eff6ff', cursor: 'pointer' }}>
                                                        <div style={{ fontWeight: 600, fontSize: 13 }}>{n.title}</div>
                                                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{n.message}</div>
                                                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{new Date(n.createdAt).toLocaleString()}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Profile */}
                                <div ref={profileRef} style={{ position: 'relative' }}>
                                    <button onClick={() => setShowProfile(!showProfile)} style={{
                                        background: 'linear-gradient(135deg,#FF9933,#FFD700)', border: 'none', borderRadius: '50%',
                                        width: 36, height: 36, cursor: 'pointer', color: 'white', fontWeight: 700, fontSize: 14
                                    }}>
                                        {getInitials(user.name)}
                                    </button>

                                    {showProfile && (
                                        <div style={{ position: 'absolute', top: 46, right: 0, width: 200, background: 'white', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.2)', border: '1px solid #e2e8f0', zIndex: 200, overflow: 'hidden' }}>
                                            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                                                <div style={{ fontWeight: 700, fontSize: 14 }}>{user.name}</div>
                                                <div style={{ fontSize: 12, color: '#64748b' }}>{user.level || 'Civic Newcomer'}</div>
                                            </div>
                                            {[
                                                { to: '/profile', label: `👤 ${t('profile')}` },
                                                { to: '/my-reports', label: `📋 ${t('myReports')}` },
                                                { to: '/awards', label: `🏆 ${t('awards')}` },
                                            ].map(item => (
                                                <Link key={item.to} to={item.to} onClick={() => setShowProfile(false)} style={{ display: 'block', padding: '10px 16px', fontSize: 13, color: '#1a202c', textDecoration: 'none', transition: 'background 0.2s' }}
                                                    onMouseEnter={e => e.target.style.background = '#f0f4f8'}
                                                    onMouseLeave={e => e.target.style.background = 'white'}>
                                                    {item.label}
                                                </Link>
                                            ))}
                                            <button onClick={handleLogout} style={{ width: '100%', padding: '10px 16px', fontSize: 13, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderTop: '1px solid #e2e8f0' }}>
                                                🚪 Logout
                                            </button>
                                            {/* End of Profile Menu */}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="btn btn-ghost btn-sm" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>Login</Link>
                                <Link to="/signup" className="btn btn-saffron btn-sm">Sign Up</Link>
                            </>
                        )}

                        {/* Language Toggle */}
                        <select
                            value={lang}
                            onChange={(e) => setLang(e.target.value)}
                            style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, padding: '4px 8px', fontSize: 13, cursor: 'pointer', outline: 'none' }}
                        >
                            <option value="en" style={{ color: 'black' }}>EN</option>
                            <option value="hi" style={{ color: 'black' }}>हिंदी</option>
                            <option value="te" style={{ color: 'black' }}>తెలుగు</option>
                        </select>

                        {/* Mobile menu button */}
                        <button onClick={() => setShowMobileMenu(!showMobileMenu)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: 36, height: 36, borderRadius: 8, cursor: 'pointer', display: 'none', fontSize: 18 }} className="mobile-menu-btn">
                            ☰
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {showMobileMenu && (
                    <div style={{ background: '#000066', padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        {navLinks.map(link => (
                            <Link key={link.to} to={link.to} onClick={() => setShowMobileMenu(false)} style={{ display: 'block', color: 'rgba(255,255,255,0.9)', textDecoration: 'none', padding: '10px 0', fontSize: 14, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                {link.label}
                            </Link>
                        ))}
                    </div>
                )}
            </header>

            <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .mobile-menu-btn { display: flex !important; align-items: center; justify-content: center; }
        }
      `}</style>
        </>
    );
};

export default Navbar;
