const crypto = require('crypto');
const { getServiceClient } = require('./_supabase');

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const adminSecret = event.headers['x-admin-secret'];
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const clientName = String(payload.clientName || '').trim().slice(0, 200);
  if (!clientName) {
    return { statusCode: 400, body: JSON.stringify({ error: 'clientName is required' }) };
  }

  const rawToken = crypto.randomBytes(32).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + THIRTY_DAYS_MS).toISOString();

  const supabase = getServiceClient();
  const { error } = await supabase
    .from('invites')
    .insert({ client_name: clientName, token_hash: tokenHash, expires_at: expiresAt });

  if (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to create invite' }) };
  }

  const siteUrl = process.env.URL || '';
  const link = `${siteUrl}/leave-a-review.html?token=${rawToken}`;

  return {
    statusCode: 200,
    body: JSON.stringify({ link, clientName, expiresAt }),
  };
};
