import type { TabId } from '../lib/types';

interface Props {
  active: TabId;
  onChange: (tab: TabId) => void;
}

const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: 'registro', icon: '✓', label: 'Registro' },
  { id: 'stats', icon: '📊', label: 'Stats' },
  { id: 'coach', icon: '🤖', label: 'IA Coach' },
  { id: 'habitos', icon: '⚙', label: 'Hábitos' },
];

export function TabBar({ active, onChange }: Props) {
  return (
    <nav className="tabs">
      {TABS.map(t => (
        <button
          key={t.id}
          className={`tab ${active === t.id ? 'active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          <span className="tab-icon">{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
