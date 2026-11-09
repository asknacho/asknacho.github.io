import { CSSProperties, ReactNode, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Effects } from './Effects';
import { QuestWindow } from './QuestWindow';
import { SpriteLayer } from './SpriteLayer';
import { createDirector } from './director';
import { CARD_SPOTS, CITY_SPOT, QUESTS, QuestId, SCENE_SPOTS, STRIP_SPOTS, Spot } from './quests';
import { BACKGROUND_URL, LoadedSprite, REFERENCE_URL, asset, loadLayers } from './sprites';
import { useAnimationClock, usePrefersReducedMotion } from './useAnimationClock';

const STORAGE_KEY = 'ask-nacho-animations';
const ART_W = 1586;
const ART_H = 992;
type Box = [number, number, number, number];

/** How far the family moves right on phones, in art pixels. */
const PHONE_SHIFT = 532;
/** Left edge of the phone window; the Sagrada Família lands between the heart and the baby's bubble. */
const PHONE_VIEW_X = 562;
/** Pieces the phone layout moves or patches; cut by tools/extract_phone.py. */
const PHONE_PIECES: Record<'guitar' | 'keyboard' | 'bubble' | 'bubbleFix', Box> = {
  guitar: [110, 311, 117, 213],
  keyboard: [399, 374, 92, 154],
  bubble: [848, 335, 99, 90],
  bubbleFix: [836, 323, 123, 114],
};

const readEnabled = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
};

const PHONE = '(max-width: 720px)';
const subscribePhone = (notify: () => void) => {
  const media = window.matchMedia(PHONE);
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
};
const usePhone = () => useSyncExternalStore(subscribePhone, () => window.matchMedia(PHONE).matches);

const place = ([x, y, w, h]: Box): CSSProperties => ({
  left: `${(x / ART_W) * 100}%`,
  top: `${(y / ART_H) * 100}%`,
  width: `${(w / ART_W) * 100}%`,
  height: `${(h / ART_H) * 100}%`,
});

/** Shows one window onto the art. Layers stay in art coordinates, whatever the crop. */
function Stage({ view, children }: { view: Box; children: ReactNode }) {
  const [x, y, w, h] = view;
  return (
    <div className="window" style={{ aspectRatio: `${w} / ${h}` }}>
      <div
        className="stage stage--cropped"
        style={{
          width: `${(ART_W / w) * 100}%`,
          height: `${(ART_H / h) * 100}%`,
          left: `${(-x / w) * 100}%`,
          top: `${(-y / h) * 100}%`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** A piece of the original art as a phone-sized button. */
const sliceStyle = ([x, y, w, h]: Box): CSSProperties => ({
  aspectRatio: `${w} / ${h}`,
  backgroundImage: `url(${REFERENCE_URL})`,
  backgroundSize: `${(ART_W / w) * 100}% auto`,
  backgroundPosition: `${(x / (ART_W - w)) * 100}% ${(y / (ART_H - h)) * 100}%`,
});

export function Scene() {
  const [sprites, setSprites] = useState<LoadedSprite[]>([]);
  const [enabled, setEnabled] = useState(readEnabled);
  const [open, setOpen] = useState<QuestId>();
  const reducedMotion = usePrefersReducedMotion();
  const phone = usePhone();
  const director = useMemo(() => createDirector(sprites), [sprites]);
  const running = enabled && !reducedMotion && sprites.length > 0;

  useEffect(() => {
    let live = true;
    loadLayers().then((loaded) => {
      if (live) setSprites(loaded);
    });
    return () => {
      live = false;
    };
  }, []);

  useAnimationClock(running, (time) => director.tick(time));

  // Stopped characters rest on the original pose.
  useEffect(() => {
    if (!running) director.pose(0);
  }, [running, director]);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off');
    } catch {
      // The choice just won't outlive this visit.
    }
  };

  const close = useCallback(() => setOpen(undefined), []);
  const choose = (quest: QuestId) => setOpen((current) => (current === quest ? undefined : quest));

  const spot = ({ quest, label, box }: Spot) => (
    <button
      key={`${quest}-${box[0]}-${box[1]}`}
      className={open === quest ? 'spot spot--on' : 'spot'}
      style={place(box)}
      aria-label={label}
      onClick={() => choose(quest)}
    />
  );

  const slice = ({ quest, label, slice: box }: Spot) => (
    <button
      key={`${quest}-${box![0]}`}
      className={open === quest ? 'slice slice--on' : 'slice'}
      style={sliceStyle(box!)}
      aria-label={label}
      onClick={() => choose(quest)}
    />
  );

  const layers = (
    <>
      {sprites.map((sprite) => (
        <SpriteLayer key={sprite.sheet.id} sprite={sprite} director={director} />
      ))}
    </>
  );
  const quest = open && <QuestWindow key={open} quest={QUESTS[open]} onClose={close} />;

  return (
    <main className="page">
      <h1 className="visually-hidden">
        Ask Nacho to level up your idea. Ignacio Morales, engineering manager and hands-on software engineer in Barcelona.
      </h1>
      <nav className="scene-nav" aria-label="Quick links">
        <p>Engineering manager · Barcelona</p>
        <a href="https://www.linkedin.com/in/ignaciomoralesm" target="_blank" rel="noopener">LinkedIn →</a>
        <a href="https://github.com/asknacho" target="_blank" rel="noopener">GitHub →</a>
        <a href="https://scorepace.com" target="_blank" rel="noopener">Play ScorePace →</a>
        <p className="scene-nav__hint">Select a character or card to explore.</p>
      </nav>
      {phone ? (
        <>
          <div className="slice slice--static" style={sliceStyle([225, 6, 560, 84])} />
          <div className="slice slice--static" style={sliceStyle([570, 108, 830, 200])} />
          {/* The family steps over to the city: same art, same pixels, shifted a whole number of them. */}
          <Stage view={[PHONE_VIEW_X, 170, 960, 395]}>
            <img className="stage__art" src={BACKGROUND_URL} alt="" />
            <img className="sprite" style={place([596, 165, 800, 142])} src={asset('sprites/no-title-wide.png')} alt="" />
            <img className="sprite" style={place(PHONE_PIECES.bubbleFix)} src={asset('sprites/bubble-fix.png')} alt="" />
            <Effects running={running} />
            {spot(CITY_SPOT)}
            <div className="shifted" style={{ left: `${(PHONE_SHIFT / ART_W) * 100}%` }}>
              <img className="sprite" style={place(PHONE_PIECES.guitar)} src={asset('sprites/guitar.png')} alt="" />
              <img className="sprite" style={place(PHONE_PIECES.keyboard)} src={asset('sprites/keyboard.png')} alt="" />
              <img className="sprite" style={place(PHONE_PIECES.bubble)} src={asset('sprites/bubble.png')} alt="" />
              {layers}
              {SCENE_SPOTS.map(spot)}
            </div>
          </Stage>
          <div className="cards">{CARD_SPOTS.map(slice)}</div>
          <div className="strip">{STRIP_SPOTS.map(slice)}</div>
          {quest}
        </>
      ) : (
        <Stage view={[0, 0, ART_W, ART_H]}>
          <img className="stage__art" src={BACKGROUND_URL} alt="" />
          <Effects running={running} />
          {layers}
          {[...SCENE_SPOTS, CITY_SPOT, ...CARD_SPOTS, ...STRIP_SPOTS].map(spot)}
          {quest}
        </Stage>
      )}
      <button className="motion-toggle" onClick={toggle} disabled={reducedMotion} aria-pressed={enabled && !reducedMotion}>
        {reducedMotion ? 'Motion off (system setting)' : enabled ? 'Pause animation' : 'Play animation'}
      </button>
    </main>
  );
}
