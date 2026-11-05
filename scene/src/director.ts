import { SpriteLayerHandle } from './SpriteLayer';
import { BlinkTiming, LoadedSprite, frameAt } from './sprites';

/** Irregular blinks, on a schedule of their own that ignores the head's loop. */
function createBlink(timing: BlinkTiming) {
  const gap = () => timing.minGapMs + Math.random() * (timing.maxGapMs - timing.minGapMs);
  let nextAt = gap();
  return (timeMs: number) => {
    if (timeMs < nextAt) return 0;
    if (timeMs < nextAt + timing.closedMs) return timing.row;
    nextAt = timeMs + gap();
    return 0;
  };
}

/** Plays every layer from one clock. Several canvases can show the same layer, as the bench does. */
export function createDirector(sprites: LoadedSprite[]) {
  const views = new Map<string, Set<SpriteLayerHandle>>();
  const blinks = new Map(
    sprites.flatMap(({ sheet }) => (sheet.blink ? [[sheet.id, createBlink(sheet.blink)] as const] : [])),
  );
  const show = (id: string, frame: number, row = 0) => views.get(id)?.forEach((view) => view.draw(frame, row));

  return {
    attach(id: string, view: SpriteLayerHandle) {
      if (!views.has(id)) views.set(id, new Set());
      views.get(id)!.add(view);
      return () => void views.get(id)!.delete(view);
    },
    tick(timeMs: number) {
      for (const { sheet } of sprites) show(sheet.id, frameAt(sheet, timeMs), blinks.get(sheet.id)?.(timeMs) ?? 0);
    },
    /** Puts everyone on one frame index: 0 is the original pose. */
    pose(step: number) {
      for (const { sheet } of sprites) show(sheet.id, step % sheet.frames);
    },
  };
}

export type Director = ReturnType<typeof createDirector>;
