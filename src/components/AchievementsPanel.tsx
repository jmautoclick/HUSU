import type { AppData } from '../lib/types';
import { ACHIEVEMENTS } from '../lib/achievements';

interface Props {
  data: AppData;
}

export function AchievementsPanel({ data }: Props) {
  const unlocked = new Set(data.achievements.map(a => a.id));

  return (
    <div className="card" style={{ marginTop: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>🏅 Logros</div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{unlocked.size}/{ACHIEVEMENTS.length}</div>
      </div>
      <div className="badges-grid">
        {ACHIEVEMENTS.map(a => {
          const got = unlocked.has(a.id);
          return (
            <div key={a.id} className={`badge ${got ? 'unlocked' : 'locked'}`}>
              <div className="badge-emoji">{got ? a.emoji : '🔒'}</div>
              <div className="badge-title">{a.title}</div>
              <div className="badge-desc">{a.description}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
