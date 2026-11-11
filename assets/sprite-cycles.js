/** Draw discrete, pre-rendered sprite cells. No interpolation or whole-art transforms. */
export class SpriteCycle {
  constructor({ canvas, host, allowed, once = false, onComplete = () => {} }) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.host = host;
    this.allowed = allowed;
    this.once = once;
    this.onComplete = onComplete;
    this.version = 0;
    this.elapsed = 0;
    this.frame = -1;
    this.tick = this.tick.bind(this);
    canvas.hidden = true;
  }

  async load(name) {
    const version = ++this.version;
    this.ready = false;
    this.pause();
    try {
      const response = await fetch(new URL(`./cycles/${name}.json?v=short-curls`, import.meta.url));
      if (!response.ok) throw new Error(`Could not load ${name} animation`);
      const sheet = await response.json();
      const image = new Image();
      image.src = new URL(sheet.image, response.url).href;
      await image.decode();
      let base = null;
      const canvasWidth = sheet.canvasWidth || sheet.frameWidth;
      const canvasHeight = sheet.canvasHeight || sheet.frameHeight;
      if (sheet.base) {
        base = new Image();
        base.src = new URL(sheet.base, response.url).href;
        await base.decode();
        if (base.naturalWidth !== canvasWidth || base.naturalHeight !== canvasHeight) {
          throw new Error(`Invalid base image: ${name}`);
        }
      }
      if (version !== this.version) return false;
      if (!Number.isInteger(sheet.frames) || sheet.frames < 1 || image.naturalWidth !== sheet.frameWidth * sheet.columns ||
          image.naturalHeight !== sheet.frameHeight * Math.ceil(sheet.frames / sheet.columns)) {
        throw new Error(`Invalid sprite sheet: ${name}`);
      }
      if (sheet.patch && (!base || sheet.patch.x < 0 || sheet.patch.y < 0 ||
          sheet.patch.x + sheet.frameWidth > canvasWidth || sheet.patch.y + sheet.frameHeight > canvasHeight)) {
        throw new Error(`Invalid sprite patch: ${name}`);
      }
      const timeline = sheet.sequence || Array.from({ length: sheet.frames }, (_, frame) => ({ frame, durationMs: sheet.frameMs }));
      if (!timeline.length || timeline.some(step => !Number.isInteger(step.frame) || step.frame < 0 ||
          step.frame >= sheet.frames || !Number.isFinite(step.durationMs) || step.durationMs <= 0)) {
        throw new Error(`Invalid sprite timing: ${name}`);
      }
      this.sheet = sheet;
      this.image = image;
      this.base = base;
      this.timeline = timeline;
      this.duration = timeline.reduce((total, step) => total + step.durationMs, 0);
      this.canvas.width = canvasWidth;
      this.canvas.height = canvasHeight;
      this.context.imageSmoothingEnabled = false;
      this.canvas.dataset.cycle = name;
      this.canvas.dataset.frames = sheet.frames;
      this.ready = true;
      this.restart();
      return true;
    } catch (error) {
      if (version === this.version) console.warn(error.message);
      return false;
    }
  }

  restart() {
    this.elapsed = 0;
    this.lastTime = null;
    this.complete = false;
    this.frame = -1;
    if (this.ready) this.draw(0);
    this.sync();
  }

  draw(index) {
    if (index === this.frame) return;
    const { frameWidth: frameWidth, frameHeight: frameHeight, columns, patch } = this.sheet;
    const { width, height } = this.canvas;
    this.context.clearRect(0, 0, width, height);
    if (this.base) this.context.drawImage(this.base, 0, 0, width, height);
    for (const region of this.sheet.clear || []) {
      this.context.clearRect(region.x, region.y, region.width, region.height);
    }
    this.context.drawImage(this.image, index % columns * frameWidth, Math.floor(index / columns) * frameHeight,
      frameWidth, frameHeight, patch?.x || 0, patch?.y || 0, frameWidth, frameHeight);
    this.frame = index;
    this.canvas.dataset.frame = index;
  }

  tick(time) {
    this.request = null;
    if (!this.ready || this.complete || !this.allowed()) return this.pause();
    if (this.lastTime !== null) this.elapsed += time - this.lastTime;
    this.lastTime = time;
    if (this.once && this.elapsed >= this.duration) {
      this.complete = true;
      this.pause();
      this.onComplete();
      return;
    }
    let phase = this.elapsed % this.duration;
    let pose = this.timeline[0].frame;
    for (const step of this.timeline) {
      pose = step.frame;
      if (phase < step.durationMs) break;
      phase -= step.durationMs;
    }
    this.draw(pose);
    this.request = requestAnimationFrame(this.tick);
  }

  pause() {
    if (this.request != null) cancelAnimationFrame(this.request);
    this.request = null;
    this.lastTime = null;
    this.canvas.hidden = true;
    this.host?.classList.remove('has-cycle');
  }

  sync() {
    if (!this.ready || this.complete || !this.allowed()) return this.pause();
    this.canvas.hidden = false;
    this.host?.classList.add('has-cycle');
    if (this.request == null) this.request = requestAnimationFrame(this.tick);
  }
}
