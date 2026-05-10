import { formatDate, formatDayLong } from '../lib/dates';

interface Props {
  doneToday: number;
  totalToday: number;
}

export function Header({ doneToday, totalToday }: Props) {
  const today = new Date();
  return (
    <header className="header">
      <div>
        <h1><span className="accent">Husu</span> Habits</h1>
        <div className="subtitle">Hoy · {formatDayLong(today)} {formatDate(today)}</div>
      </div>
      <div>
        <div className="counter">{doneToday}/{totalToday}</div>
        <div className="counter-label">hoy</div>
      </div>
    </header>
  );
}
