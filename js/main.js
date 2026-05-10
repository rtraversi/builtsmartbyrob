/* ============================================================
   Built Smart by Rob — Main JS
   ============================================================ */

// --- Copyright year ----------------------------------------
document.getElementById('year').textContent = new Date().getFullYear();

// --- Navbar scroll state -----------------------------------
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// --- Mobile menu -------------------------------------------
const hamburger    = document.getElementById('hamburger');
const mobileMenu   = document.getElementById('mobile-menu');

hamburger.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  hamburger.classList.toggle('open', open);
  hamburger.setAttribute('aria-expanded', open);
});

function closeMobileMenu() {
  mobileMenu.classList.remove('open');
  hamburger.classList.remove('open');
  hamburger.setAttribute('aria-expanded', false);
}

// Close menu on outside click
document.addEventListener('click', (e) => {
  if (!navbar.contains(e.target)) closeMobileMenu();
});

// --- Scroll-reveal -----------------------------------------
const revealEls = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // Stagger cards that appear at the same time
      const delay = entry.target.closest('.services-grid, .portfolio-grid, .tool-stack')
        ? Array.from(entry.target.parentElement.children).indexOf(entry.target) * 100
        : 0;
      setTimeout(() => entry.target.classList.add('visible'), delay);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealEls.forEach(el => observer.observe(el));

// --- Portfolio thumb icon centering ------------------------
document.querySelectorAll('.portfolio-thumb').forEach(thumb => {
  const icon = thumb.querySelector('.portfolio-thumb-icon');
  if (icon) {
    icon.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);';
  }
});

// --- Active nav link on scroll -----------------------------
const sections  = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navAnchors.forEach(a => {
        a.style.color = a.getAttribute('href') === '#' + entry.target.id
          ? 'var(--white)' : '';
      });
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(s => sectionObserver.observe(s));

// --- Contact form ------------------------------------------
const contactForm = document.getElementById('contact-form');
const formStatus  = document.getElementById('form-status');

contactForm.addEventListener('submit', function(e) {
  e.preventDefault();

  const btn = contactForm.querySelector('button[type="submit"]');
  const orig = btn.innerHTML;

  // Basic client-side validation
  const fname = contactForm.querySelector('#fname');
  const lname = contactForm.querySelector('#lname');
  const email = contactForm.querySelector('#email');

  if (!fname.value.trim() || !lname.value.trim() || !email.value.trim()) {
    showStatus('Please fill in your name and email address.', 'error');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    showStatus('Please enter a valid email address.', 'error');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = 'Sending…';

  fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(new FormData(contactForm)).toString()
  })
  .then(() => {
    window.location.href = '/thank-you.html';
  })
  .catch(() => {
    showStatus('Something went wrong. Please try again or email me directly.', 'error');
    btn.disabled = false;
    btn.innerHTML = orig;
  });
});

function showStatus(msg, type) {
  formStatus.textContent = msg;
  formStatus.className = 'form-status ' + type;
  setTimeout(() => { formStatus.className = 'form-status'; }, 6000);
}

// --- Tabs (scoped per section so portfolio & service tabs don't clash) ---
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const section = btn.closest('section');
    const target = btn.dataset.tab;
    section.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    section.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + target).classList.add('active');
    document.querySelectorAll('#tab-' + target + ' .reveal:not(.visible)').forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), i * 80);
    });
  });
});

// --- Smooth anchor scroll (for older browsers) -------------
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = 80; // navbar height
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});
