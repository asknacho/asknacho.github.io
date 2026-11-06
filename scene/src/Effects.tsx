import { CSSProperties, useEffect, useRef, useState } from 'react';
import { BackgroundEffects, EffectsConfig } from './backgroundEffects';
import { asset, loadImage } from './sprites';
import { useAnimationClock } from './useAnimationClock';

interface Assets {
  config: EffectsConfig;
  skyMask: HTMLImageElement;
  seaMask: HTMLImageElement;
}

let assets: Promise<Assets> | undefined;

const loadAssets = () =>
  (assets ??= Promise.all([
    fetch(asset('sprites/effects.json')).then((response) => response.json() as Promise<EffectsConfig>),
    loadImage(asset('sprites/sky-mask.png')),
    loadImage(asset('sprites/sea-mask.png')),
  ]).then(([config, skyMask, seaMask]) => ({ config, skyMask, seaMask })));

const percent = (part: number, whole: number) => `${(part / whole) * 100}%`;

/** Birds, fireworks and sea glints, between the background and the characters. */
export function Effects({ running }: { running: boolean }) {
  const [loaded, setLoaded] = useState<Assets>();
  useEffect(() => {
    let live = true;
    loadAssets().then((value) => live && setLoaded(value));
    return () => {
      live = false;
    };
  }, []);
  return loaded ? <Layers assets={loaded} running={running} /> : null;
}

function Layers({ assets: { config, skyMask, seaMask }, running }: { assets: Assets; running: boolean }) {
  const sky = useRef<HTMLCanvasElement>(null);
  const sea = useRef<HTMLCanvasElement>(null);
  const effects = useRef<BackgroundEffects>(undefined);

  useEffect(() => {
    effects.current = new BackgroundEffects(sky.current!, sea.current!, skyMask, seaMask);
    return () => effects.current?.clear();
  }, [skyMask, seaMask]);

  useAnimationClock(running, (time) => effects.current?.render(time));

  useEffect(() => {
    if (!running) effects.current?.clear();
  }, [running]);

  const seaPlace: CSSProperties = {
    left: percent(config.sea.x, 1586),
    top: percent(config.sea.y, 992),
    width: percent(config.sea.width, 1586),
    height: percent(config.sea.height, 992),
  };

  return (
    <>
      <canvas ref={sea} className="sprite" style={seaPlace} width={config.sea.width} height={config.sea.height} aria-hidden />
      <canvas ref={sky} className="stage__art" width={config.grid.width} height={config.grid.height} aria-hidden />
    </>
  );
}
