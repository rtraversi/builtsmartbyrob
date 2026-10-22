(function () {
  const SUPABASE_URL = 'https://enowrzljapjkaxpsvdhr.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_SXXPzDWeL7a6OQJJLCyX4A_JEX3Wi6U';

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

    // Older reviews have only display_name; newer ones may have only a firm.
    const person = [review.display_name, review.reviewer_title].filter(Boolean).join(', ');
    if (person) {
      const name = document.createElement('div');
      name.className = 'review-name';
      name.textContent = person;
      card.appendChild(name);
    }

    if (review.firm_name) {
      const firm = document.createElement('div');
      firm.className = 'review-firm';
      firm.textContent = review.firm_name;
      card.appendChild(firm);
    }

    const date = document.createElement('div');
    date.className = 'review-date';
    date.textContent = new Date(review.created_at).toLocaleDateString(undefined, {
      year: 'numeric', month: 'long',
    });
    card.appendChild(date);

    return card;
  }

  fetch(
    `${SUPABASE_URL}/rest/v1/site_reviews?select=display_name,firm_name,reviewer_title,rating,body,created_at&status=eq.approved&order=created_at.desc&limit=50`,
    {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
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
