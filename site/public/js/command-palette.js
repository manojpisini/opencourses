class CommandPalette {
  constructor() {
    this.isOpen = false;
    this.index = null;
    this.filtered = { courses: [], tracks: [], contributors: [] };
    this.selectedIdx = 0;
    this.flatList = [];
    this.root = document.getElementById('command-palette-root');
    this.init();
  }

  async loadIndex() {
    if (this.index) return;
    try {
      const res = await fetch('/search-index.json');
      this.index = await res.json();
    } catch {
      this.index = { courses: [], tracks: [], contributors: [] };
    }
  }

  open() {
    this.isOpen = true;
    this.render();
    requestAnimationFrame(() => {
      this.root?.querySelector('.command-palette__input')?.focus();
    });
    this.loadIndex().then(() => this.filter(''));
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.isOpen = false;
    if (this.root) this.root.innerHTML = '';
    this.root?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  filter(query) {
    if (!this.index) return;
    const q = query.toLowerCase().trim();

    const match = (item) => {
      if (!q) return true;
      return (item.title || item.login || '').toLowerCase().includes(q) ||
             (item.description || item.bio || '').toLowerCase().includes(q) ||
             (item.tags || item.tracks || []).some(t => t.toLowerCase().includes(q));
    };

    this.filtered = {
      courses:      (this.index.courses || []).filter(match).slice(0, 5),
      tracks:       (this.index.tracks || []).filter(match).slice(0, 3),
      contributors: (this.index.contributors || []).filter(match).slice(0, 3),
    };

    this.flatList = [
      ...this.filtered.courses.map(c => ({ type: 'course', item: c, href: `/courses/${c.slug}` })),
      ...this.filtered.tracks.map(t => ({ type: 'track', item: t, href: `/courses?track=${t.name}` })),
      ...this.filtered.contributors.map(c => ({ type: 'contributor', item: c, href: `/contributors/${c.login}` })),
    ];

    this.selectedIdx = 0;
    this.renderResults();
  }

  navigate(direction) {
    const n = this.flatList.length;
    if (!n) return;
    this.selectedIdx = (this.selectedIdx + direction + n) % n;
    this.renderResults();
  }

  activateSelected() {
    const entry = this.flatList[this.selectedIdx];
    if (entry) window.location.href = entry.href;
  }

  render() {
    if (!this.root) return;
    this.root.setAttribute('aria-hidden', 'false');
    this.root.innerHTML = `
      <div class="command-palette-overlay" id="cp-overlay" role="dialog" aria-modal="true" aria-label="Search">
        <div class="command-palette">
          <input
            type="search"
            class="command-palette__input"
            placeholder="Search courses, tracks, contributors…"
            aria-label="Search"
            autocomplete="off"
            spellcheck="false"
          />
          <div class="command-palette__results" id="cp-results" role="listbox">
            <div class="command-palette__section-header">Loading…</div>
          </div>
          <div class="command-palette__footer">
            <span>↑↓ navigate</span>
            <span>↵ open</span>
            <span>Esc dismiss</span>
          </div>
        </div>
      </div>
    `;

    const input = this.root.querySelector('.command-palette__input');
    const overlay = this.root.querySelector('#cp-overlay');

    input?.addEventListener('input', (e) => this.filter(e.target.value));
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });
  }

  renderResults() {
    const container = this.root?.querySelector('#cp-results');
    if (!container) return;

    if (!this.flatList.length) {
      container.innerHTML = `<div class="command-palette__section-header">No results</div>`;
      return;
    }

    let html = '';
    let flatIdx = 0;

    const sections = [
      { key: 'courses', label: 'Courses', items: this.filtered.courses },
      { key: 'tracks', label: 'Tracks', items: this.filtered.tracks },
      { key: 'contributors', label: 'Contributors', items: this.filtered.contributors },
    ];

    for (const section of sections) {
      if (!section.items.length) continue;
      html += `<div class="command-palette__section-header">${section.label}</div>`;
      for (const item of section.items) {
        const isSelected = flatIdx === this.selectedIdx;
        const href = section.key === 'course' ? `/courses/${item.slug}`
          : section.key === 'track' ? `/courses?track=${item.name}`
          : `/contributors/${item.login}`;
        const label = item.title || item.name || `@${item.login}`;
        const meta = item.difficulty
          ? `[${item.difficulty.toUpperCase()}]`
          : item.courses ? `${item.courses} courses`
          : item.count ? `${item.count} courses`
          : '';
        html += `
          <a
            href="${section.key === 'courses' ? `/courses/${item.slug}` : section.key === 'tracks' ? `/courses?track=${item.name}` : `/contributors/${item.login}`}"
            class="command-palette__item"
            role="option"
            aria-selected="${isSelected}"
            data-idx="${flatIdx}"
          >
            <span style="flex:1; font-size:0.875rem; color:var(--text-primary)">${label}</span>
            ${meta ? `<span style="font-size:0.75rem; font-family:monospace; color:var(--text-muted)">${meta}</span>` : ''}
          </a>
        `;
        flatIdx++;
      }
    }

    container.innerHTML = html;

    // Scroll selected into view
    const selected = container.querySelector('[aria-selected="true"]');
    selected?.scrollIntoView({ block: 'nearest' });
  }
}

// Initialize
const palette = new CommandPalette();
window.commandPalette = palette;

// Keyboard shortcut
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    palette.isOpen ? palette.close() : palette.open();
  }
  if (!palette.isOpen) return;
  if (e.key === 'Escape') palette.close();
  if (e.key === 'ArrowDown') { e.preventDefault(); palette.navigate(1); }
  if (e.key === 'ArrowUp') { e.preventDefault(); palette.navigate(-1); }
  if (e.key === 'Enter') { e.preventDefault(); palette.activateSelected(); }
});

// Trigger button
document.getElementById('command-palette-trigger')?.addEventListener('click', () => {
  palette.isOpen ? palette.close() : palette.open();
});
