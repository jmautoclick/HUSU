import { useEffect, useMemo, useState } from 'react';
import './styles.css';
import type { TabId } from './lib/types';
import { todayKey } from './lib/dates';
import { isExpectedToday } from './lib/frequency';
import { useHabitos } from './hooks/useHabitos';
import { Header } from './components/Header';
import { TabBar } from './components/TabBar';
import { Registro } from './components/Registro';
import { Stats } from './components/Stats';
import { Habitos } from './components/Habitos';
import { IACoach } from './components/IACoach';
import { Onboarding } from './components/Onboarding';
import { MilestoneToast } from './components/MilestoneToast';
import { SundayRecap } from './components/SundayRecap';
import { isSunday } from './lib/recap';

function App() {
  const [tab, setTab] = useState<TabId>('registro');
  const h = useHabitos();
  const { data } = h;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', data.theme);
  }, [data.theme]);

  const { doneToday, totalToday } = useMemo(() => {
    const k = todayKey();
    const day = data.completions[k] ?? {};
    const expected = data.habits.filter(hh => isExpectedToday(hh, new Date(), data.completions));
    const done = expected.filter(hh => day[hh.id]?.done).length;
    return { doneToday: done, totalToday: expected.length };
  }, [data]);

  if (!data.onboardingCompleted) {
    return (
      <Onboarding
        onComplete={(picks, identity) => {
          h.addManyHabits(picks.map(t => ({
            name: t.name,
            monthlyGoal: t.monthlyGoal,
            emoji: t.emoji,
            frequency: t.frequency,
          })), identity);
        }}
        onSkip={() => h.completeOnboarding(true)}
      />
    );
  }

  return (
    <div className="app">
      <Header doneToday={doneToday} totalToday={totalToday} />
      <TabBar active={tab} onChange={setTab} />

      {tab === 'registro' && isSunday() && data.recapDismissedFor !== todayKey() && data.habits.length > 0 && (
        <SundayRecap data={data} onDismiss={h.dismissRecap} />
      )}
      {tab === 'registro' && (
        <Registro
          data={data}
          onToggle={h.toggleCompletion}
          onSetNote={h.setNote}
          onJumpToHabits={() => setTab('habitos')}
        />
      )}
      {tab === 'stats' && <Stats data={data} />}
      {tab === 'coach' && <IACoach data={data} onSetKey={h.setGeminiKey} />}
      {tab === 'habitos' && (
        <Habitos
          data={data}
          onAdd={h.addHabit}
          onAddMany={h.addManyHabits}
          onUpdate={h.updateHabit}
          onSetReminder={h.setReminder}
          onDelete={h.deleteHabit}
          onMove={h.moveHabit}
          onImport={h.importData}
          onSetTheme={h.setTheme}
        />
      )}

      <MilestoneToast toast={h.toast} onDismiss={h.dismissToast} />
    </div>
  );
}

export default App;
