import { useState } from 'react';
import type { AppData, Habit } from '../lib/types';
import { dateKey, formatMonthYear, isSameDay, monthDays, parseDateKey, startOfMonth } from '../lib/dates';
import { colorFor } from '../lib/colors';
import { bestStreak, currentStreak } from '../lib/streaks';
import { Heatmap } from './Heatmap';
import { AchievementsPanel } from './AchievementsPanel';

interface Props {
  data: AppData;
}

type View = 'mes' | 'ano';

export function Stats({ data }: Props) {
  const [view, setView] = useState<View>('mes');
  const [heatmapHabit, setHeatmapHabit] = useState<string | 'all'>('all');
  const today = new Date();
  const month = startOfMonth(today);

  if (data.habits.length === 0) {
    return <div className="empty-state">Agregá hábitos para ver estadísticas.</div>;
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
        <span className="pill">{formatMonthYear(month)}</span>
        <div className="segmented">
          <button className={view === 'mes' ? 'on' : ''} onClick={() => setView('mes')}>Mes</button>
          <button className={view === 'ano' ? 'on' : ''} onClick={() => setView('ano')}>Año</button>
        </div>
      </div>

      {view === 'mes' && (
        <>
          <div className="section-label">Patrones por día de semana</div>
          {data.habits.map(h => <WeekdayPattern key={h.id} habit={h} data={data} />)}

          <div className="section-label" style={{ marginTop: 18 }}>Calendario — {formatMonthYear(month)}</div>
          {data.habits.map(h => <MonthCalendar key={h.id} habit={h} data={data} today={today} />)}
        </>
      )}

      {view === 'ano' && (
        <>
          <div className="section-row" style={{ marginBottom: 8 }}>
            <div className="section-label">Heatmap anual</div>
            <select className="link-button" value={heatmapHabit} onChange={e => setHeatmapHabit(e.target.value as any)}>
              <option value="all">Todos los hábitos</option>
              {data.habits.map(h => <option key={h.id} value={h.id}>{h.emoji ? h.emoji + ' ' : ''}{h.name}</option>)}
            </select>
          </div>
          <Heatmap data={data} habit={heatmapHabit === 'all' ? null : data.habits.find(h => h.id === heatmapHabit) ?? null} />

          <div className="section-label" style={{ marginTop: 18 }}>Rachas</div>
          {data.habits.map(h => <StreakCard key={h.id} habit={h} data={data} today={today} />)}
        </>
      )}

      <AchievementsPanel data={data} />
    </>
  );
}

const DOW_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function WeekdayPattern({ habit, data }: { habit: Habit; data: AppData }) {
  const c = colorFor(habit.colorIdx);
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const [k, day] of Object.entries(data.completions)) {
    if (!day[habit.id]?.done) continue;
    const d = parseDateKey(k);
    counts[d.getDay()]++;
  }
  const max = Math.max(1, ...counts);
  const total = counts.reduce((a, b) => a + b, 0);

  return (
    <div className="card">
      <div style={{ color: c.bg, fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
        {habit.emoji} {habit.name}
      </div>
      {total === 0 ? (
        <div style={{ color: 'var(--text-faint)', fontSize: 11, marginTop: 8, textAlign: 'center' }}>Sin datos aún</div>
      ) : (
        <div className="weekday-bars">
          {counts.map((cnt, i) => (
            <div key={i} className="weekday-bar" style={{ color: c.bg }}>
              <div className="bar" style={{ height: `${(cnt / max) * 100}%`, opacity: cnt === 0 ? 0.18 : 1 }} />
              <div className="label">{DOW_LABELS[i]}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MonthCalendar({ habit, data, today }: { habit: Habit; data: AppData; today: Date }) {
  const c = colorFor(habit.colorIdx);
  const days = monthDays(today.getFullYear(), today.getMonth());
  const firstDow = days[0].getDay();
  const cells: (Date | null)[] = [...Array(firstDow).fill(null), ...days];
  while (cells.length % 7 !== 0) cells.push(null);

  let doneCount = 0;
  for (const d of days) {
    if (d > today) break;
    if (data.completions[dateKey(d)]?.[habit.id]?.done) doneCount++;
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: c.bg, fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          {habit.emoji} {habit.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{doneCount}/{habit.monthlyGoal} días</div>
      </div>
      <div className="calendar">
        {DOW_LABELS.map(l => <div key={l} className="cal-head">{l}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={i} className="cal-cell empty" />;
          const k = dateKey(d);
          const done = !!data.completions[k]?.[habit.id]?.done;
          const isFuture = d > today;
          const isTod = isSameDay(d, today);
          return (
            <div
              key={i}
              className={`cal-cell ${done ? 'done' : ''} ${isTod ? 'today' : ''}`}
              style={{
                background: done ? c.bg : isFuture ? 'transparent' : 'rgba(255,255,255,0.03)',
                color: isTod ? c.bg : undefined,
                opacity: isFuture ? 0.4 : 1,
              }}
            >
              {d.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StreakCard({ habit, data, today }: { habit: Habit; data: AppData; today: Date }) {
  const c = colorFor(habit.colorIdx);
  const cur = currentStreak(habit, data.completions, today, data.freezesUsed);
  const best = bestStreak(habit, data.completions, today);
  return (
    <div className="card streak-card">
      <div style={{ color: c.bg, fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
        {habit.emoji} {habit.name}
      </div>
      <div className="streak-stats">
        <div>
          <div className="streak-num">🔥 {cur}</div>
          <div className="streak-label">racha actual</div>
        </div>
        <div>
          <div className="streak-num">🏆 {best}</div>
          <div className="streak-label">mejor racha</div>
        </div>
      </div>
    </div>
  );
}
