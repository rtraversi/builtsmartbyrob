const crypto = require('crypto');
const { getServiceClient } = require('./_supabase');

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
  const displayName = payload.displayName ? String(payload.displayName).trim().slice(0, 100) : null;

  if (!token) {
    return { statusCode: 400, body: JSON.stringify({ error: 'token is required' }) };
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { statusCode: 400, body: JSON.stringify({ error: 'rating must be an integer 1-5' }) };
  }
  if (!body || body.length > 2000) {
    return { statusCode: 400, body: JSON.stringify({ error: 'body must be 1-2000 characters' }) };
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const supabase = getServiceClient();

  // Resolve the display name from the invite when the client didn't provide one,
  // since the RPC has no fallback of its own.
  let finalDisplayName = displayName;
  if (!finalDisplayName) {
    const { data: invite } = await supabase
      .from('invites')
      .select('client_name')
      .eq('token_hash', tokenHash)
      .maybeSingle();
    finalDisplayName = invite ? invite.client_name : 'Client';
  }

  const { data: reviewId, error } = await supabase.rpc('redeem_invite_and_insert_review', {
    p_token_hash: tokenHash,
    p_display_name: finalDisplayName,
    p_rating: rating,
    p_body: body,
  });

  if (error) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: 'Submission failed' }) };
  }

  if (!reviewId) {
    return { statusCode: 410, body: JSON.stringify({ success: false, reason: 'invalid_or_used' }) };
  }

  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};
