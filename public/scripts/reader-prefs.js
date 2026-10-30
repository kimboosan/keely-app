// Reader preferences (D-099): the ⚙ panel in every page's header. Loaded by
// SiteLayout on every page, so the panel works — and the reader's choices
// apply — on project, story, wiki and entity pages, not only scene pages.
// reader.js (scene pages) calls applyReaderPreferences() again after it
// swaps in a new scene, and handles its own scene-only preference (the
// wiki pane's default) on the event this dispatches.
//
// Loaded in <head> without defer, so applyReaderPreferences exists before
// reader.js runs; wiring waits for the page to finish loading.

function applyReaderPreferences() {
  const hideWarnings = localStorage.getItem('keely-hide-warnings') === 'true';
  const hideNotes = localStorage.getItem('keely-hide-notes') === 'true';

  // Content warnings — scene level
  const cwWrapper = document.getElementById('cw-wrapper');
  if (cwWrapper) cwWrapper.hidden = hideWarnings;

  // Content warnings — story level
  document.querySelectorAll('.story-block--warnings').forEach(el => {
    el.hidden = hideWarnings;
  });

  // Author notes — scene, story and project level
  document.querySelectorAll('.scene-authors-note, .story-author-note, .project-author-note').forEach(el => {
    el.hidden = hideNotes;
  });

  document.dispatchEvent(new CustomEvent('keely:reader-preferences'));
}

function wireReaderPreferences() {
  const btn = document.getElementById('reader-prefs-btn');
  const modal = document.getElementById('reader-prefs-modal');
  const closeBtn = document.getElementById('reader-prefs-close');
  const hideWarningsEl = document.getElementById('pref-hide-warnings');
  const hideNotesEl = document.getElementById('pref-hide-notes');
  const wikiCollapsedEl = document.getElementById('pref-wiki-collapsed');

  if (!btn || !modal) return;

  // Restore checkbox states from localStorage
  hideWarningsEl.checked = localStorage.getItem('keely-hide-warnings') === 'true';
  hideNotesEl.checked = localStorage.getItem('keely-hide-notes') === 'true';
  wikiCollapsedEl.checked = localStorage.getItem('keely-wiki-default-collapsed') === 'true';

  // Open/close modal
  btn.addEventListener('click', () => {
    modal.hidden = !modal.hidden;
  });

  closeBtn.addEventListener('click', () => {
    modal.hidden = true;
  });

  // Close on click outside panel
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.hidden = true;
  });

  // Toggle handlers — save and apply immediately
  hideWarningsEl.addEventListener('change', () => {
    localStorage.setItem('keely-hide-warnings', hideWarningsEl.checked);
    applyReaderPreferences();
  });

  hideNotesEl.addEventListener('change', () => {
    localStorage.setItem('keely-hide-notes', hideNotesEl.checked);
    applyReaderPreferences();
  });

  wikiCollapsedEl.addEventListener('change', () => {
    localStorage.setItem('keely-wiki-default-collapsed', wikiCollapsedEl.checked);
    applyReaderPreferences();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  wireReaderPreferences();
  applyReaderPreferences();
});
