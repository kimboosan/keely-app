  const wikiPane = document.getElementById('wiki-pane');
  const navPanel = document.getElementById('nav-panel');
  const navToggle = document.getElementById('nav-toggle');
  const sceneInfo = document.getElementById('scene-info');
  const entityContent = document.getElementById('entity-content');
  const backBtn = document.getElementById('back-btn');
  const forwardBtn = document.getElementById('forward-btn');

  // History stack — each entry is { type: 'scene-info' | 'nav' | 'entity', html?: string }
  const wikiHistory = [{ type: 'scene-info' }];
  let cursor = 0;

  function renderCurrent() {
    const entry = wikiHistory[cursor];
    navPanel.style.display = 'none';
    sceneInfo.style.display = 'none';

if (entry.type === 'scene-info') {
      sceneInfo.style.display = 'block';
      entityContent.style.display = 'none';
    } else if (entry.type === 'nav') {
      navPanel.style.display = 'block';
      entityContent.style.display = 'none';
    } else if (entry.type === 'entity') {
      sceneInfo.style.display = 'none';
      navPanel.style.display = 'none';
      // entity content is rendered in a separate div
      entityContent.innerHTML = entry.html;
      entityContent.style.display = 'block';
    }
    updateControls();
  }

  function push(entry) {
    // Drop any forward history when pushing a new entry
    wikiHistory.splice(cursor + 1);
    wikiHistory.push(entry);
    cursor = wikiHistory.length - 1;
    renderCurrent();
  }

  function updateControls() {
    backBtn.disabled = cursor <= 0;
    forwardBtn.disabled = cursor >= wikiHistory.length - 1;
  }

  // Nav toggle — pushes nav onto stack
    navToggle.addEventListener('click', () => {
        if (wikiHistory[cursor].type !== 'nav') {
          push({ type: 'nav' });
        }
        if (window.innerWidth < 768) openDrawer();
      });

// Entity links — wrapped in a function so it can be re-called after prose pane swaps
  function wireEntityLinks() {
    document.querySelectorAll('.wiki-link, #scene-info a').forEach(link => {
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        try {
          const response = await fetch(href);
          const html = await response.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const content = doc.querySelector('main') || doc.querySelector('body');
          push({ type: 'entity', html: content ? content.innerHTML : 'No content found.' });
          if (window.innerWidth < 768) openDrawer();
        } catch (err) {
          push({ type: 'entity', html: 'Could not load entity.' });
        }
      });
    });
  }
function wireContentWarnings() {
  const toggle = document.getElementById('cw-toggle');
  const content = document.getElementById('cw-content');
  const label = document.getElementById('cw-toggle-label');

  if (!toggle || !content || !label) return;

  // Restore session state for new scene
  const stored = sessionStorage.getItem('keely-warnings-shown');
  if (stored === 'true') {
    content.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    label.textContent = 'Hide';
  } else {
    content.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    label.textContent = 'Show';
  }

  toggle.addEventListener('click', () => {
    const isHidden = content.hidden;
    content.hidden = !isHidden;
    toggle.setAttribute('aria-expanded', String(isHidden));
    label.textContent = isHidden ? 'Hide' : 'Show';
    sessionStorage.setItem('keely-warnings-shown', String(isHidden));
  });
}

// Fetch and swap prose pane content
  async function navigateToScene(url) {
    try {
      const response = await fetch(url);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const newPane = doc.getElementById('prose-pane');
      if (!newPane) return;

      // Swap prose pane contents
      const prosePane = document.getElementById('prose-pane');
      prosePane.innerHTML = newPane.innerHTML;
      wireEntityLinks();
      wireContentWarnings();
      const newSceneId = newPane.querySelector('.scene-meta')?.dataset.sceneId;
      if (newSceneId) window.__KEELY_CURRENT_SCENE__ = newSceneId;
      const currentMode = localStorage.getItem('keely-throughline') ?? 'linear';
      applyFilter(currentMode);

      // Update browser URL and page title
      const newTitle = doc.title;
      document.title = newTitle;
      window.history.pushState({ url }, newTitle, url);

      // Scroll prose pane to top
      prosePane.scrollTop = 0;
      window.scrollTo(0, 0);

      // Announce navigation to screen readers
      prosePane.setAttribute('tabindex', '-1');
      prosePane.focus();

      updateCurrentScene(url); 

    } catch (err) {
      // Fall back to full page load if fetch fails
      window.location.href = url;
    
    }
  }

  function updateCurrentScene(url) {
  // Remove existing current marker
  document.querySelectorAll('#nav-panel .nav-scene-list li.current')
    .forEach(li => li.classList.remove('current'));
  
  // Find and mark the new current scene
  document.querySelectorAll('#nav-panel .nav-scene-list a').forEach(link => {
    if (link.getAttribute('href') === url) {
      link.closest('li').classList.add('current');
    }
  });
}
  

  // Handle browser back/forward buttons
  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.url) {
      navigateToScene(e.state.url);
    }
  });

  // Intercept scene link clicks via delegation on pane-row
  document.getElementById('pane-row').addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href');
    if (href && href.includes('/scenes/')) {
      e.preventDefault();
      navigateToScene(href);
    }
  });
    
  // Back/forward
  backBtn.addEventListener('click', () => {
    if (cursor > 0) { cursor--; renderCurrent(); }
  });
  forwardBtn.addEventListener('click', () => {
    if (cursor < wikiHistory.length - 1) { cursor++; renderCurrent(); }
  });

// Wiki pane collapse/expand
  const wikiToggle = document.getElementById('wiki-toggle');
  const wikiPaneEl = document.getElementById('wiki-pane');

  // Mobile drawer
  const wikiHeaderBtn = document.getElementById('wiki-header-btn');
  const wikiBackdrop = document.getElementById('wiki-backdrop');

  function openDrawer() {
    wikiPaneEl.classList.add('drawer-open');
    wikiBackdrop.classList.add('active');
  }

  function closeDrawer() {
    wikiPaneEl.classList.remove('drawer-open');
    wikiBackdrop.classList.remove('active');
  }

  if (wikiHeaderBtn) {
    wikiHeaderBtn.addEventListener('click', openDrawer);
  }

  if (wikiBackdrop) {
    wikiBackdrop.addEventListener('click', closeDrawer);
  }

  // Read author default from data attribute (set in template)
const stored = localStorage.getItem('wiki-collapsed');
const authorDefault = document.documentElement.dataset.sidebarCollapsed === 'true';
const collapsed = stored !== null ? stored === 'true' : authorDefault;
if (collapsed) {
    wikiPaneEl.classList.add('collapsed');
    wikiToggle.textContent = '›';
  }

  wikiToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isCollapsed = wikiPaneEl.classList.toggle('collapsed');
    localStorage.setItem('wiki-collapsed', isCollapsed);
    wikiToggle.textContent = isCollapsed ? '›' : '‹';
  });

  // Clicking the collapsed strip expands it
  wikiPaneEl.addEventListener('click', (e) => {
    if (wikiPaneEl.classList.contains('collapsed')) {
      wikiPaneEl.classList.remove('collapsed');
      localStorage.setItem('wiki-collapsed', 'false');
      wikiToggle.textContent = '‹';
    }
  });

// ── Through-line filter ──────────────────────────────────────────────

function getFilteredScenes(mode) {
  const scenes = window.__KEELY_SCENE_INDEX__;
  if (!scenes) return null;
  if (mode === 'linear') return scenes;
  if (mode.startsWith('pov:')) {
    const pov = mode.slice(4);
    return scenes.filter(s => s.pov === pov);
  }
  if (mode.startsWith('thread:')) {
    const thread = mode.slice(7);
    return scenes.filter(s => s.threads.includes(thread));
  }
  return scenes;
}

function getAdjacentScenes(mode) {
  const current = window.__KEELY_CURRENT_SCENE__;
  const filtered = getFilteredScenes(mode);
  if (!filtered) return { prev: null, next: null };
  const idx = filtered.findIndex(s => s.id === current);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? filtered[idx - 1] : null,
    next: idx < filtered.length - 1 ? filtered[idx + 1] : null,
  };
}

function updateNavLinks(mode) {
  const { prev: adjPrev, next: adjNext } = getAdjacentScenes(mode);
  const project = window.location.pathname.split('/')[1];
  const storySlug = window.location.pathname.split('/')[3];
  const navEl = document.querySelector('#prose-pane nav');
  if (!navEl) return;

  const prevHtml = adjPrev
    ? `<a href="/${project}/stories/${storySlug}/scenes/${adjPrev.id}">← ${adjPrev.number}. ${adjPrev.title}</a>`
    : `<a href="/${project}/stories/${storySlug}">← Story Home</a>`;

    const completionStatus = navEl.dataset.completionStatus;
    const endLabel = completionStatus === 'complete' ? 'End →' : 'To be continued...';

    const nextHtml = adjNext
      ? `<a href="/${project}/stories/${storySlug}/scenes/${adjNext.id}">${adjNext.number}. ${adjNext.title} →</a>`
      : `<span style="color: #999;">${endLabel}</span>`;

  navEl.innerHTML = prevHtml + nextHtml;
}

function applyFilter(mode) {
  localStorage.setItem('keely-throughline', mode);
  updateNavLinks(mode);
  const select = document.getElementById('throughline-select');
  if (select && select.value !== mode) select.value = mode;
}

// Restore saved filter or default to linear
document.addEventListener('DOMContentLoaded', () => {
  const savedMode = localStorage.getItem('keely-throughline') ?? 'linear';
  applyFilter(savedMode);
});

document.getElementById('throughline-select')?.addEventListener('change', (e) => {
  applyFilter(e.target.value);
});

// Initialize
  wireEntityLinks();
  wireContentWarnings();
  updateControls();
