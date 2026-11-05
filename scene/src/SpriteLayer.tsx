import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Director } from './director';
import { LoadedSprite } from './sprites';

export interface SpriteLayerHandle {
  draw(frame: number, row?: number): void;
}

interface Props {
  sprite: LoadedSprite;
  director?: Director;
  /** Crop to the frame instead of placing it in the scene. */
  isolated?: boolean;
}

/** One layer on its own canvas, drawn at native size and scaled by CSS with no smoothing. */
export function SpriteLayer({ sprite, director, isolated }: Props) {
  const { sheet, image, label } = sprite;
  const canvas = useRef<HTMLCanvasElement>(null);

  const view = useMemo<SpriteLayerHandle>(() => {
    let shown = '';
    return {
      draw(frame, row = 0) {
        const key = `${frame}:${row}`;
        const context = canvas.current?.getContext('2d');
        if (!context || key === shown) return;
        shown = key;
        context.imageSmoothingEnabled = false;
        context.clearRect(0, 0, sheet.frameWidth, sheet.frameHeight);
        context.drawImage(
          image,
          frame * sheet.frameWidth, row * sheet.frameHeight, sheet.frameWidth, sheet.frameHeight,
          0, 0, sheet.frameWidth, sheet.frameHeight,
        );
      },
    };
  }, [image, sheet]);

  useLayoutEffect(() => view.draw(0), [view]);
  useEffect(() => director?.attach(sheet.id, view), [director, sheet.id, view]);

  const placed = {
    left: `${(sheet.x / sheet.sceneWidth) * 100}%`,
    top: `${(sheet.y / sheet.sceneHeight) * 100}%`,
    width: `${(sheet.frameWidth / sheet.sceneWidth) * 100}%`,
    height: `${(sheet.frameHeight / sheet.sceneHeight) * 100}%`,
  };

  return (
    <canvas
      ref={canvas}
      className={isolated ? 'sprite sprite--isolated' : 'sprite'}
      width={sheet.frameWidth}
      height={sheet.frameHeight}
      style={isolated ? undefined : placed}
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
    />
  );
}
