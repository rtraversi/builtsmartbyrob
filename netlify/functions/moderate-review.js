const { rpc } = require('./_supabase');
const { ACTIONS, verify } = require('./_moderation');

// GET (the email button) only shows a confirm page: mail scanners open links
// automatically, so nothing changes until the button on that page POSTs back.

function page(title, inner, status = 200) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
    body: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow" />
  <title>${title} | Built Smart by Rob</title>
  <style>
    body { margin: 0; min-height: 100vh; background: #070e1c; color: #edf4ff; font-family: system-ui, sans-serif;
           display: flex; align-items: center; justify-content: center; padding: 40px 20px; box-sizing: border-box; }
    .box { width: 100%; max-width: 440px; background: #0e1f34; border: 1px solid #163050; border-radius: 16px; padding: 32px; text-align: center; }
    h1 { font-size: 1.3rem; margin: 0 0 12px; color: #f0f8ff; }
    p { color: #5a8fb0; line-height: 1.6; margin: 0 0 20px; }
    button { width: 100%; border: none; border-radius: 8px; padding: 12px; font-size: .95rem; font-weight: 600; cursor: pointer; color: #fff; }
    .approve { background: #1565c0; } .reject { background: #b91c1c; }
    a { color: #06c4d0; }
  </style>
</head>
<body><div class="box">${inner}</div></body>
</html>`,
  };
}

function parseForm(event) {
  const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : (event.body || '');
  return Object.fromEntries(new URLSearchParams(raw));
}

exports.handler = async (event) => {
  const params = event.httpMethod === 'POST' ? parseForm(event) : (event.queryStringParameters || {});
  const { id, action, sig } = params;

  if (!verify(id, action, sig)) {
    return page('Invalid link', '<h1>Invalid link</h1><p>This approval link is invalid. Use the buttons in the original email.</p>', 400);
  }

  const verb = action === 'approve' ? 'Approve' : 'Reject';

  if (event.httpMethod === 'GET') {
    const note = action === 'approve'
      ? 'It will appear on your reviews page right away.'
      : 'It will stay hidden from your reviews page.';
    return page(`${verb} review`, `
      <h1>${verb} this review?</h1>
      <p>${note}</p>
      <form method="POST">
        <input type="hidden" name="id" value="${encodeURIComponent(id)}" />
        <input type="hidden" name="action" value="${action}" />
        <input type="hidden" name="sig" value="${encodeURIComponent(sig)}" />
        <button type="submit" class="${action}">${verb}</button>
      </form>`);
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let status;
  try {
    status = await rpc('site_moderate_review', {
      p_moderation_secret: process.env.REVIEW_MODERATION_SECRET,
      p_review_id: id,
      p_status: ACTIONS[action],
    });
  } catch {
    return page('Error', '<h1>Something went wrong</h1><p>The review was not changed. Please try again.</p>', 500);
  }

  if (!status) {
    return page('Not found', '<h1>Review not found</h1><p>It may have been deleted.</p>', 404);
  }

  return status === 'approved'
    ? page('Approved', '<h1>Approved ✓</h1><p>The review is now live.</p><p><a href="/reviews.html">View your reviews page</a></p>')
    : page('Rejected', '<h1>Rejected</h1><p>The review will stay hidden. You can still approve it later from the original email.</p>');
};
