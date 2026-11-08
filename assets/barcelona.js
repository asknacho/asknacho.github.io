// Birds, fireworks and sea glints over the Barcelona backdrop.
// Ported from the scene app (scene/src/backgroundEffects.ts). Fireworks only at night, birds only by day;
// everything is masked so it stays behind the tree, the city and the hill.
(function () {
  var section = document.getElementById('barcelona');
  if (!section || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var skyCanvas = section.querySelector('.bcn-sky');
  var seaCanvas = section.querySelector('.bcn-sea');
  var sky = skyCanvas.getContext('2d');
  var sea = seaCanvas.getContext('2d');

  var STEP_MS = 1000 / 12;      // low frame rate on purpose, like the 16-bit originals
  var CELL = 1586 / 576;        // art pixels per sky-grid cell
  var toCells = function (art) { return art / CELL; };
  var random = function (min, max) { return min + Math.random() * (max - min); };
  var pick = function (items) { return items[Math.floor(Math.random() * items.length)]; };

  var BIRD_UP = ['x...x', '.x.x.', '..x..'];
  var BIRD_DOWN = ['.....', '..x..', 'xx.xx'];
  var BIRD_INK = '#2b2436';
  var SHELLS = [['#ffe29a', '#f08a3c'], ['#ff9d86', '#d8405a'], ['#a8efe2', '#3aa6a0'], ['#ffc9dc', '#e0609a'], ['#fff3cf', '#e0ae62']];
  var GLINTS = ['#b4d0ec', '#dcc8e4', '#f4d4ac'];

  var flocks = [], rockets = [], sparks = [], glints = [];
  var step = -1, nextFlock = 18, nextRocket = 14;
  var skyMask, seaMask;

  // How much daylight there is right now (1 day, 0 night), from the page's --day.
  function daylight() {
    var v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--day'));
    return isNaN(v) ? 1 : v;
  }

  function load(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = src;
    });
  }

  function seedGlints() {
    var w = seaCanvas.width, h = seaCanvas.height;
    sea.drawImage(seaMask, 0, 0);
    var water = sea.getImageData(0, 0, w, h).data;
    sea.clearRect(0, 0, w, h);
    for (var tries = 0; glints.length < 80 && tries < 4000; tries++) {
      var x = Math.floor(random(0, w)), y = Math.floor(random(0, h));
      if (!water[(y * w + x) * 4 + 3]) continue;
      glints.push({
        x: x, y: y,
        length: Math.round(random(3, 11)),
        height: Math.random() < 0.25 ? 2 : 1,
        phase: random(0, Math.PI * 2),
        periodMs: random(3200, 7000),
        drift: random(1.5, 4),
        alpha: random(0.1, 0.26),
        color: pick(GLINTS)
      });
    }
  }

  function launch() {
    rockets.push({ x: toCells(random(1010, 1275)), y: toCells(412), top: toCells(random(322, 372)), colors: pick(SHELLS), willow: Math.random() < 0.3 });
  }

  function burst(r) {
    var rings = r.willow ? [[30, 3.4]] : [[28, 4.4], [16, 2.5]];
    rings.forEach(function (ring) {
      var twist = random(0, Math.PI);
      for (var i = 0; i < ring[0]; i++) {
        var angle = twist + (i / ring[0]) * Math.PI * 2;
        sparks.push({
          x: r.x, y: r.y,
          vx: Math.cos(angle) * ring[1], vy: Math.sin(angle) * ring[1],
          age: 0,
          life: r.willow ? Math.round(random(22, 30)) : Math.round(random(14, 20)),
          colors: r.colors,
          gravity: r.willow ? 0.09 : 0.045
        });
      }
    });
  }

  function spawnFlock() {
    var dir = Math.random() < 0.5 ? 1 : -1;
    var count = Math.round(random(3, 5));
    var birds = [];
    for (var i = 0; i < count; i++) {
      birds.push({ dx: -dir * (i * random(7, 10)), dy: (i % 2 ? 1 : -1) * Math.ceil(i / 2) * random(3, 5), flap: Math.floor(random(0, 8)) });
    }
    flocks.push({ x: dir > 0 ? -12 : skyCanvas.width + 12, y: toCells(random(180, 330)), dir: dir, speed: random(1.1, 1.7), birds: birds, age: 0 });
  }

  function advance(day) {
    if (--nextFlock <= 0) {
      if (day > 0.3) spawnFlock();
      nextFlock = Math.round(random(130, 240));
    }
    if (--nextRocket <= 0) {
      if (day < 0.35) launch();
      nextRocket = Math.round(random(28, 62));
    }
    var width = skyCanvas.width;
    flocks.forEach(function (f) { f.x += f.dir * f.speed; f.age++; });
    flocks = flocks.filter(function (f) { return f.dir > 0 ? f.x < width + 60 : f.x > -60; });

    rockets.forEach(function (r) { r.y -= 3; if (r.y <= r.top) burst(r); });
    rockets = rockets.filter(function (r) { return r.y > r.top; });

    sparks.forEach(function (s) {
      s.x += s.vx; s.y += s.vy;
      s.vx *= 0.9; s.vy = s.vy * 0.9 + s.gravity;
      s.age++;
    });
    sparks = sparks.filter(function (s) { return s.age < s.life; });
  }

  function drawSky() {
    var c = sky, w = skyCanvas.width, h = skyCanvas.height;
    c.globalCompositeOperation = 'source-over';
    c.clearRect(0, 0, w, h);

    c.fillStyle = BIRD_INK;
    flocks.forEach(function (f) {
      f.birds.forEach(function (b, index) {
        var pose = (f.age + b.flap) % 8 < 4 ? BIRD_UP : BIRD_DOWN;
        var left = Math.round(f.x + b.dx);
        var top = Math.round(f.y + b.dy + Math.sin((f.age + index * 5) / 11) * 2);
        pose.forEach(function (row, ry) {
          for (var rx = 0; rx < row.length; rx++) {
            if (row[rx] === 'x') c.fillRect(left + (f.dir > 0 ? rx : 4 - rx), top + ry, 1, 1);
          }
        });
      });
    });

    rockets.forEach(function (r) {
      c.fillStyle = r.colors[0]; c.fillRect(Math.round(r.x), Math.round(r.y), 1, 2);
      c.fillStyle = r.colors[1]; c.fillRect(Math.round(r.x), Math.round(r.y) + 3, 1, 2);
    });

    sparks.forEach(function (s, index) {
      var spent = s.age / s.life;
      // Dying sparks flicker out in whole pixels, never by fading.
      if (spent > 0.6 && (index + step) % 2) return;
      var size = spent < 0.6 ? 2 : 1;
      if (spent < 0.7) {
        c.fillStyle = s.colors[1];
        c.fillRect(Math.round(s.x - s.vx * 1.5), Math.round(s.y - s.vy * 1.5), size, size);
      }
      c.fillStyle = spent < 0.45 ? s.colors[0] : s.colors[1];
      c.fillRect(Math.round(s.x), Math.round(s.y), size, size);
    });

    c.globalCompositeOperation = 'destination-in';
    c.drawImage(skyMask, 0, 0);
  }

  function drawSea(timeMs) {
    var c = sea, w = seaCanvas.width, h = seaCanvas.height;
    c.globalCompositeOperation = 'source-over';
    c.clearRect(0, 0, w, h);
    glints.forEach(function (g) {
      var wave = Math.sin((timeMs / g.periodMs) * Math.PI * 2 + g.phase);
      var level = Math.round(Math.max(0, wave) * 3) / 3;
      if (!level) return;
      var sway = Math.round(Math.cos((timeMs / g.periodMs) * Math.PI * 2 + g.phase) * g.drift);
      c.globalAlpha = g.alpha * level;
      c.fillStyle = g.color;
      c.fillRect(g.x + sway, g.y, g.length, g.height);
    });
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'destination-in';
    c.drawImage(seaMask, 0, 0);
  }

  var running = false, frame = 0;
  function render(timeMs) {
    if (!running) return;
    var s = Math.floor(timeMs / STEP_MS);
    if (s !== step) {
      var day = daylight();
      if (step >= 0) for (var i = Math.min(s - step, 12); i > 0; i--) advance(day);
      step = s;
      drawSky();
      drawSea(timeMs);
    }
    frame = requestAnimationFrame(render);
  }

  Promise.all([load(skyCanvas.dataset.mask), load(seaCanvas.dataset.mask)]).then(function (masks) {
    skyMask = masks[0];
    seaMask = masks[1];
    seedGlints();
    // Only animate while the scene is on screen.
    new IntersectionObserver(function (entries) {
      var visible = entries[0].isIntersecting;
      if (visible && !running) { running = true; frame = requestAnimationFrame(render); }
      if (!visible && running) { running = false; cancelAnimationFrame(frame); }
    }).observe(section);
  });
})();
