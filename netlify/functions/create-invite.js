const crypto = require('crypto');
const { rpc } = require('./_supabase');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Checked by site_create_invite against the hash stored in the database.
  const adminSecret = event.headers['x-admin-secret'];
  if (!adminSecret) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  // Private admin note for tracking who the link went to; never shown to the client.
  const note = String(payload.note || '').trim().slice(0, 200) || null;

  const rawToken = crypto.randomBytes(32).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  let expiresAt;
  try {
    expiresAt = await rpc('site_create_invite', {
      p_admin_secret: adminSecret,
      p_token_hash: tokenHash,
      p_note: note,
    });
  } catch {
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to create invite' }) };
  }

  if (!expiresAt) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const siteUrl = process.env.URL || '';
  const link = `${siteUrl}/leave-a-review.html?token=${rawToken}`;

  return {
    statusCode: 200,
    body: JSON.stringify({ link, note, expiresAt }),
  };
};
