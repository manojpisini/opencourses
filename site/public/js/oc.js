/* OpenCourses — Global JS */

// ── Theme ──────────────────────────────────────────────────────
(function () {
  const toggle = document.getElementById('theme-toggle');
  const icon = document.getElementById('theme-icon');

  function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    localStorage.setItem('oc-theme', t);
    if (icon) icon.textContent = t === 'dark' ? '☀' : '🌑';
  }

  // init (Base.astro already sets dataset.theme before paint; just sync icon)
  const current = document.documentElement.dataset.theme || 'dark';
  applyTheme(current);

  toggle?.addEventListener('click', () => {
    applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });
})();

// ── Build status bar ───────────────────────────────────────────
(function () {
  const bar = document.getElementById('build-status-bar');
  if (!bar) return;
  bar.dataset.status = 'running';
  setTimeout(() => { bar.dataset.status = 'success'; }, 3200);
})();

// ── Keyboard shortcut Ctrl/Cmd+K ──────────────────────────────
function openCmdPalette() {
  if (window._ocCmdOpen) { window._ocCmdOpen(); return; }
  const overlay = document.getElementById('cmdp-overlay');
  const input = document.getElementById('cmdp-input');
  if (!overlay) return;
  overlay.removeAttribute('hidden');
  setTimeout(() => input?.focus(), 50);
}

document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    openCmdPalette();
  }
});

document.getElementById('cmd-trigger')?.addEventListener('click', openCmdPalette);
document.getElementById('hero-search-btn')?.addEventListener('click', openCmdPalette);

// ── Mobile navigation menu ───────────────────────────────────
(function () {
  const navbar = document.querySelector('.navbar');
  const toggle = document.getElementById('nav-menu-toggle');
  const nav = document.getElementById('main-nav');
  if (!navbar || !toggle || !nav) return;

  function setOpen(open) {
    navbar.toggleAttribute('data-menu-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
  }

  toggle.addEventListener('click', () => {
    setOpen(!navbar.hasAttribute('data-menu-open'));
  });

  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });

  document.addEventListener('click', (event) => {
    if (!navbar.contains(event.target)) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setOpen(false);
  });

  window.matchMedia('(min-width: 761px)').addEventListener('change', (event) => {
    if (event.matches) setOpen(false);
  });
})();
