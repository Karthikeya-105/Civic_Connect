import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const RESPONSES = {
    default: 'I can help you report civic issues, check your reports, or earn badges! What would you like to do?',
    report: 'To report an issue: 1) Click "Report Issue" in the nav 2) Fill in the title and description 3) Select category 4) Auto-detect your location 5) Upload photos 6) Submit and earn 15 points! 🎯',
    map: 'You can view all reported issues on the interactive map at /map. Use filters to find issues by type, severity, or status. Toggle the heatmap to see problem hotspots! 🗺️',
    points: 'You earn points by: Reporting issues (+15), Getting issues resolved (+25), Upvoting (+2), Commenting (+3). Level up from Newcomer → Volunteer → Guardian → Warrior → Champion! ⭐',
    badges: 'Earn badges by contributing to your community! Visit the Awards page to see all available badges and how to unlock them. 🏆',
    hello: 'Namaste! 🙏 I am your CivicConnect AI assistant. How can I help you make your city better today?',
    admin: 'Admin features include: viewing all issues on map, updating status, assigning departments, viewing analytics, and managing users. Login with admin credentials to access the admin dashboard.',
    status: 'Check your issue status in "My Reports". Issues go through: Submitted → Verified → Assigned → In Progress → Resolved. You\'ll get notifications at each step! 🔔',
    plastic: 'You can sell plastic waste through CivicConnect! Visit "Sell Plastic" to schedule a free doorstep pickup. Earn ₹6-18/kg depending on quality, plus 5 civic points! ♻️',
    manure: 'Schedule organic manure pickup at "Sell Manure". Earn ₹2-8/kg and help local farmers with natural fertilizer. Plus 5 civic points! 🌿',
};

function getResponse(msg) {
    const m = msg.toLowerCase();
    if (m.includes('hello') || m.includes('hi') || m.includes('namaste')) return RESPONSES.hello;
    if (m.includes('report') || m.includes('submit') || m.includes('issue')) return RESPONSES.report;
    if (m.includes('map') || m.includes('location') || m.includes('heat')) return RESPONSES.map;
    if (m.includes('point') || m.includes('level')) return RESPONSES.points;
    if (m.includes('badge') || m.includes('award')) return RESPONSES.badges;
    if (m.includes('admin') || m.includes('manage')) return RESPONSES.admin;
    if (m.includes('status') || m.includes('track')) return RESPONSES.status;
    if (m.includes('plastic') || m.includes('recycle')) return RESPONSES.plastic;
    if (m.includes('manure') || m.includes('organic')) return RESPONSES.manure;
    return RESPONSES.default;
}

const Chatbot = () => {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        { from: 'bot', text: `Namaste! 🙏 I'm CivicBot, your AI assistant. How can I help you today?` }
    ]);
    const [input, setInput] = useState('');
    const [typing, setTyping] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

    const send = () => {
        if (!input.trim()) return;
        const userMsg = input.trim();
        setMessages(prev => [...prev, { from: 'user', text: userMsg }]);
        setInput('');
        setTyping(true);
        setTimeout(() => {
            setTyping(false);
            setMessages(prev => [...prev, { from: 'bot', text: getResponse(userMsg) }]);
        }, 800 + Math.random() * 600);
    };

    const quickReplies = ['How to report?', 'Check my points', 'View the map', 'Sell plastic'];

    return (
        <>
            {/* Floating button */}
            <button className="chatbot-fab" onClick={() => setOpen(!open)} title="CivicBot AI Assistant">
                {open ? '✕' : '🤖'}
            </button>

            {/* Chat window */}
            {open && (
                <div className="chatbot-window">
                    {/* Header */}
                    <div className="chatbot-header">
                        <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🤖</div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>CivicBot AI</div>
                            <div style={{ fontSize: 11, opacity: 0.8 }}>🟢 Online — Powered by Gemini</div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="chatbot-messages">
                        {messages.map((m, i) => (
                            <div key={i} className={`chat-msg ${m.from}`}>{m.text}</div>
                        ))}
                        {typing && (
                            <div className="chat-msg bot" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#000080', animation: 'pulse 0.8s infinite' }} />
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#000080', animation: 'pulse 0.8s 0.2s infinite' }} />
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#000080', animation: 'pulse 0.8s 0.4s infinite' }} />
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Quick replies */}
                    <div style={{ padding: '6px 12px', display: 'flex', gap: 6, flexWrap: 'wrap', borderTop: '1px solid #f1f5f9' }}>
                        {quickReplies.map((q, i) => (
                            <button key={i} onClick={() => { setInput(q); setTimeout(send, 50); }} style={{ padding: '4px 10px', borderRadius: 14, border: '1px solid #e2e8f0', background: 'white', fontSize: 12, cursor: 'pointer', color: '#000080', fontWeight: 500 }}>
                                {q}
                            </button>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="chatbot-input">
                        <input placeholder="Ask me anything..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
                        <button onClick={send} style={{ background: 'linear-gradient(135deg,#000080,#FF9933)', border: 'none', color: 'white', width: 36, height: 36, borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>➤</button>
                    </div>
                </div>
            )}
        </>
    );
};

export default Chatbot;
