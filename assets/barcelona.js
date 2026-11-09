// Small, deliberately stepped sky effects on the same pixel grid as the skyline.
(function () {
  var section = document.getElementById('barcelona');
  if (!section) return;
  var canvas = section.querySelector('canvas');
  var context = canvas.getContext('2d');
  var backdrop = section.querySelector('img');
  var motion = matchMedia('(prefers-reduced-motion: reduce)');
  var birds = [], rockets = [], sparks = [];
  var mode, nextBird = 0, nextRocket = 0;
  var visible = false, frame = 0, last = 0;
  var STEP = 1000 / 12;
  var COLORS = [['#ffe29a', '#e79247'], ['#ffb0be', '#d65788'], ['#b7e8dd', '#5ea69e']];
  var UP = ['x...x', '.x.x.', '..x..'];
  var DOWN = ['.....', '..x..', 'xx.xx'];
  var random = function (min, max) { return min + Math.random() * (max - min); };

  function resize() {
    // One effect pixel is about three CSS pixels, independent of display density.
    canvas.width = Math.max(1, Math.round(section.clientWidth / 3));
    canvas.height = Math.max(1, Math.round(section.clientHeight / 3));
    context.imageSmoothingEnabled = false;
    birds = []; rockets = []; sparks = [];
    nextBird = nextRocket = 0;
  }

  function burst(rocket) {
    for (var i = 0; i < 24; i++) {
      var angle = i * Math.PI * 2 / 24;
      sparks.push({ x: rocket.x, y: rocket.y, vx: Math.cos(angle) * 1.8,
        vy: Math.sin(angle) * 1.8, age: 0, life: random(16, 24), colors: rocket.colors });
    }
  }

  function advance() {
    var day = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--day'));
    var nextMode = day >= 0.35 ? 'birds' : 'fireworks';
    if (nextMode !== mode) {
      mode = nextMode;
      birds = []; rockets = []; sparks = [];
      nextBird = nextRocket = 0;
      section.dataset.sky = mode;
    }
    var w = canvas.width, h = canvas.height;
    if (mode === 'birds' && --nextBird <= 0) {
      // Staggered flocks cross the open sky in a gently flapping V.
      var direction = Math.random() < 0.5 ? 1 : -1;
      for (var i = 0; i < 4; i++) {
        birds.push({ x: direction > 0 ? -i * 8 : w + i * 8,
          y: h * random(0.12, 0.3) + Math.abs(i - 1) * 3,
          direction: direction, age: i * 2 });
      }
      nextBird = Math.round(random(100, 160));
    }
    if (mode === 'fireworks' && --nextRocket <= 0) {
      rockets.push({ x: w * random(0.2, 0.85), y: h * 0.75,
        top: h * random(0.16, 0.4), colors: COLORS[Math.floor(random(0, COLORS.length))] });
      nextRocket = Math.round(random(34, 60));
    }
    birds.forEach(function (b) { b.x += b.direction * 1.2; b.age++; });
    birds = birds.filter(function (b) { return b.x > -40 && b.x < w + 40; });
    rockets.forEach(function (r) { r.y -= 3; if (r.y <= r.top) burst(r); });
    rockets = rockets.filter(function (r) { return r.y > r.top; });
    sparks.forEach(function (s) {
      s.x += s.vx; s.y += s.vy;
      s.vx *= 0.94; s.vy = s.vy * 0.94 + 0.06; s.age++;
    });
    sparks = sparks.filter(function (s) { return s.age < s.life; });
  }

  function draw() {
    context.globalCompositeOperation = 'source-over';
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#3b3540';
    birds.forEach(function (b) {
      var pose = b.age % 8 < 4 ? UP : DOWN;
      pose.forEach(function (row, y) {
        for (var x = 0; x < row.length; x++) {
          if (row[x] === 'x') context.fillRect(Math.round(b.x) + x, Math.round(b.y) + y, 1, 1);
        }
      });
    });
    rockets.forEach(function (r) {
      context.fillStyle = r.colors[0];
      context.fillRect(Math.round(r.x), Math.round(r.y), 1, 2);
    });
    sparks.forEach(function (s, i) {
      // Sparse, small bursts; no full-screen flashing or glowing overlays.
      if (s.age > s.life * 0.7 && (s.age + i) % 2) return;
      context.fillStyle = s.colors[s.age < s.life / 2 ? 0 : 1];
      context.fillRect(Math.round(s.x), Math.round(s.y), 1, 1);
    });
    // Cut the artwork out of the effects so birds/fireworks always pass behind landmarks.
    if (backdrop.complete && backdrop.naturalWidth) {
      var scale = canvas.width / section.clientWidth;
      var width = backdrop.clientWidth * scale;
      var height = backdrop.clientHeight * scale;
      context.globalCompositeOperation = 'destination-out';
      context.drawImage(backdrop, canvas.width - width, canvas.height - height, width, height);
      context.globalCompositeOperation = 'source-over';
    }
  }

  function render(time) {
    if (time - last >= STEP) {
      last = time;
      advance(); draw();
    }
    frame = requestAnimationFrame(render);
  }
  function sync() {
    var running = visible && !document.hidden && !motion.matches;
    cancelAnimationFrame(frame);
    frame = 0;
    if (running) { last = 0; frame = requestAnimationFrame(render); }
    if (motion.matches) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      section.dataset.sky = 'still';
      mode = undefined;
    }
  }
  new ResizeObserver(resize).observe(section);
  new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
    sync();
  }).observe(section);
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);
  resize();
})();
