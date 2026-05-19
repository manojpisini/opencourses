/* OpenCourses — Command Palette */
(function () {
  const overlay = document.getElementById('cmdp-overlay');
  const palette = document.getElementById('cmdp');
  const input   = document.getElementById('cmdp-input');
  const results = document.getElementById('cmdp-results');
  const countEl = document.getElementById('cmdp-count');

  if (!overlay) return;

  const COURSES      = window.OC_COURSES      || [];
  const TRACKS       = window.OC_TRACKS       || [];
  const CONTRIBUTORS = window.OC_CONTRIBUTORS || [];
  const BASE         = window.OC_BASE         || '';

  let selected = 0;
  let flatItems = [];

  function fuzzyScore(text, needle) {
    text = text.toLowerCase(); needle = needle.toLowerCase();
    if (!needle) return 1;
    if (text.includes(needle)) return 100 - text.indexOf(needle);
    let hi = 0, ni = 0, score = 0;
    while (hi < text.length && ni < needle.length) {
      if (text[hi] === needle[ni]) { score += hi === ni ? 2 : 1; ni++; }
      hi++;
    }
    return ni === needle.length ? score : 0;
  }

  function scored(items, getText, max) {
    const needle = input?.value.trim() || '';
    return items
      .map(it => ({ it, score: fuzzyScore(getText(it), needle) }))
      .filter(x => x.score > 0 || !needle)
      .sort((a, b) => b.score - a.score)
      .slice(0, max)
      .map(x => x.it);
  }

  function navigate(url) {
    close();
    window.location.href = url;
  }

  function close() {
    overlay.setAttribute('hidden', '');
    if (input) input.value = '';
  }

  function difficultyBadge(level) {
    return `<span class="difficulty-badge" data-level="${level}">[${level.toUpperCase()}]</span>`;
  }

  function renderResults() {
    const courses      = scored(COURSES,      c => `${c.title} ${(c.tags||[]).join(' ')} ${c.description}`, 6);
    const tracks       = scored(TRACKS,       t => `${t.name} ${t.description}`, 3);
    const contributors = scored(CONTRIBUTORS, c => `${c.login} ${c.name}`, 4);

    flatItems = [];
    courses.forEach(c => flatItems.push({ kind: 'course', item: c, url: `${BASE}/courses/${c.slug}` }));
    tracks.forEach(t => flatItems.push({ kind: 'track', item: t, url: `${BASE}/tracks#${t.slug}` }));
    contributors.forEach(c => flatItems.push({ kind: 'contributor', item: c, url: `${BASE}/contributors/${c.login}` }));

    if (countEl) countEl.textContent = `${flatItems.length} result${flatItems.length !== 1 ? 's' : ''}`;

    if (flatItems.length === 0) {
      results.innerHTML = `<div class="cmdp__empty">No matches for "${input?.value}". Try a different query.</div>`;
      return;
    }

    let html = '';
    let fi = -1;

    if (courses.length) {
      html += `<div class="cmdp__section-head">Courses</div>`;
      courses.forEach(c => {
        fi++;
        html += `<div class="cmdp__item" data-fi="${fi}" ${fi === selected ? 'aria-selected="true"' : ''}>
          <span class="cmdp__item__icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></span>
          <span class="cmdp__item__title">${c.title}</span>
          ${difficultyBadge(c.difficulty)}
        </div>`;
      });
    }
    if (tracks.length) {
      html += `<div class="cmdp__section-head">Tracks</div>`;
      tracks.forEach(t => {
        fi++;
        const count = COURSES.filter(c => c.track === t.slug).length;
        html += `<div class="cmdp__item" data-fi="${fi}" ${fi === selected ? 'aria-selected="true"' : ''}>
          <span class="cmdp__item__icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg></span>
          <span class="cmdp__item__title">${t.name} Track</span>
          <span class="cmdp__item__meta">${count} courses</span>
        </div>`;
      });
    }
    if (contributors.length) {
      html += `<div class="cmdp__section-head">Contributors</div>`;
      contributors.forEach(c => {
        fi++;
        html += `<div class="cmdp__item" data-fi="${fi}" ${fi === selected ? 'aria-selected="true"' : ''}>
          <span class="cmdp__item__icon" style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted)">@</span>
          <span class="cmdp__item__title">@${c.login} <span style="color:var(--text-muted)">· ${c.name}</span></span>
          <span class="cmdp__item__meta">${c.courses} courses</span>
        </div>`;
      });
    }

    results.innerHTML = html;
    results.querySelectorAll('[data-fi]').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.fi);
        navigate(flatItems[idx].url);
      });
    });
  }

  // Events
  overlay?.addEventListener('click', e => { if (e.target === overlay) close(); });
  input?.addEventListener('input', () => { selected = 0; renderResults(); });

  palette?.addEventListener('keydown', e => {
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); selected = Math.min(selected + 1, flatItems.length - 1); renderResults(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); selected = Math.max(selected - 1, 0); renderResults(); }
    if (e.key === 'Enter') { e.preventDefault(); const f = flatItems[selected]; if (f) navigate(f.url); }
  });

  // Exposed so global oc.js can call openCmdPalette()
  window._ocCmdOpen = function () {
    overlay.removeAttribute('hidden');
    selected = 0;
    if (input) input.value = '';
    renderResults();
    setTimeout(() => input?.focus(), 50);
  };
})();
