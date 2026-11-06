import { useEffect, useRef } from 'react';
import { Quest } from './quests';

export function QuestWindow({ quest, onClose }: { quest: Quest; onClose(): void }) {
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    close.current?.focus();
    return () => opener?.focus();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <dialog className="quest" open aria-labelledby="quest-title">
      <button ref={close} className="quest__close" onClick={onClose} aria-label="Close">
        ×
      </button>
      <h2 id="quest-title">{quest.title}</h2>
      <p className="quest__kind">{quest.kind}</p>
      <p className="quest__bio">{quest.bio}</p>
      {quest.stats.map(([name, value]) => (
        <div className="stat" key={name}>
          <span>{name}</span>
          <div className={value < 25 ? 'meter meter--low' : 'meter'}>
            <i style={{ width: `${value}%` }} />
          </div>
          <span>{value}</span>
        </div>
      ))}
      <p className="quest__weak">
        <b>Weak to:</b> {quest.weakTo}
      </p>
      {quest.links.length > 0 && (
        <div className="quest__links">
          {quest.links.map(([label, href]) => (
            <a key={href} href={href} target="_blank" rel="noopener">
              {label}
            </a>
          ))}
        </div>
      )}
    </dialog>
  );
}
