const crypto = require('crypto');
const { rpc } = require('./_supabase');
const { sendEmail } = require('./_email');
const { moderationLink } = require('./_moderation');

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

// Email Rob the new review with signed Approve/Reject buttons.
async function notifyNewReview(reviewId, review) {
  const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
  const person = [review.displayName, review.reviewerTitle].filter(Boolean).join(', ');
  const approve = moderationLink(reviewId, 'approve');
  const reject = moderationLink(reviewId, 'reject');
  const button = (href, label, color) =>
    `<a href="${esc(href)}" style="display:inline-block;padding:12px 28px;margin-right:10px;border-radius:8px;` +
    `background:${color};color:#ffffff;font-weight:600;text-decoration:none;font-family:Arial,sans-serif;">${label}</a>`;

  await sendEmail({
    to: process.env.REVIEW_NOTIFY_TO || process.env.ZOHO_SMTP_USER,
    subject: `New review from ${review.firmName} ${stars}`,
    text: [
      `New review (pending approval)`,
      ``,
      `${stars}`,
      `Firm: ${review.firmName}`,
      person ? `From: ${person}` : null,
      ``,
      review.body,
      ``,
      `Approve: ${approve}`,
      `Reject:  ${reject}`,
    ].filter((l) => l !== null).join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;color:#1f2937;">
        <p style="margin:0 0 4px;color:#6b7280;font-size:13px;">New review, pending approval</p>
        <p style="margin:0 0 12px;font-size:22px;color:#f59e0b;letter-spacing:2px;">${stars}</p>
        <p style="margin:0;font-size:17px;font-weight:700;">${esc(review.firmName)}</p>
        ${person ? `<p style="margin:2px 0 0;color:#4b5563;">${esc(person)}</p>` : ''}
        <blockquote style="margin:16px 0 24px;padding:12px 16px;border-left:4px solid #1565c0;background:#f3f6fb;white-space:pre-wrap;">${esc(review.body)}</blockquote>
        ${button(approve, 'Approve', '#1565c0')}${button(reject, 'Reject', '#b91c1c')}
        <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;">Each button asks you to confirm before anything changes.</p>
      </div>`,
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const token = String(payload.token || '');
  const rating = Number(payload.rating);
  const body = String(payload.body || '').trim();
  const firmName = String(payload.firmName || '').trim();
  const displayName = String(payload.displayName || '').trim().slice(0, 100) || null;
  const reviewerTitle = String(payload.reviewerTitle || '').trim().slice(0, 100) || null;

  if (!token) {
    return { statusCode: 400, body: JSON.stringify({ error: 'token is required' }) };
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { statusCode: 400, body: JSON.stringify({ error: 'rating must be an integer 1-5' }) };
  }
  if (!body || body.length > 2000) {
    return { statusCode: 400, body: JSON.stringify({ error: 'body must be 1-2000 characters' }) };
  }
  if (!firmName || firmName.length > 150) {
    return { statusCode: 400, body: JSON.stringify({ error: 'firmName must be 1-150 characters' }) };
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  let reviewId;
  try {
    reviewId = await rpc('site_redeem_invite', {
      p_token_hash: tokenHash,
      p_firm_name: firmName,
      p_display_name: displayName,
      p_reviewer_title: reviewerTitle,
      p_rating: rating,
      p_body: body,
    });
  } catch {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: 'Submission failed' }) };
  }

  if (!reviewId) {
    return { statusCode: 410, body: JSON.stringify({ success: false, reason: 'invalid_or_used' }) };
  }

  // The review is already saved; a failed email shouldn't fail the client's submission.
  try {
    await notifyNewReview(reviewId, { firmName, displayName, reviewerTitle, rating, body });
  } catch (err) {
    console.error('Review notification email failed:', err.message);
  }

  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};
