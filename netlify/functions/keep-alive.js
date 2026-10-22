const { getServiceClient } = require('./_supabase');

// Runs on a schedule (see netlify.toml) so the free-tier Supabase project
// sees activity and isn't paused after 7 idle days.
exports.handler = async () => {
  const supabase = getServiceClient();
  const { error } = await supabase.from('reviews').select('*', { head: true }).limit(1);

  if (error) {
    console.error('keep-alive query failed:', error.message);
    return { statusCode: 500 };
  }

  console.log('keep-alive ok');
  return { statusCode: 200 };
};
