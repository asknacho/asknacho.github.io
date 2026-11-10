import { SpriteCycle } from './sprite-cycles.js';

(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const intro = document.getElementById('intro');
  const status = document.getElementById('scene-status');
  const players = [];
  let wavePlayer;
  const motionAllowed = () => !reduced.matches && !document.hidden;
  const labels = { active: 'Out and about', reading: 'Family time', sleeping: 'Recharging' };
  const updateStatus = () => {
    status.textContent = `${labels[root.dataset.activity]} · ${root.dataset.barcelonaClock} in Barcelona`;
  };
  addEventListener('nacho-clock-change', updateStatus);
  updateStatus();

  // Instrument choice changes the art, not the time-based intro schedule.
  const portrait = document.getElementById('music-portrait');
  const instrumentImage = portrait.querySelector('img');
  const codeHost = document.querySelector('.sprite--code');
  const codePlayer = new SpriteCycle({
    canvas: document.getElementById('code-cycle'), host: codeHost,
    allowed: () => motionAllowed() && codeHost.classList.contains('is-on-screen'),
  });
  const musicPlayer = new SpriteCycle({
    canvas: document.getElementById('music-cycle'), host: portrait,
    allowed: () => motionAllowed() && portrait.classList.contains('is-on-screen'),
  });
  players.push(codePlayer, musicPlayer);
  codePlayer.load('code');
  musicPlayer.load('guitar');
  document.querySelectorAll('[data-instrument]').forEach(button => {
    if (button.tagName !== 'BUTTON') return;
    button.addEventListener('click', () => {
      const instrument = button.dataset.instrument;
      instrumentImage.src = `assets/cycles/${instrument}-still.webp`;
      instrumentImage.alt = instrument === 'piano' ? 'Nacho practising digital piano' : 'Nacho playing acoustic guitar';
      portrait.dataset.instrument = instrument;
      musicPlayer.load(instrument);
      document.querySelectorAll('button[data-instrument]').forEach(other => {
        other.setAttribute('aria-pressed', String(other === button));
      });
    });
  });

  // All intro actions use the same discrete twelve-frame player.
  const introAllowed = activity => motionAllowed() && root.dataset.activity === activity &&
    intro.classList.contains('is-on-screen');
  const walkHost = intro.querySelector('.walk');
  const sleepHost = intro.querySelector('.sleep');
  const familyHost = intro.querySelector('.reading');
  const walkPlayer = new SpriteCycle({
    canvas: document.getElementById('walk-cycle'), host: walkHost,
    allowed: () => introAllowed('active') && intro.classList.contains('is-walking'),
  });
  const sleepPlayer = new SpriteCycle({
    canvas: document.getElementById('sleep-cycle'), host: sleepHost,
    allowed: () => introAllowed('sleeping'),
  });
  const familyPlayer = new SpriteCycle({
    canvas: document.getElementById('family-motion'), host: familyHost,
    allowed: () => introAllowed('reading'),
  });
  players.push(walkPlayer, sleepPlayer, familyPlayer);
  const introAssets = new Set();
  function loadIntroAction() {
    if (reduced.matches) return;
    const action = root.dataset.activity === 'active' ? 'walk'
      : root.dataset.activity === 'sleeping' ? 'sleep' : 'family';
    if (introAssets.has(action)) return;
    introAssets.add(action);
    const player = { walk: walkPlayer, sleep: sleepPlayer, family: familyPlayer }[action];
    player.load(action).then(loaded => { if (!loaded) introAssets.delete(action); });
  }
  function syncMotion() {
    const allowed = motionAllowed();
    root.dataset.motion = allowed ? 'on' : 'off';
    if (!allowed) stopWave();
    loadIntroAction();
    players.forEach(player => player.sync());
  }
  const visibility = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      entry.target.classList.toggle('is-on-screen', entry.isIntersecting);
    });
    syncMotion();
  });
  [intro, document.querySelector('.sprite--code'), portrait].forEach(element => visibility.observe(element));

  // A greeting runs once on entry, then yields immediately to scrolling.
  const wave = document.createElement('canvas');
  wave.className = 'wave';
  wave.setAttribute('aria-hidden', 'true');
  intro.append(wave);
  wavePlayer = new SpriteCycle({
    canvas: wave, once: true, onComplete: stopWave,
    allowed: () => motionAllowed() && root.dataset.activity === 'active' &&
      intro.classList.contains('is-greeting') && intro.classList.contains('is-on-screen'),
  });
  players.push(wavePlayer);
  function stopWave() {
    intro.classList.remove('is-greeting');
    wavePlayer?.pause();
  }
  if (!reduced.matches && root.dataset.activity === 'active') {
    wavePlayer.load('wave').then(loaded => {
      if (!loaded || !motionAllowed() || root.dataset.activity !== 'active' || scrollY > 40) return;
      intro.classList.add('is-greeting');
      wavePlayer.restart();
    });
  }
  addEventListener('scroll', () => { stopWave(); walkPlayer.sync(); }, { passive: true });
  addEventListener('nacho-activity-change', () => { stopWave(); syncMotion(); });
  document.addEventListener('visibilitychange', syncMotion);
  reduced.addEventListener('change', syncMotion);
  syncMotion();
})();
