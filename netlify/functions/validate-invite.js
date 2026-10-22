const crypto = require('crypto');
const { rpc } = require('./_supabase');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const token = (event.queryStringParameters || {}).token;
  if (!token) {
    return { statusCode: 400, body: JSON.stringify({ error: 'token is required' }) };
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  let valid;
  try {
    valid = await rpc('site_validate_invite', { p_token_hash: tokenHash });
  } catch {
    return { statusCode: 500, body: JSON.stringify({ valid: false, reason: 'error' }) };
  }

  if (!valid) {
    return { statusCode: 410, body: JSON.stringify({ valid: false, reason: 'invalid_used_or_expired' }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ valid: true }),
  };
};
