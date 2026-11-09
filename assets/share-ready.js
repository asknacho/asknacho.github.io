(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const intro = document.getElementById('intro');
  const status = document.getElementById('scene-status');
  const labels = { active: 'Out and about', reading: 'Family time', sleeping: 'Recharging' };
  const updateStatus = () => {
    status.textContent = `${labels[root.dataset.activity]} · ${root.dataset.barcelonaClock} in Barcelona`;
  };
  addEventListener('nacho-clock-change', updateStatus);
  updateStatus();

  // Instrument choice changes the art, not the time-based intro schedule.
  const portrait = document.getElementById('music-portrait');
  const instrumentImage = portrait.querySelector('img');
  document.querySelectorAll('[data-instrument]').forEach(button => {
    if (button.tagName !== 'BUTTON') return;
    button.addEventListener('click', () => {
      const instrument = button.dataset.instrument;
      instrumentImage.src = `assets/${instrument === 'piano' ? 'piano' : 'guitar-polished'}.webp`;
      instrumentImage.alt = instrument === 'piano' ? 'Nacho practising digital piano' : 'Nacho playing acoustic guitar';
      portrait.dataset.instrument = instrument;
      document.querySelectorAll('button[data-instrument]').forEach(other => {
        other.setAttribute('aria-pressed', String(other === button));
      });
    });
  });

  // The saved image remains the no-JS / reduced-motion fallback. Draw at its
  // native resolution: the face detail never passes through a tiny pixel canvas.
  const canvas = document.getElementById('family-motion');
  const context = canvas.getContext('2d');
  const family = canvas.previousElementSibling;
  const familyStage = canvas.parentElement;
  let ready = false;
  let familyVisible = false;
  let frame = 0;
  let lastPaint = 0;
  let waveTimer;
  let waveStart;
  const w = canvas.width, h = canvas.height;
  const polygon = points => {
    const path = new Path2D();
    points.forEach(([x, y], i) => i ? path.lineTo(x * w, y * h) : path.moveTo(x * w, y * h));
    path.closePath();
    return path;
  };
  const mother = polygon([[.54,0],[.63,0],[.68,.08],[.68,.19],[.65,.28],[.73,.34],[.74,.50],[.69,.56],[.64,.55],[.59,.54],[.52,.55],[.50,.50],[.49,.41],[.49,.30],[.51,.26],[.50,.17],[.51,.08]]);
  const blocks = polygon([[.635,.80],[.685,.80],[.701,.84],[.685,.87],[.685,.90],[.635,.90]]);
  const background = new Path2D();
  background.rect(0, 0, w, h);
  background.addPath(mother);
  background.addPath(blocks);
  const drawLayer = (path, transform) => {
    context.save();
    transform();
    context.clip(path);
    context.drawImage(family, 0, 0, w, h);
    context.restore();
  };
  function paint(time) {
    frame = 0;
    if (!ready || reduced.matches || document.hidden || !familyVisible || root.dataset.activity !== 'reading') return;
    frame = requestAnimationFrame(paint);
    if (time - lastPaint < 80) return;
    lastPaint = time;
    const seconds = time / 1000;
    context.clearRect(0, 0, w, h);
    context.save();
    context.clip(background, 'evenodd');
    context.drawImage(family, 0, 0, w, h);
    context.restore();
    drawLayer(mother, () => {
      context.translate(w * .61, h * .55);
      context.rotate(Math.sin(seconds * 1.2) * .006);
      context.translate(-w * .61, -h * .55);
    });
    const blockPhase = seconds % 10;
    const lift = blockPhase > 6 && blockPhase < 9 ? Math.sin((blockPhase - 6) / 3 * Math.PI) : 0;
    drawLayer(blocks, () => context.translate(-lift * 5, -lift * 16));
    // A single paper-colored leaf rolls across the existing open book.
    const pagePhase = seconds % 14;
    if (pagePhase > 10 && pagePhase < 11.4) {
      const turn = (pagePhase - 10) / 1.4;
      const spine = w * .36;
      const edge = spine + Math.cos(turn * Math.PI) * w * .085;
      context.fillStyle = '#f0ddae';
      context.beginPath();
      context.moveTo(spine, h * .442);
      context.lineTo(edge, h * (.405 - Math.sin(turn * Math.PI) * .025));
      context.lineTo(edge, h * .48);
      context.lineTo(spine, h * .535);
      context.closePath();
      context.fill();
      context.strokeStyle = '#c6ab79';
      context.lineWidth = 3;
      context.stroke();
    }
  }
  function syncMotion() {
    const allowed = !reduced.matches && !document.hidden;
    root.dataset.motion = allowed ? 'on' : 'off';
    familyStage.classList.toggle('is-animated', allowed && ready && familyVisible && root.dataset.activity === 'reading');
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    if (allowed && ready && familyVisible && root.dataset.activity === 'reading') frame = requestAnimationFrame(paint);
    if (!allowed) stopWave();
  }
  const loaded = () => { ready = family.naturalWidth > 0; syncMotion(); };
  if (family.complete) loaded();
  else family.addEventListener('load', loaded, { once: true });

  const visibility = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      entry.target.classList.toggle('is-on-screen', entry.isIntersecting);
      if (entry.target === intro) familyVisible = entry.isIntersecting;
    });
    syncMotion();
  });
  [intro, document.querySelector('.sprite--code'), portrait].forEach(element => visibility.observe(element));

  // A greeting runs once on entry, then yields immediately to scrolling.
  const wave = new Image();
  wave.className = 'wave';
  wave.alt = '';
  function stopWave() {
    clearInterval(waveTimer);
    intro.classList.remove('is-greeting');
  }
  wave.addEventListener('load', () => {
    if (reduced.matches || document.hidden || root.dataset.activity !== 'active' || scrollY > 40) return;
    intro.append(wave);
    waveStart = performance.now();
    intro.classList.add('is-greeting');
    waveTimer = setInterval(() => {
      const elapsed = performance.now() - waveStart;
      if (elapsed > 2600) return stopWave();
      const frameIndex = elapsed < 300 ? 0 : elapsed < 600 ? 1 : 2 + Math.floor(elapsed / 220) % 2;
      wave.style.transform = `translateX(${-frameIndex * 25}%)`;
    }, 180);
  });
  if (!reduced.matches && root.dataset.activity === 'active') wave.src = 'assets/wave.webp';
  addEventListener('scroll', stopWave, { passive: true });
  addEventListener('nacho-activity-change', () => { stopWave(); syncMotion(); });
  document.addEventListener('visibilitychange', syncMotion);
  reduced.addEventListener('change', syncMotion);
  syncMotion();
})();
