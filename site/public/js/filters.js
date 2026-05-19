/**
 * Client-side course filtering for /courses
 * URL params: track, difficulty, status, duration, sort, q
 */

(function () {
  const courses = window.__COURSES__ || [];
  const grid = document.getElementById('course-grid');
  const countEl = document.getElementById('results-count');
  const emptyEl = document.getElementById('empty-state');
  const activeFiltersEl = document.getElementById('active-filters');

  if (!grid || !courses.length) return;

  // Read URL params on load
  const params = new URLSearchParams(window.location.search);
  const state = {
    q:          params.get('q') || '',
    difficulty: params.get('difficulty') || 'all',
    tracks:     params.getAll('track'),
    statuses:   params.getAll('status'),
    duration:   params.get('duration') || 'all',
    sort:       params.get('sort') || 'recent',
  };

  // Init UI from state
  const searchInput = document.getElementById('search-input');
  const sortSelect = document.getElementById('sort-select');

  if (searchInput && state.q) searchInput.value = state.q;
  if (sortSelect && state.sort) sortSelect.value = state.sort;

  document.querySelectorAll('[data-filter="track"]').forEach(el => {
    if (state.tracks.includes(el.value)) el.checked = true;
  });
  document.querySelectorAll('[data-filter="difficulty"]').forEach(el => {
    if (el.value === state.difficulty) el.checked = true;
  });
  document.querySelectorAll('[data-filter="status"]').forEach(el => {
    if (state.statuses.includes(el.value)) el.checked = true;
  });
  document.querySelectorAll('[data-filter="duration"]').forEach(el => {
    if (el.value === state.duration) el.checked = true;
  });

  function getDurationHours(durationStr) {
    const match = durationStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  function applyFilters() {
    const q = state.q.toLowerCase().trim();

    let filtered = courses.filter(course => {
      if (q && !course.title.toLowerCase().includes(q) &&
               !course.description.toLowerCase().includes(q) &&
               !course.tags.some(t => t.toLowerCase().includes(q))) return false;

      if (state.difficulty !== 'all' && course.difficulty !== state.difficulty) return false;

      if (state.tracks.length > 0 && !state.tracks.includes(course.track)) return false;

      if (state.statuses.length > 0 && !state.statuses.includes(course.status)) return false;

      if (state.duration !== 'all') {
        const h = getDurationHours(course.duration);
        if (state.duration === 'short' && h >= 4) return false;
        if (state.duration === 'medium' && (h < 4 || h > 8)) return false;
        if (state.duration === 'long' && h <= 8) return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      if (state.sort === 'stars')      return b.stars - a.stars;
      if (state.sort === 'title')      return a.title.localeCompare(b.title);
      if (state.sort === 'difficulty') {
        const order = { beginner: 0, intermediate: 1, advanced: 2 };
        return (order[a.difficulty] ?? 0) - (order[b.difficulty] ?? 0);
      }
      // recent
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

    // Re-render grid
    grid.innerHTML = filtered.map((course, i) => `
      <a
        href="/courses/${course.slug}"
        class="course-card"
        data-level="${course.difficulty}"
        style="--index: ${i}"
        aria-label="${course.title} — ${course.difficulty} course"
      >
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:0.75rem">
          <div style="display:flex;align-items:center;gap:0.5rem;min-width:0">
            <span class="git-status" data-status="${course.status}">${{ added:'+', modified:'~', attention:'!', stable:'·' }[course.status]}</span>
            <h3 style="font-family:var(--font-display,'Geist',sans-serif);font-weight:600;color:var(--text-primary);font-size:1.125rem;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${course.title}</h3>
          </div>
          <span class="difficulty-badge" data-level="${course.difficulty}">[${course.difficulty.toUpperCase()}]</span>
        </div>
        <p style="font-size:0.875rem;color:var(--text-secondary);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${course.description}</p>
        <div style="border-top:1px solid var(--border-subtle);padding-top:0.75rem;display:flex;align-items:center;justify-content:space-between;gap:0.5rem">
          <div style="display:flex;gap:0.75rem;font-size:0.75rem;font-family:monospace;color:var(--text-muted);flex-wrap:wrap">
            <span>📦 ${course.modules} modules</span>
            <span>⏱ ${course.duration}</span>
          </div>
          <span style="font-size:0.75rem;font-family:monospace;color:var(--text-muted)">★ ${course.stars}</span>
        </div>
      </a>
    `).join('');

    // Count
    if (countEl) countEl.textContent = `${filtered.length} course${filtered.length !== 1 ? 's' : ''}`;

    // Empty state
    if (emptyEl) emptyEl.classList.toggle('hidden', filtered.length > 0);
    if (grid)    grid.style.display = filtered.length > 0 ? '' : 'none';

    // Active filter chips
    renderActiveFilters();

    // Update URL
    const newParams = new URLSearchParams();
    if (state.q)              newParams.set('q', state.q);
    if (state.difficulty !== 'all') newParams.set('difficulty', state.difficulty);
    state.tracks.forEach(t => newParams.append('track', t));
    state.statuses.forEach(s => newParams.append('status', s));
    if (state.duration !== 'all') newParams.set('duration', state.duration);
    if (state.sort !== 'recent')  newParams.set('sort', state.sort);
    const search = newParams.toString();
    history.replaceState(null, '', search ? `?${search}` : window.location.pathname);
  }

  function renderActiveFilters() {
    if (!activeFiltersEl) return;
    const chips = [];
    if (state.q) chips.push({ label: `"${state.q}"`, clear: () => { state.q = ''; if (searchInput) searchInput.value = ''; } });
    if (state.difficulty !== 'all') chips.push({ label: state.difficulty, clear: () => { state.difficulty = 'all'; document.querySelector('[data-filter="difficulty"][value="all"]').checked = true; } });
    state.tracks.forEach(t => chips.push({ label: `track: ${t}`, clear: () => { state.tracks = state.tracks.filter(x => x !== t); document.querySelector(`[data-filter="track"][value="${t}"]`).checked = false; } }));

    activeFiltersEl.innerHTML = chips.map((chip, i) => `
      <button
        class="flex items-center gap-1 text-xs font-mono bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] px-2 py-1 rounded border border-[var(--accent-blue)]33 cursor-pointer hover:bg-[var(--bg-raised)] transition-colors"
        data-chip-idx="${i}"
      >
        ${chip.label} ✕
      </button>
    `).join('');

    activeFiltersEl.querySelectorAll('button').forEach((btn, i) => {
      btn.addEventListener('click', () => {
        chips[i].clear();
        applyFilters();
      });
    });
  }

  // Event listeners
  searchInput?.addEventListener('input', (e) => {
    state.q = e.target.value;
    applyFilters();
  });

  sortSelect?.addEventListener('change', (e) => {
    state.sort = e.target.value;
    applyFilters();
  });

  document.querySelectorAll('[data-filter="difficulty"]').forEach(el => {
    el.addEventListener('change', () => {
      state.difficulty = el.value;
      applyFilters();
    });
  });

  document.querySelectorAll('[data-filter="track"]').forEach(el => {
    el.addEventListener('change', () => {
      if (el.checked) {
        if (!state.tracks.includes(el.value)) state.tracks.push(el.value);
      } else {
        state.tracks = state.tracks.filter(t => t !== el.value);
      }
      applyFilters();
    });
  });

  document.querySelectorAll('[data-filter="status"]').forEach(el => {
    el.addEventListener('change', () => {
      if (el.checked) {
        if (!state.statuses.includes(el.value)) state.statuses.push(el.value);
      } else {
        state.statuses = state.statuses.filter(s => s !== el.value);
      }
      applyFilters();
    });
  });

  document.querySelectorAll('[data-filter="duration"]').forEach(el => {
    el.addEventListener('change', () => {
      state.duration = el.value;
      applyFilters();
    });
  });

  document.getElementById('clear-filters')?.addEventListener('click', () => {
    state.q = ''; state.difficulty = 'all'; state.tracks = [];
    state.statuses = []; state.duration = 'all'; state.sort = 'recent';
    if (searchInput) searchInput.value = '';
    if (sortSelect) sortSelect.value = 'recent';
    document.querySelectorAll('[data-filter]').forEach(el => {
      if (el.type === 'radio') el.checked = (el.value === 'all' || el.name === 'difficulty' && el.value === 'all');
      if (el.type === 'checkbox') el.checked = false;
    });
    applyFilters();
  });

  // Initial render
  applyFilters();
})();
