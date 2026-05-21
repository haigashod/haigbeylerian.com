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
});
