import { SpriteCycle } from './sprite-cycles.js?v=wave-hd';

(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const intro = document.getElementById('intro');
  const status = document.getElementById('scene-status');
  const players = [];
  let greetingPlayer;
  let greetingReady = false;
  let greetingStarted = false;
  let greetingFinished = false;
  const motionAllowed = () => !reduced.matches && !document.hidden;
  const labels = { active: 'Out and about', reading: 'Family time', sleeping: 'Recharging' };
  const updateStatus = () => {
    status.textContent = `${labels[root.dataset.activity]} · ${root.dataset.barcelonaClock} in Barcelona`;
  };
  addEventListener('nacho-clock-change', updateStatus);
  updateStatus();

  // Choose once per page load; keep the still and animation on the same instrument.
  const portrait = document.getElementById('music-portrait');
  const instrumentImage = portrait.querySelector('img');
  const instrument = Math.random() < 0.5 ? 'guitar' : 'piano';
  instrumentImage.src = `assets/cycles/${instrument}-still.webp`;
  instrumentImage.alt = instrument === 'piano' ? 'Nacho practising digital piano' : 'Nacho playing acoustic guitar';
  portrait.dataset.instrument = instrument;
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
  musicPlayer.load(instrument);

  // Family blinking and sleeping use discrete sprite frames.
  const introAllowed = activity => motionAllowed() && root.dataset.activity === activity &&
    intro.classList.contains('is-on-screen');
  const sleepHost = intro.querySelector('.sleep');
  const familyHost = intro.querySelector('.reading');
  const sleepPlayer = new SpriteCycle({
    canvas: document.getElementById('sleep-cycle'), host: sleepHost,
    allowed: () => introAllowed('sleeping'),
  });
  const familyPlayer = new SpriteCycle({
    canvas: document.getElementById('family-motion'), host: familyHost,
    allowed: () => introAllowed('reading'),
  });
  players.push(sleepPlayer, familyPlayer);
  const introAssets = new Set();
  function loadIntroAction() {
    if (reduced.matches || root.dataset.activity === 'active') return;
    const action = root.dataset.activity === 'sleeping' ? 'sleep' : 'family';
    if (introAssets.has(action)) return;
    introAssets.add(action);
    const player = { sleep: sleepPlayer, family: familyPlayer }[action];
    player.load(action).then(loaded => { if (!loaded) introAssets.delete(action); });
  }
  function syncMotion() {
    const allowed = motionAllowed();
    root.dataset.motion = allowed ? 'on' : 'off';
    if (!allowed && greetingStarted) finishGreeting();
    loadIntroAction();
    if (greetingReady && !greetingStarted && !greetingFinished && allowed &&
        root.dataset.activity === 'active' && intro.classList.contains('is-on-screen') && scrollY < 40) {
      greetingStarted = true;
      intro.classList.add('is-greeting');
      intro.setAttribute('aria-label', 'Nacho waving hello');
      greetingPlayer.restart();
    }
    players.forEach(player => player.sync());
  }
  const visibility = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      entry.target.classList.toggle('is-on-screen', entry.isIntersecting);
    });
    syncMotion();
  });
  [intro, document.querySelector('.sprite--code'), portrait].forEach(element => visibility.observe(element));

  const greeting = document.createElement('canvas');
  greeting.className = 'wave sprite-cycle';
  greeting.setAttribute('aria-hidden', 'true');
  intro.append(greeting);
  greetingPlayer = new SpriteCycle({
    canvas: greeting, once: true, onComplete: finishGreeting,
    allowed: () => motionAllowed() && root.dataset.activity === 'active' &&
      intro.classList.contains('is-greeting') && intro.classList.contains('is-on-screen'),
  });
  players.push(greetingPlayer);
  function finishGreeting() {
    greetingFinished = true;
    intro.classList.remove('is-greeting');
    greetingPlayer?.pause();
    if (root.dataset.activity === 'active') intro.setAttribute('aria-label', 'Nacho, standing');
  }
  if (!reduced.matches && root.dataset.activity === 'active' && scrollY < 40) {
    greetingPlayer.load('wave-hd').then(loaded => {
      greetingReady = loaded;
      syncMotion();
    });
  }
  addEventListener('scroll', finishGreeting, { passive: true });
  addEventListener('nacho-activity-change', () => { finishGreeting(); syncMotion(); });
  document.addEventListener('visibilitychange', syncMotion);
  reduced.addEventListener('change', syncMotion);
  syncMotion();
})();
