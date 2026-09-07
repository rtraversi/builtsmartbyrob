(function () {
  const token = new URLSearchParams(window.location.search).get('token');

  const loadingEl = document.getElementById('lar-loading');
  const invalidEl = document.getElementById('lar-invalid');
  const formWrapEl = document.getElementById('lar-form-wrap');
  const successEl = document.getElementById('lar-success');
  const greetingEl = document.getElementById('lar-greeting');
  const form = document.getElementById('review-form');
  const statusEl = document.getElementById('lar-status');
  const submitBtn = document.getElementById('lar-submit');
  const ratingInput = document.getElementById('rating');
  const starButtons = document.querySelectorAll('#star-picker button');

  function showOnly(el) {
    [loadingEl, invalidEl, formWrapEl, successEl].forEach((e) => {
      e.hidden = e !== el;
    });
  }

  function showStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = 'form-status ' + type;
  }

  if (!token) {
    showOnly(invalidEl);
    return;
  }

  starButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const value = Number(btn.dataset.value);
      ratingInput.value = String(value);
      starButtons.forEach((b) => {
        b.classList.toggle('filled', Number(b.dataset.value) <= value);
      });
    });
  });

  fetch(`/.netlify/functions/validate-invite?token=${encodeURIComponent(token)}`)
    .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
    .then(({ ok, data }) => {
      if (!ok || !data.valid) {
        showOnly(invalidEl);
        return;
      }
      greetingEl.textContent = `Hi ${data.clientName}, how was your experience?`;
      document.getElementById('displayName').value = data.clientName;
      showOnly(formWrapEl);
    })
    .catch(() => showOnly(invalidEl));

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const rating = Number(ratingInput.value);
    const displayName = document.getElementById('displayName').value.trim();
    const body = document.getElementById('body').value.trim();

    if (!rating) {
      showStatus('Please select a star rating.', 'error');
      return;
    }
    if (!body) {
      showStatus('Please write a short review.', 'error');
      return;
    }

    submitBtn.disabled = true;
    showStatus('Submitting…', '');

    fetch('/.netlify/functions/submit-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, rating, displayName, body }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok || !data.success) {
          if (data && data.reason === 'invalid_or_used') {
            showOnly(invalidEl);
            return;
          }
          showStatus('Something went wrong. Please try again.', 'error');
          submitBtn.disabled = false;
          return;
        }
        showOnly(successEl);
      })
      .catch(() => {
        showStatus('Something went wrong. Please try again.', 'error');
        submitBtn.disabled = false;
      });
  });
})();
