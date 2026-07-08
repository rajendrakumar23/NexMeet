const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
};

const sendOTPEmail = async (email, otp) => {
  await sendEmail({
    to: email,
    subject: 'NexMeet - Password Reset OTP',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;background:#0f0f1a;color:#fff;padding:40px;border-radius:16px;">
        <h1 style="color:#6366f1;text-align:center;">NexMeet</h1>
        <h2 style="text-align:center;">Password Reset OTP</h2>
        <p style="text-align:center;color:#a1a1aa;">Use the OTP below to reset your password. It expires in 10 minutes.</p>
        <div style="background:#1e1e2e;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
          <span style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#6366f1;">${otp}</span>
        </div>
        <p style="text-align:center;color:#71717a;font-size:12px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });
};

const sendMeetingInvite = async (email, meetingId, inviteLink, hostName) => {
  await sendEmail({
    to: email,
    subject: `${hostName} invited you to a NexMeet meeting`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;background:#0f0f1a;color:#fff;padding:40px;border-radius:16px;">
        <h1 style="color:#6366f1;text-align:center;">NexMeet</h1>
        <h2 style="text-align:center;">You're Invited!</h2>
        <p style="text-align:center;color:#a1a1aa;"><strong>${hostName}</strong> has invited you to join a meeting.</p>
        <div style="background:#1e1e2e;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
          <p style="color:#71717a;">Meeting ID</p>
          <span style="font-size:24px;font-weight:bold;color:#6366f1;">${meetingId}</span>
        </div>
        <a href="${inviteLink}" style="display:block;background:#6366f1;color:#fff;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:bold;">Join Meeting</a>
      </div>
    `,
  });
};

module.exports = { sendEmail, sendOTPEmail, sendMeetingInvite };
