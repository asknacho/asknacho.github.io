export interface BlinkTiming {
  /** Sheet row holding the closed-eye pose. */
  row: number;
  minGapMs: number;
  maxGapMs: number;
  closedMs: number;
}

export interface SpriteSheet {
  id: string;
  image: string;
  frameWidth: number;
  frameHeight: number;
  frames: number;
  durationMs: number;
  /** Top-left of a frame in scene pixels. */
  x: number;
  y: number;
  sceneWidth: number;
  sceneHeight: number;
  /** Where this sprite starts in its loop, so similar sprites never march together. */
  phaseMs?: number;
  blink?: BlinkTiming;
}

export const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const REFERENCE_URL = asset('reference.webp');
export const BACKGROUND_URL = asset('sprites/background.png');

/** Back to front. Every layer has its own sheet and its own clock. */
export const LAYERS = [
  { id: 'male', label: 'Nacho, breathing gently' },
  { id: 'woman', label: 'His wife, rocking gently' },
  { id: 'heart', label: 'A floating heart bubble' },
  { id: 'girl', label: 'His daughter, tilting her head and blinking' },
  { id: 'baby', label: 'The baby, breathing in his sleep' },
  { id: 'z1', label: '' },
  { id: 'z2', label: '' },
  { id: 'z3', label: '' },
] as const;

export const loadImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${url}`));
    image.src = url;
  });

export interface LoadedSprite {
  sheet: SpriteSheet;
  image: HTMLImageElement;
  label: string;
}

async function loadSprite(id: string, label: string): Promise<LoadedSprite> {
  const response = await fetch(asset(`sprites/${id}.json`));
  if (!response.ok) throw new Error(`Could not load the ${id} metadata`);
  const sheet = (await response.json()) as SpriteSheet;
  return { sheet, label, image: await loadImage(asset(sheet.image)) };
}

export const loadLayers = () => Promise.all(LAYERS.map(({ id, label }) => loadSprite(id, label)));

export const frameAt = (sheet: SpriteSheet, timeMs: number) =>
  Math.floor(((timeMs + (sheet.phaseMs ?? 0)) / sheet.durationMs) * sheet.frames) % sheet.frames;
