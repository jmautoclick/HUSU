import { useEffect } from 'react';
import { ACHIEVEMENTS } from '../lib/achievements';

export interface ToastSpec {
  kind: 'streak' | 'achievement' | 'perfect_day' | 'freeze';
  title: string;
  body: string;
  emoji: string;
}

interface Props {
  toast: ToastSpec | null;
  onDismiss: () => void;
}

export function MilestoneToast({ toast, onDismiss }: Props) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div className="toast-wrap" onClick={onDismiss}>
      <div className="toast">
        <div className="toast-emoji">{toast.emoji}</div>
        <div className="toast-text">
          <div className="toast-title">{toast.title}</div>
          <div className="toast-body">{toast.body}</div>
        </div>
      </div>
      {toast.kind === 'perfect_day' && (
        <div className="confetti">
          {Array.from({ length: 30 }).map((_, i) => (
            <span key={i} className="confetti-piece" style={{ left: `${(i * 13) % 100}%`, animationDelay: `${(i % 6) * 0.08}s`, background: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'][i % 6] }} />
          ))}
        </div>
      )}
    </div>
  );
}

export function streakToast(streak: number, habitName: string): ToastSpec {
  const emoji = streak >= 100 ? '👑' : streak >= 30 ? '🏆' : streak >= 14 ? '💎' : streak >= 7 ? '⚡' : '🔥';
  return {
    kind: 'streak',
    title: `¡Racha de ${streak} días!`,
    body: habitName,
    emoji,
  };
}

export function perfectDayToast(): ToastSpec {
  return {
    kind: 'perfect_day',
    title: '¡Día perfecto!',
    body: 'Completaste todos los hábitos de hoy.',
    emoji: '🌟',
  };
}

export function freezeToast(habitNames: string[], remaining: number): ToastSpec {
  const list = habitNames.length === 1 ? `tu hábito "${habitNames[0]}"` : `${habitNames.length} hábitos`;
  return {
    kind: 'freeze',
    title: 'Escudo activado 🛡️',
    body: `Te cubrí ${list} ayer. Te quedan ${remaining} este mes.`,
    emoji: '🛡️',
  };
}

export function achievementToast(id: string): ToastSpec {
  const def = ACHIEVEMENTS.find(a => a.id === id);
  return {
    kind: 'achievement',
    title: '¡Logro desbloqueado!',
    body: def?.title ?? id,
    emoji: def?.emoji ?? '🏅',
  };
}
