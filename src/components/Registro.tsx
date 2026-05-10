import { useMemo, useState } from 'react';
import type { AppData, Habit, TimeSlot } from '../lib/types';
import { dateKey, formatDayShort, isSameDay, lastNDays, todayKey } from '../lib/dates';
import { colorFor } from '../lib/colors';
import { currentStreak } from '../lib/streaks';
import { isExpectedToday } from '../lib/frequency';
import { NoteEditor } from './NoteEditor';

interface Props {
  data: AppData;
  onToggle: (dateKey: string, habitId: string) => void;
  onSetNote: (dateKey: string, habitId: string, note: string) => void;
  onJumpToHabits: () => void;
}

export function Registro({ data, onToggle, onSetNote, onJumpToHabits }: Props) {
  const [windowSize, setWindowSize] = useState(7);
  const [selected, setSelected] = useState<string>(todayKey());
  const [noteFor, setNoteFor] = useState<Habit | null>(null);
  const today = new Date();
  const days = useMemo(() => lastNDays(windowSize, today), [windowSize]);

  if (data.habits.length === 0) {
    return (
      <div className="empty-state">
        <div style={{ fontSize: 36, marginBottom: 12 }}>🌱</div>
        <p>Todavía no agregaste hábitos.</p>
        <button className="btn btn-primary" style={{ marginTop: 8, maxWidth: 200, marginInline: 'auto' }} onClick={onJumpToHabits}>
          Crear mi primer hábito
        </button>
      </div>
    );
  }

  const completionsForDay = data.completions[selected] ?? {};
  const selectedDate = parseDateK(selected);

  return (
    <>
      <div className="section-row">
        <div className="section-label">Seleccioná el día</div>
        <button className="link-button" onClick={() => setWindowSize(s => s === 7 ? 14 : s === 14 ? 30 : 7)}>
          {windowSize === 30 ? '← Menos' : '← Ver más'}
        </button>
      </div>

      <div className="day-strip" style={{ gridTemplateColumns: `repeat(${windowSize}, 1fr)` }}>
        {days.map(d => {
          const k = dateKey(d);
          const isToday = isSameDay(d, today);
          const isSel = k === selected;
          const dayCompletions = data.completions[k] ?? {};
          const expected = data.habits.filter(h => isExpectedToday(h, d, data.completions));
          const doneCount = expected.filter(h => dayCompletions[h.id]?.done).length;
          const ratio = expected.length > 0 ? doneCount / expected.length : 0;
          return (
            <button
              key={k}
              className={`day-cell ${isToday ? 'today' : ''} ${isSel ? 'selected' : ''}`}
              onClick={() => setSelected(k)}
            >
              <span className="dow">{isToday ? 'HOY' : formatDayShort(d)}</span>
              <span className="num">{d.getDate()}</span>
              <div className="day-progress" aria-hidden>
                <div className="day-progress-fill" style={{ width: `${ratio * 100}%` }} />
              </div>
            </button>
          );
        })}
      </div>

      {groupedSlots(data.habits).map(([slot, habits]) => (
        <div key={slot}>
          {hasMultipleSlots(data.habits) && (
            <div className="section-label" style={{ marginTop: 14 }}>{TIMESLOT_LABEL[slot]}</div>
          )}
          {habits.map(h => {
            const c = colorFor(h.colorIdx);
            const entry = completionsForDay[h.id];
            const checked = !!entry?.done;
            const hasNote = !!entry?.note;
            const expected = isExpectedToday(h, selectedDate, data.completions);
            const streak = selected === todayKey() ? currentStreak(h, data.completions, today, data.freezesUsed) : 0;
            const isFrozen = !!data.freezesUsed[selected]?.[h.id];

            return (
          <div key={h.id} className={`habit-row ${!expected ? 'dim' : ''}`}>
            <button
              className={`habit-checkbox ${checked ? 'checked' : ''}`}
              style={{ borderColor: c.bg, background: checked ? c.bg : 'transparent' }}
              onClick={() => onToggle(selected, h.id)}
              aria-label={checked ? 'Desmarcar' : 'Marcar'}
            >
              {checked ? '✓' : ''}
            </button>
            <div className="habit-info">
              <div className="habit-name">
                {h.emoji && <span style={{ marginRight: 6 }}>{h.emoji}</span>}
                {h.name}
              </div>
              <div className="habit-sub">
                {streak > 0 && (
                  <span className="streak-badge" title={isFrozen ? 'Escudo activo' : 'Racha actual'}>
                    {isFrozen ? '🛡️' : '🔥'} {streak}
                  </span>
                )}
                {!expected && <span className="freq-tag">no toca hoy</span>}
                {expected && streak === 0 && <span>· faltan {Math.max(0, h.monthlyGoal - countMonthDone(data, h.id))} para la meta</span>}
              </div>
            </div>
            <button
              className={`note-btn ${hasNote ? 'has-note' : ''}`}
              onClick={() => setNoteFor(h)}
              aria-label="Nota"
              title="Nota del día"
            >
              {hasNote ? '📝' : '＋'}
            </button>
          </div>
        );
          })}
        </div>
      ))}

      {noteFor && (
        <NoteEditor
          habit={noteFor}
          date={selected}
          initialNote={completionsForDay[noteFor.id]?.note ?? ''}
          onClose={() => setNoteFor(null)}
          onSave={(note) => onSetNote(selected, noteFor.id, note)}
        />
      )}
    </>
  );
}

const SLOT_ORDER: TimeSlot[] = ['morning', 'afternoon', 'evening', 'anytime'];
const TIMESLOT_LABEL: Record<TimeSlot, string> = {
  morning: '🌅 Mañana',
  afternoon: '☀️ Tarde',
  evening: '🌙 Noche',
  anytime: '⏱ Cualquier momento',
};

function hasMultipleSlots(habits: Habit[]): boolean {
  const slots = new Set(habits.map(h => h.timeSlot ?? 'anytime'));
  return slots.size > 1;
}

function groupedSlots(habits: Habit[]): [TimeSlot, Habit[]][] {
  const groups: Record<TimeSlot, Habit[]> = { morning: [], afternoon: [], evening: [], anytime: [] };
  for (const h of habits) groups[h.timeSlot ?? 'anytime'].push(h);
  return SLOT_ORDER.filter(s => groups[s].length > 0).map(s => [s, groups[s]] as [TimeSlot, Habit[]]);
}

function countMonthDone(data: AppData, habitId: string): number {
  const now = new Date();
  let n = 0;
  for (const [k, day] of Object.entries(data.completions)) {
    if (!day[habitId]?.done) continue;
    const [yy, mm] = k.split('-').map(Number);
    if (yy === now.getFullYear() && mm - 1 === now.getMonth()) n++;
  }
  return n;
}

function parseDateK(k: string): Date {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}
