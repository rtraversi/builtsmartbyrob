// Signed approve/reject links for the new-review email.
// REVIEW_MODERATION_SECRET signs each link (review id + action) and is also what
// site_moderate_review checks in the database, so a link can't be forged or
// repointed at another review.
const crypto = require('crypto');

const ACTIONS = { approve: 'approved', reject: 'rejected' };

function sign(reviewId, action) {
  return crypto
    .createHmac('sha256', process.env.REVIEW_MODERATION_SECRET)
    .update(`${reviewId}:${action}`)
    .digest('base64url');
}

function verify(reviewId, action, sig) {
  if (!process.env.REVIEW_MODERATION_SECRET || !ACTIONS[action] || !reviewId || !sig) return false;
  const expected = Buffer.from(sign(reviewId, action));
  const given = Buffer.from(String(sig));
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

function moderationLink(reviewId, action) {
  const params = new URLSearchParams({ id: reviewId, action, sig: sign(reviewId, action) });
  return `${process.env.URL || ''}/.netlify/functions/moderate-review?${params}`;
}

module.exports = { ACTIONS, verify, moderationLink };
