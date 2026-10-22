// Reviews live in the RMT CRM Supabase project. The site only uses the
// publishable key: it can call the site_* functions and read approved reviews,
// nothing else (see supabase/site_reviews.sql). js/reviews.js ships the same key.
const SUPABASE_URL = 'https://enowrzljapjkaxpsvdhr.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_SXXPzDWeL7a6OQJJLCyX4A_JEX3Wi6U';

async function rpc(name, args) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`${name} failed: HTTP ${res.status}`);
  return res.json();
}

module.exports = { rpc };
