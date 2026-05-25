document.addEventListener('DOMContentLoaded', () => {

  const navLinks = document.querySelectorAll('.nav-links a');
  const pages = document.querySelectorAll('.page');
  const toggle = document.querySelector('.mobile-nav-toggle');
  const nav = document.querySelector('nav');

  function showPage(id) {
    pages.forEach(p => p.classList.remove('active'));
    navLinks.forEach(l => l.classList.remove('active'));
    const page = document.getElementById(id);
    const link = document.querySelector(`.nav-links a[data-page="${id}"]`);
    if (page) page.classList.add('active');
    if (link) link.classList.add('active');
    window.scrollTo(0, 0);
    if (nav.classList.contains('open')) nav.classList.remove('open');
    nav.classList.toggle('on-hero', id === 'home');
  }

  navLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      showPage(link.dataset.page);
    });
  });

  document.querySelectorAll('[data-goto]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      showPage(el.dataset.goto);
    });
  });

  toggle?.addEventListener('click', () => nav.classList.toggle('open'));

  showPage('home');

  // ── CONTACT FORM ──
  const HIRE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxKuJKkFiVm0gdULK3xgPUQ5aTea3n-BKt84MANLSdTfq-Pmu_AQPN0KDDHhU6S2p3zfA/exec';

  const hireForm   = document.getElementById('hire-form');
  const hireStatus = document.getElementById('hire-status');

  hireForm?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = hireForm.querySelector('button[type="submit"]');
    btn.textContent = 'Sending…';
    btn.disabled = true;
    try {
      await fetch(HIRE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(Object.fromEntries(new FormData(hireForm))),
      });
      hireStatus.textContent = "Sent — I'll be in touch soon.";
      hireStatus.className = 'form-status success';
      hireForm.reset();
    } catch {
      hireStatus.textContent = 'Something went wrong. Email info@haigbeylerian.com directly.';
      hireStatus.className = 'form-status error';
    }
    btn.textContent = 'Send Enquiry';
    btn.disabled = false;
  });

  // ── SCROLL REVEAL ──
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.portfolio-item, .tab-card').forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${Math.min(i % 4, 3) * 0.09}s`;
    revealObserver.observe(el);
  });

});
