import type { AppData, Habit } from '../lib/types';
import { dateKey } from '../lib/dates';
import { colorFor } from '../lib/colors';

interface Props {
  data: AppData;
  habit: Habit | null;
  today?: Date;
}

export function Heatmap({ data, habit, today = new Date() }: Props) {
  const c = habit ? colorFor(habit.colorIdx) : { bg: '#a855f7', dim: '#581c87' };
  const end = stripTime(today);
  const start = new Date(end);
  start.setDate(end.getDate() - 364);
  const startSunday = new Date(start);
  startSunday.setDate(start.getDate() - start.getDay());

  const weeks: { date: Date | null; intensity: number }[][] = [];
  const cursor = new Date(startSunday);
  while (cursor <= end) {
    const week: { date: Date | null; intensity: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(cursor);
      const inRange = date >= start && date <= end;
      week.push({
        date: inRange ? date : null,
        intensity: inRange ? intensityFor(data, date, habit) : 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  const months: { col: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((w, i) => {
    const firstDate = w.find(d => d.date)?.date;
    if (firstDate && firstDate.getMonth() !== lastMonth) {
      months.push({ col: i, label: monthLabel(firstDate) });
      lastMonth = firstDate.getMonth();
    }
  });

  return (
    <div className="card heatmap-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: c.bg, fontWeight: 700, fontSize: 13 }}>
          {habit ? `${habit.emoji ?? ''} ${habit.name}` : 'Todos los hábitos'}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>Últimos 12 meses</div>
      </div>
      <div className="heatmap-scroll">
        <div className="heatmap-grid">
          <div className="heatmap-months">
            {months.map(m => <div key={m.col} className="heatmap-month-label" style={{ gridColumn: m.col + 1 }}>{m.label}</div>)}
          </div>
          <div className="heatmap-cells">
            {weeks.map((w, wi) => (
              <div key={wi} className="heatmap-week">
                {w.map((cell, di) => (
                  <div
                    key={di}
                    className="heatmap-cell"
                    style={{
                      background: cell.date
                        ? cell.intensity === 0
                          ? 'rgba(255,255,255,0.04)'
                          : c.bg
                        : 'transparent',
                      opacity: cell.date ? (cell.intensity === 0 ? 1 : 0.25 + cell.intensity * 0.75) : 0,
                    }}
                    title={cell.date ? dateKey(cell.date) : ''}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="heatmap-legend">
        <span>Menos</span>
        {[0, 0.25, 0.5, 0.75, 1].map((o, i) => (
          <span key={i} className="heatmap-cell legend-cell" style={{ background: o === 0 ? 'rgba(255,255,255,0.04)' : c.bg, opacity: o === 0 ? 1 : 0.25 + o * 0.75 }} />
        ))}
        <span>Más</span>
      </div>
    </div>
  );
}

function intensityFor(data: AppData, date: Date, habit: Habit | null): number {
  const k = dateKey(date);
  const day = data.completions[k];
  if (!day) return 0;
  if (habit) return day[habit.id]?.done ? 1 : 0;
  const total = data.habits.length;
  if (total === 0) return 0;
  let done = 0;
  for (const h of data.habits) if (day[h.id]?.done) done++;
  return done / total;
}

function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function monthLabel(d: Date): string {
  return ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][d.getMonth()];
}
