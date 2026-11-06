export interface EffectsConfig {
  grid: { width: number; height: number };
  sea: { x: number; y: number; width: number; height: number };
  noTitle: { x: number; y: number; width: number; height: number };
}

const STEP_MS = 1000 / 12; // low frame rate on purpose, like the 16-bit originals
const CELL = 1586 / 576; // art pixels per grid cell

const random = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];
const toCells = (art: number) => art / CELL;

const BIRD_UP = ['x...x', '.x.x.', '..x..'];
const BIRD_DOWN = ['.....', '..x..', 'xx.xx'];
const BIRD_INK = '#2b2436';

const SHELLS = [
  ['#ffe29a', '#f08a3c'],
  ['#ff9d86', '#d8405a'],
  ['#a8efe2', '#3aa6a0'],
  ['#ffc9dc', '#e0609a'],
  ['#fff3cf', '#e0ae62'],
];

const GLINTS = ['#b4d0ec', '#dcc8e4', '#f4d4ac'];

interface Bird { dx: number; dy: number; flap: number }
interface Flock { x: number; y: number; dir: 1 | -1; speed: number; birds: Bird[]; age: number }
interface Rocket { x: number; y: number; top: number; colors: string[]; willow: boolean }
interface Spark { x: number; y: number; vx: number; vy: number; age: number; life: number; colors: string[]; gravity: number }
interface Glint { x: number; y: number; length: number; height: number; phase: number; periodMs: number; drift: number; alpha: number; color: string }

/** Birds, fireworks and sea glints. Each is masked so it stays behind the title, tree, city and hill. */
export class BackgroundEffects {
  private sky: CanvasRenderingContext2D;
  private sea: CanvasRenderingContext2D;
  private flocks: Flock[] = [];
  private rockets: Rocket[] = [];
  private sparks: Spark[] = [];
  private glints: Glint[] = [];
  private step = -1;
  private nextFlock = 18;
  private nextRocket = 14;

  constructor(
    skyCanvas: HTMLCanvasElement,
    seaCanvas: HTMLCanvasElement,
    private skyMask: HTMLImageElement,
    private seaMask: HTMLImageElement,
  ) {
    this.sky = skyCanvas.getContext('2d')!;
    this.sea = seaCanvas.getContext('2d')!;
    this.seedGlints();
  }

  private seedGlints() {
    const { width, height } = this.sea.canvas;
    this.sea.drawImage(this.seaMask, 0, 0);
    const water = this.sea.getImageData(0, 0, width, height).data;
    this.sea.clearRect(0, 0, width, height);
    for (let tries = 0; this.glints.length < 80 && tries < 4000; tries++) {
      const x = Math.floor(random(0, width));
      const y = Math.floor(random(0, height));
      if (!water[(y * width + x) * 4 + 3]) continue;
      this.glints.push({
        x, y,
        length: Math.round(random(3, 11)),
        height: Math.random() < 0.25 ? 2 : 1,
        phase: random(0, Math.PI * 2),
        periodMs: random(3200, 7000),
        drift: random(1.5, 4),
        alpha: random(0.1, 0.26),
        color: pick(GLINTS),
      });
    }
  }

  private launch() {
    const x = toCells(random(1010, 1275));
    const top = toCells(random(322, 372));
    this.rockets.push({ x, y: toCells(412), top, colors: pick(SHELLS), willow: Math.random() < 0.3 });
  }

  private burst({ x, y, colors, willow }: Rocket) {
    const rings = willow ? [[30, 3.4]] : [[28, 4.4], [16, 2.5]];
    for (const [count, speed] of rings) {
      const twist = random(0, Math.PI);
      for (let i = 0; i < count; i++) {
        const angle = twist + (i / count) * Math.PI * 2;
        this.sparks.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          age: 0,
          life: willow ? Math.round(random(22, 30)) : Math.round(random(14, 20)),
          colors,
          gravity: willow ? 0.09 : 0.045,
        });
      }
    }
  }

  private spawnFlock() {
    const dir = Math.random() < 0.5 ? 1 : -1;
    const count = Math.round(random(3, 5));
    const speed = random(1.1, 1.7);
    const birds = Array.from({ length: count }, (_, i) => ({
      dx: -dir * (i * random(7, 10)),
      dy: (i % 2 ? 1 : -1) * Math.ceil(i / 2) * random(3, 5),
      flap: Math.floor(random(0, 8)),
    }));
    const { width } = this.sky.canvas;
    this.flocks.push({ x: dir > 0 ? -12 : width + 12, y: toCells(random(150, 330)), dir, speed, birds, age: 0 });
  }

  private advance() {
    if (--this.nextFlock <= 0) {
      this.spawnFlock();
      this.nextFlock = Math.round(random(130, 240));
    }
    if (--this.nextRocket <= 0) {
      this.launch();
      this.nextRocket = Math.round(random(28, 62));
    }
    const { width } = this.sky.canvas;
    for (const flock of this.flocks) {
      flock.x += flock.dir * flock.speed;
      flock.age++;
    }
    this.flocks = this.flocks.filter(({ x, dir }) => (dir > 0 ? x < width + 60 : x > -60));

    for (const rocket of this.rockets) {
      rocket.y -= 3;
      if (rocket.y <= rocket.top) this.burst(rocket);
    }
    this.rockets = this.rockets.filter(({ y, top }) => y > top);

    for (const spark of this.sparks) {
      spark.x += spark.vx;
      spark.y += spark.vy;
      spark.vx *= 0.9;
      spark.vy = spark.vy * 0.9 + spark.gravity;
      spark.age++;
    }
    this.sparks = this.sparks.filter(({ age, life }) => age < life);
  }

  private drawSky() {
    const context = this.sky;
    const { width, height } = context.canvas;
    context.globalCompositeOperation = 'source-over';
    context.clearRect(0, 0, width, height);

    context.fillStyle = BIRD_INK;
    for (const { x, y, age, birds, dir } of this.flocks) {
      birds.forEach(({ dx, dy, flap }, index) => {
        const pose = (age + flap) % 8 < 4 ? BIRD_UP : BIRD_DOWN;
        const left = Math.round(x + dx);
        const top = Math.round(y + dy + Math.sin((age + index * 5) / 11) * 2);
        pose.forEach((row, ry) => {
          [...row].forEach((cell, rx) => {
            if (cell === 'x') context.fillRect(left + (dir > 0 ? rx : 4 - rx), top + ry, 1, 1);
          });
        });
      });
    }

    for (const { x, y, colors } of this.rockets) {
      context.fillStyle = colors[0];
      context.fillRect(Math.round(x), Math.round(y), 1, 2);
      context.fillStyle = colors[1];
      context.fillRect(Math.round(x), Math.round(y) + 3, 1, 2);
    }

    this.sparks.forEach(({ x, y, vx, vy, age, life, colors }, index) => {
      const spent = age / life;
      // Dying sparks flicker out in whole pixels, never by fading.
      if (spent > 0.6 && (index + this.step) % 2) return;
      const size = spent < 0.6 ? 2 : 1;
      if (spent < 0.7) {
        context.fillStyle = colors[1];
        context.fillRect(Math.round(x - vx * 1.5), Math.round(y - vy * 1.5), size, size);
      }
      context.fillStyle = spent < 0.45 ? colors[0] : colors[1];
      context.fillRect(Math.round(x), Math.round(y), size, size);
    });

    context.globalCompositeOperation = 'destination-in';
    context.drawImage(this.skyMask, 0, 0);
  }

  private drawSea(timeMs: number) {
    const context = this.sea;
    const { width, height } = context.canvas;
    context.globalCompositeOperation = 'source-over';
    context.clearRect(0, 0, width, height);
    for (const glint of this.glints) {
      const wave = Math.sin((timeMs / glint.periodMs) * Math.PI * 2 + glint.phase);
      const level = Math.round(Math.max(0, wave) * 3) / 3;
      if (!level) continue;
      const sway = Math.round(Math.cos((timeMs / glint.periodMs) * Math.PI * 2 + glint.phase) * glint.drift);
      context.globalAlpha = glint.alpha * level;
      context.fillStyle = glint.color;
      context.fillRect(glint.x + sway, glint.y, glint.length, glint.height);
    }
    context.globalAlpha = 1;
    context.globalCompositeOperation = 'destination-in';
    context.drawImage(this.seaMask, 0, 0);
  }

  render(timeMs: number) {
    const step = Math.floor(timeMs / STEP_MS);
    if (step === this.step) return;
    if (this.step >= 0) for (let i = Math.min(step - this.step, 12); i > 0; i--) this.advance();
    this.step = step;
    this.drawSky();
    this.drawSea(timeMs);
  }

  clear() {
    for (const context of [this.sky, this.sea]) {
      context.globalCompositeOperation = 'source-over';
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    }
  }
}
