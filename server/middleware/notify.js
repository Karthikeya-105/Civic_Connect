const nodemailer = require('nodemailer');
const https = require('https');
const http = require('http');
const url = require('url');

// ─── EMAIL via Gmail SMTP ──────────────────────────────────────────────────────
let transporter = null;

const getTransporter = () => {
    if (!transporter && process.env.GMAIL_USER && process.env.GMAIL_PASS) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS }
        });
    }
    return transporter;
};

const sendEmail = async (to, subject, html) => {
    const t = getTransporter();
    if (!t || !to) return false;
    try {
        await t.sendMail({
            from: `"CivicConnect" <${process.env.GMAIL_USER}>`,
            to,
            subject,
            html
        });
        console.log(`📧 Email sent to ${to}`);
        return true;
    } catch (err) {
        console.error('Email error:', err.message);
        return false;
    }
};

// ─── WHATSAPP via CallMeBot API (free) ────────────────────────────────────────
// User must subscribe once at https://www.callmebot.com/blog/free-api-whatsapp-messages/
const sendWhatsApp = async (phone, message) => {
    const apiKey = process.env.CALLMEBOT_APIKEY;
    if (!apiKey || !phone) return false;

    // Format phone: remove spaces, ensure starts with country code (no +)
    const cleanPhone = phone.replace(/\D/g, '').replace(/^0+/, '');
    const encodedMsg = encodeURIComponent(message);
    const apiUrl = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodedMsg}&apikey=${apiKey}`;

    return new Promise((resolve) => {
        const parsedUrl = url.parse(apiUrl);
        const req = https.get({ hostname: parsedUrl.hostname, path: parsedUrl.path }, (res) => {
            console.log(`📱 WhatsApp sent to ${cleanPhone}, status: ${res.statusCode}`);
            resolve(true);
        });
        req.on('error', (err) => {
            console.error('WhatsApp error:', err.message);
            resolve(false);
        });
        req.setTimeout(8000, () => { req.abort(); resolve(false); });
    });
};

// ─── Compose notification messages ────────────────────────────────────────────
const statusLabels = {
    submitted: '📋 Submitted',
    assigned: '📌 Assigned to Department',
    progress: '🔧 In Progress',
    verified: '✅ Verified',
    resolved: '✔️ Resolved',
    rejected: '❌ Rejected'
};

const composeIssueUpdateMsg = (issueTitle, newStatus, issueId) => {
    const statusLabel = statusLabels[newStatus] || newStatus;
    const link = `${process.env.CLIENT_URL || 'http://localhost:5173'}/issues/${issueId}`;
    return `🏙️ CivicConnect Update\n\nYour issue: "${issueTitle}"\nStatus: ${statusLabel}\n\nTrack it: ${link}`;
};

const composeEmailHtml = (userName, issueTitle, newStatus, issueId) => {
    const statusLabel = statusLabels[newStatus] || newStatus;
    const link = `${process.env.CLIENT_URL || 'http://localhost:5173'}/issues/${issueId}`;
    return `
    <div style="font-family:Inter,sans-serif;max-width:540px;margin:auto;background:#f8fafc;padding:24px;border-radius:12px">
      <div style="background:linear-gradient(135deg,#138808,#16a34a);padding:20px 24px;border-radius:8px;color:white;margin-bottom:20px">
        <h1 style="margin:0;font-size:20px">🏙️ CivicConnect</h1>
        <p style="margin:6px 0 0;opacity:0.85;font-size:13px">Civic Issue Status Update</p>
      </div>
      <p style="color:#374151;font-size:15px">Hi <strong>${userName}</strong>,</p>
      <p style="color:#374151">Your reported issue has been updated:</p>
      <div style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:16px 0">
        <div style="font-weight:700;color:#111827;font-size:15px">${issueTitle}</div>
        <div style="margin-top:8px;font-size:24px">${statusLabel}</div>
      </div>
      <a href="${link}" style="display:inline-block;background:#138808;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">🔗 Track Your Issue</a>
      <p style="color:#9ca3af;font-size:12px;margin-top:20px">CivicConnect — Empowering Citizens, Building Better Cities</p>
    </div>`;
};

// ─── Main notification dispatcher ─────────────────────────────────────────────
const notifyIssueUpdate = async (reporter, issueTitle, newStatus, issueId) => {
    if (!reporter) return;
    const { name, email, whatsapp, phone, notifyEmail, notifyWhatsapp } = reporter;

    const waPhone = whatsapp || phone;
    const msg = composeIssueUpdateMsg(issueTitle, newStatus, issueId);

    const promises = [];

    if (notifyWhatsapp !== false && waPhone) {
        promises.push(sendWhatsApp(waPhone, msg));
    }
    if (notifyEmail !== false && email) {
        promises.push(sendEmail(email, `[CivicConnect] Issue Update: ${issueTitle}`, composeEmailHtml(name || 'Citizen', issueTitle, newStatus, issueId)));
    }

    await Promise.allSettled(promises);
};

module.exports = { sendEmail, sendWhatsApp, notifyIssueUpdate };
