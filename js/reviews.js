(function () {
  const SUPABASE_URL = 'https://smmloaqrdefdavyxnegl.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_4FCGcXZckdV8xz0sSZH2Iw_GsfaOlJ6';

  const statusEl = document.getElementById('reviews-status');
  const gridEl = document.getElementById('reviews-grid');
  if (!statusEl || !gridEl) return;

  function buildStars(rating) {
    const wrap = document.createElement('div');
    wrap.className = 'stars';
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement('span');
      star.className = 'star' + (i <= rating ? ' filled' : '');
      star.textContent = '★';
      wrap.appendChild(star);
    }
    return wrap;
  }

  function buildCard(review) {
    const card = document.createElement('div');
    card.className = 'review-card';

    card.appendChild(buildStars(Number(review.rating) || 0));

    const body = document.createElement('p');
    body.className = 'review-body';
    body.textContent = review.body;
    card.appendChild(body);

    const name = document.createElement('div');
    name.className = 'review-name';
    name.textContent = review.display_name;
    card.appendChild(name);

    const date = document.createElement('div');
    date.className = 'review-date';
    date.textContent = new Date(review.created_at).toLocaleDateString(undefined, {
      year: 'numeric', month: 'long',
    });
    card.appendChild(date);

    return card;
  }

  fetch(
    `${SUPABASE_URL}/rest/v1/reviews?select=display_name,rating,body,created_at&status=eq.approved&order=created_at.desc&limit=50`,
    {
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      },
    }
  )
    .then((res) => {
      if (!res.ok) throw new Error('Request failed');
      return res.json();
    })
    .then((reviews) => {
      if (!Array.isArray(reviews) || reviews.length === 0) {
        statusEl.textContent = 'No reviews yet — check back soon.';
        return;
      }
      reviews.forEach((review) => gridEl.appendChild(buildCard(review)));
      statusEl.hidden = true;
      gridEl.hidden = false;
    })
    .catch(() => {
      statusEl.textContent = 'Reviews are temporarily unavailable. Please check back later.';
    });
})();
