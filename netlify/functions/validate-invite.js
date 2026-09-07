const crypto = require('crypto');
const { getServiceClient } = require('./_supabase');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const token = (event.queryStringParameters || {}).token;
  if (!token) {
    return { statusCode: 400, body: JSON.stringify({ error: 'token is required' }) };
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('invites')
    .select('client_name, used_at, expires_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (error || !data) {
    return { statusCode: 404, body: JSON.stringify({ valid: false, reason: 'not_found' }) };
  }

  if (data.used_at || new Date(data.expires_at) <= new Date()) {
    return { statusCode: 410, body: JSON.stringify({ valid: false, reason: 'used_or_expired' }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ valid: true, clientName: data.client_name }),
  };
};
