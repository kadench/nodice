document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById('start-game');
  const optionsBtn = document.getElementById('options-btn');

  const modal = document.getElementById('options-modal');
  const modalBackdrop = modal ? modal.querySelector('.modal-backdrop') : null;
  const playerInput = document.getElementById('player-count');

  // Ensure modal is hidden by default (fix "open by default" bug)
  if (modal) modal.hidden = true;

  const tabButtons = Array.from(document.querySelectorAll('.tab-btn'));
  const panels = Array.from(document.querySelectorAll('.options-panel'));
  const saveDiceBtn = document.getElementById('save-dice-scores');
  const resetDiceBtn = document.getElementById('reset-dice-scores');
  const closeOptionsBottom = document.getElementById('close-options-bottom');

  const DEFAULT_DICE_SCORES = {
    one_5: 50, one_1: 100,
    three_1: 1000, three_2: 200, three_3: 300, three_4: 400, three_5: 500, three_6: 600,
    four_any: 1000, five_any: 2000, six_any: 3000,
    straight: 1500, two_triplets: 2500, four_any_w_pair: 2500,
    first_run_min: 300
  };

  const STORAGE_KEY = "nodice_custom_opts";

  function loadSavedOptions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function saveOptions(obj) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch {}
  }

  function populateDiceFormFrom(obj) {
    const form = document.getElementById('dice-scores-form');
    if (!form) return;
    const data = Object.assign({}, DEFAULT_DICE_SCORES, obj?.diceScores || {});
    for (const k of Object.keys(DEFAULT_DICE_SCORES)) {
      const el = form.querySelector(`[name="${k}"]`);
      if (el) el.value = String(data[k] ?? DEFAULT_DICE_SCORES[k]);
    }
  }

  function readDiceFormValues() {
    const form = document.getElementById('dice-scores-form');
    if (!form) return null;
    const out = {};
    for (const k of Object.keys(DEFAULT_DICE_SCORES)) {
      const el = form.querySelector(`[name="${k}"]`);
      const v = el ? parseInt(el.value, 10) : DEFAULT_DICE_SCORES[k];
      out[k] = Number.isFinite(v) ? v : DEFAULT_DICE_SCORES[k];
    }
    return out;
  }

  function formDiffersFromDefaults() {
    const vals = readDiceFormValues();
    if (!vals) return false;
    for (const k of Object.keys(DEFAULT_DICE_SCORES)) {
      if ((vals[k] ?? DEFAULT_DICE_SCORES[k]) !== DEFAULT_DICE_SCORES[k]) return true;
    }
    return false;
  }

  function applyActiveTabState() {
    const activeBtn = tabButtons.find(b => b.classList.contains('active')) || tabButtons[0];
    if (!activeBtn) return;
    tabButtons.forEach(b => {
      const isActive = b === activeBtn;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-selected', isActive ? "true" : "false");
    });
    const target = activeBtn.dataset.tab;
    panels.forEach(p => {
      const pid = p.id || "";
      const match = pid === target || pid === `${target}-panel`;
      p.hidden = !match;
    });
  }

  let lastFocused = null;
  if (optionsBtn && modal) {
    optionsBtn.addEventListener('click', () => {
      lastFocused = document.activeElement;
      modal.hidden = false;
      document.body.classList.add('modal-open');
      const saved = loadSavedOptions();
      populateDiceFormFrom(saved);
      applyActiveTabState();
      const focusTarget = modal.querySelector('#save-dice-scores') || modal.querySelector('button');
      if (focusTarget) focusTarget.focus();
    });
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => {
        const isActive = b === btn;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-selected', isActive ? "true" : "false");
      });

      const target = btn.dataset.tab;
      panels.forEach(p => {
        const pid = p.id || "";
        const match = pid === target || pid === `${target}-panel`;
        p.hidden = !match;
      });
    });
  });

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  // wire close buttons & backdrop correctly (fix missing listeners)
  const closeOptionsTop = document.getElementById('close-options');
  if (closeOptionsTop) closeOptionsTop.addEventListener('click', closeModal);
  if (closeOptionsBottom) closeOptionsBottom.addEventListener('click', closeModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

  // Save dice scores handler – ONLY mark useCustom if values differ from defaults
  if (saveDiceBtn) {
    saveDiceBtn.addEventListener('click', () => {
      const vals = readDiceFormValues();
      if (!vals) return;

      let changed = false;
      for (const k of Object.keys(DEFAULT_DICE_SCORES)) {
        if ((vals[k] ?? DEFAULT_DICE_SCORES[k]) !== DEFAULT_DICE_SCORES[k]) {
          changed = true;
          break;
        }
      }

      try {
        if (changed) {
          saveOptions({ diceScores: vals, useCustom: true, savedAt: Date.now() });
        } else {
          // exactly defaults -> remove any custom flag
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {}

      closeModal();
    });
  }

  // Reset → force defaults and clear any saved custom options
  if (resetDiceBtn) {
    resetDiceBtn.addEventListener('click', () => {
      populateDiceFormFrom({ diceScores: DEFAULT_DICE_SCORES });
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
    });
  }

  // Start button: ONLY launch custom if options actually differ from defaults
  if (startBtn && playerInput) {
    startBtn.addEventListener('click', () => {
      let n = parseInt(playerInput.value, 10);
      if (!Number.isFinite(n) || n < 1) n = 1;
      if (n > 16) n = 16;

      const saved = loadSavedOptions();
      const savedDiffers = !!saved && !!saved.diceScores && Object.keys(DEFAULT_DICE_SCORES).some(
        k => (saved.diceScores[k] ?? DEFAULT_DICE_SCORES[k]) !== DEFAULT_DICE_SCORES[k]
      );

      // Also detect unsaved edits in the open modal (if user changed then clicked Start directly)
      const liveDiffers = formDiffersFromDefaults();

      const useCustom = savedDiffers || liveDiffers;
      window.location.href = `game.html?players=${n}&custom=${useCustom ? "1" : "0"}`;
    });
  }

  if (modal) {
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal();
        return;
      }
      if (e.key === 'Tab') {
        const focusables = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    });
  }

  const form = document.getElementById('menu-form');
  if (form && startBtn) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      startBtn.click();
    });
  }

  applyActiveTabState();
});