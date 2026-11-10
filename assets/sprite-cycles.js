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
      const response = await fetch(new URL(`./cycles/${name}.json`, import.meta.url));
      if (!response.ok) throw new Error(`Could not load ${name} animation`);
      const sheet = await response.json();
      const image = new Image();
      image.src = new URL(sheet.image, response.url).href;
      await image.decode();
      let base = null;
      if (sheet.base) {
        base = new Image();
        base.src = new URL(sheet.base, response.url).href;
        await base.decode();
        if (base.naturalWidth !== sheet.frameWidth || base.naturalHeight !== sheet.frameHeight) {
          throw new Error(`Invalid base image: ${name}`);
        }
      }
      if (version !== this.version) return false;
      if (sheet.frames !== 12 || image.naturalWidth !== sheet.frameWidth * sheet.columns ||
          image.naturalHeight !== sheet.frameHeight * Math.ceil(sheet.frames / sheet.columns)) {
        throw new Error(`Invalid 12-frame sheet: ${name}`);
      }
      this.sheet = sheet;
      this.image = image;
      this.base = base;
      this.canvas.width = sheet.frameWidth;
      this.canvas.height = sheet.frameHeight;
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
    const { frameWidth: width, frameHeight: height, columns } = this.sheet;
    this.context.clearRect(0, 0, width, height);
    if (this.base) this.context.drawImage(this.base, 0, 0, width, height);
    for (const region of this.sheet.clear || []) {
      this.context.clearRect(region.x, region.y, region.width, region.height);
    }
    this.context.drawImage(this.image, index % columns * width, Math.floor(index / columns) * height,
      width, height, 0, 0, width, height);
    this.frame = index;
    this.canvas.dataset.frame = index;
  }

  tick(time) {
    this.request = null;
    if (!this.ready || this.complete || !this.allowed()) return this.pause();
    if (this.lastTime !== null) this.elapsed += time - this.lastTime;
    this.lastTime = time;
    const index = Math.floor(this.elapsed / this.sheet.frameMs);
    if (this.once && index >= this.sheet.frames) {
      this.complete = true;
      this.pause();
      this.onComplete();
      return;
    }
    this.draw(index % this.sheet.frames);
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
