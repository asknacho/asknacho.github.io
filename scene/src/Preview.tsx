import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Effects } from './Effects';
import { SpriteLayer } from './SpriteLayer';
import { createDirector } from './director';
import { BACKGROUND_URL, LoadedSprite, REFERENCE_URL, loadLayers } from './sprites';
import { useAnimationClock } from './useAnimationClock';

const Panel = ({ title, note, children }: { title: string; note?: string; children: ReactNode }) => (
  <section className="panel">
    <h2>{title}</h2>
    {note && <p>{note}</p>}
    {children}
  </section>
);

export function Preview() {
  const [sprites, setSprites] = useState<LoadedSprite[]>([]);
  useEffect(() => {
    loadLayers().then(setSprites);
  }, []);
  return sprites.length ? <Bench sprites={sprites} /> : <p className="bench__loading">Loading sprites…</p>;
}

function Bench({ sprites }: { sprites: LoadedSprite[] }) {
  const [playing, setPlaying] = useState(true);
  const [step, setStep] = useState(0);
  const [overlay, setOverlay] = useState(0);
  const [slow, setSlow] = useState(1);
  const director = useMemo(() => createDirector(sprites), [sprites]);

  useAnimationClock(playing, (time) => director.tick(time / slow));

  const nudge = (by: number) => {
    setPlaying(false);
    const next = (step + by + 48) % 48;
    setStep(next);
    director.pose(next);
  };

  return (
    <main className="bench">
      <header className="bench__head">
        <h1>Sprite bench</h1>
        <div className="bench__controls">
          <button onClick={() => setPlaying(!playing)}>{playing ? 'Pause' : 'Play'}</button>
          <button onClick={() => nudge(-1)}>Previous frame</button>
          <button onClick={() => nudge(1)}>Next frame</button>
          <button onClick={() => { setPlaying(false); setStep(0); director.pose(0); }}>Original pose</button>
          <label>
            Speed
            <select value={slow} onChange={(event) => setSlow(Number(event.target.value))}>
              <option value={1}>Normal</option>
              <option value={4}>¼ speed</option>
            </select>
          </label>
          <label>
            Original on top
            <input
              type="range" min={0} max={1} step={0.05} value={overlay}
              onChange={(event) => setOverlay(Number(event.target.value))}
            />
          </label>
        </div>
      </header>

      <Panel title="Final scene" note="Background plus every live sprite. Slide “Original on top” to compare.">
        <div className="stage">
          <img className="stage__art" src={BACKGROUND_URL} alt="" />
          <Effects running={playing} />
          {sprites.map((sprite) => (
            <SpriteLayer key={sprite.sheet.id} sprite={sprite} director={director} />
          ))}
          <img className="stage__art stage__art--overlay" src={REFERENCE_URL} alt="" style={{ opacity: overlay }} />
        </div>
      </Panel>

      <div className="bench__grid">
        <Panel title="Original illustration">
          <img className="bench__img" src={REFERENCE_URL} alt="Original illustration" />
        </Panel>
        <Panel title="Reconstructed background">
          <img className="bench__img" src={BACKGROUND_URL} alt="Background with the family removed" />
        </Panel>
      </div>

      <h2 className="bench__section">Extracted layers</h2>
      <div className="bench__sprites">
        {sprites.map(({ sheet, image }) => (
          <Panel key={sheet.id} title={sheet.id}>
            <div className="checker">
              <canvas
                className="sprite sprite--isolated"
                width={sheet.frameWidth}
                height={sheet.frameHeight}
                ref={(node) => node?.getContext('2d')?.drawImage(image, 0, 0)}
              />
            </div>
          </Panel>
        ))}
      </div>

      <h2 className="bench__section">Each animation in isolation</h2>
      <div className="bench__sprites">
        {sprites.map((sprite) => (
          <Panel key={sprite.sheet.id} title={sprite.sheet.id} note={`${sprite.sheet.frames} frames, ${sprite.sheet.durationMs / 1000}s`}>
            <div className="checker">
              <SpriteLayer sprite={sprite} director={director} isolated />
            </div>
          </Panel>
        ))}
      </div>
    </main>
  );
}
