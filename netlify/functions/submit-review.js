const crypto = require('crypto');
const { rpc } = require('./_supabase');

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

  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};
