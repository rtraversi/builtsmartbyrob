// Email via the same Zoho SMTP mailbox rmtnetworks uses (see its lib/email-sender.js).
//
// Env: ZOHO_SMTP_USER, ZOHO_SMTP_PASSWORD
//      optional ZOHO_SMTP_HOST (smtp.zoho.com), ZOHO_SMTP_PORT (465),
//      ZOHO_FROM_ADDRESS (defaults to ZOHO_SMTP_USER)
const nodemailer = require('nodemailer');

async function sendEmail({ to, subject, text, html }) {
  const user = process.env.ZOHO_SMTP_USER;
  if (!user || !process.env.ZOHO_SMTP_PASSWORD) {
    throw new Error('Zoho SMTP is not configured (ZOHO_SMTP_USER / ZOHO_SMTP_PASSWORD)');
  }

  const transport = nodemailer.createTransport({
    host: process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com',
    port: Number(process.env.ZOHO_SMTP_PORT || 465),
    secure: true,
    auth: { user, pass: process.env.ZOHO_SMTP_PASSWORD },
  });

  const from = process.env.ZOHO_FROM_ADDRESS || user;
  return transport.sendMail({ from: `"Built Smart by Rob" <${from}>`, to, subject, text, html });
}

module.exports = { sendEmail };
