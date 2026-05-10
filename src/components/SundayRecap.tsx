import { useMemo, useState } from 'react';
import type { AppData } from '../lib/types';
import { lastWeekRecap } from '../lib/recap';
import { shareRecap } from '../lib/share-card';
import { colorFor } from '../lib/colors';

interface Props {
  data: AppData;
  onDismiss: () => void;
}

export function SundayRecap({ data, onDismiss }: Props) {
  const recap = useMemo(() => lastWeekRecap(data), [data]);
  const [sharing, setSharing] = useState(false);
  const ratePct = Math.round(recap.rate * 100);

  if (recap.totalExpected === 0) return null;

  async function onShare() {
    setSharing(true);
    try { await shareRecap(recap); } finally { setSharing(false); }
  }

  return (
    <div className="recap-card">
      <div className="recap-header">
        <div>
          <div className="recap-eyebrow">🐼 Tu semana</div>
          <div className="recap-title">{ratePct}% cumplido</div>
        </div>
        <button className="icon-btn" onClick={onDismiss} aria-label="Ocultar">✕</button>
      </div>

      <div className="recap-stats">
        <div className="recap-stat">
          <div className="recap-stat-num">🌟 {recap.perfectDays}</div>
          <div className="recap-stat-label">días perfectos</div>
        </div>
        <div className="recap-stat">
          <div className="recap-stat-num">✓ {recap.totalDone}</div>
          <div className="recap-stat-label">de {recap.totalExpected} hábitos</div>
        </div>
      </div>

      {recap.topStreakHabit && (
        <div className="recap-line">
          🔥 Tu mejor racha: <strong>{recap.topStreakHabit.streak} días</strong> en "{recap.topStreakHabit.habit.name}"
        </div>
      )}

      {recap.bestHabit && (
        <div className="recap-line" style={{ color: colorFor(recap.bestHabit.habit.colorIdx).bg }}>
          🏆 Hábito top: <strong>{recap.bestHabit.habit.name}</strong> ({recap.bestHabit.doneCount}/{recap.bestHabit.expectedCount})
        </div>
      )}

      <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={onShare} disabled={sharing}>
        {sharing ? 'Generando…' : '📤 Compartir mi semana'}
      </button>
    </div>
  );
}
