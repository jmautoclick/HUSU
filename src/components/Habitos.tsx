import { useState } from 'react';
import type { AppData, Frequency, Habit, Reminder, TimeSlot } from '../lib/types';
import { HABIT_COLORS, colorFor } from '../lib/colors';
import { CATEGORIES, CATEGORY_EMOJI, TEMPLATES, TOP_RECOMMENDED_NAMES } from '../lib/templates';
import { describeFrequency } from '../lib/frequency';
import { downloadBackup, importFromJSON, pickFile } from '../lib/backup';
import { requestPermission } from '../lib/notifications';

interface Props {
  data: AppData;
  onAdd: (name: string, colorIdx: number, goal: number, opts?: { emoji?: string; frequency?: Frequency; intention?: string; timeSlot?: TimeSlot }) => void;
  onAddMany: (items: { name: string; colorIdx?: number; monthlyGoal: number; emoji?: string; frequency?: Frequency }[]) => void;
  onUpdate: (id: string, patch: Partial<Habit>) => void;
  onSetReminder: (id: string, reminder: Reminder | undefined) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onImport: (data: AppData) => void;
  onSetTheme: (t: 'dark' | 'light') => void;
}

export function Habitos({ data, onAdd, onAddMany, onUpdate, onSetReminder, onDelete, onMove, onImport, onSetTheme }: Props) {
  const [editing, setEditing] = useState<Habit | null>(null);
  const [creating, setCreating] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  async function handleImport() {
    const json = await pickFile();
    if (!json) return;
    const parsed = importFromJSON(json);
    if (!parsed) { alert('Archivo inválido'); return; }
    if (!confirm('¿Reemplazar tus datos actuales con el backup?')) return;
    onImport(parsed);
  }

  return (
    <>
      <button className="fab-button primary" onClick={() => setCreating(true)}>+ Nuevo hábito</button>
      <button className="fab-button" onClick={() => setShowTemplates(true)}>Ver plantillas sugeridas</button>

      <div className="section-label">Tus hábitos ({data.habits.length})</div>

      {data.habits.length === 0 && (
        <div className="empty-state">Tocá <strong>+ Nuevo hábito</strong> o las <strong>plantillas</strong> para empezar.</div>
      )}

      {data.habits.map((h, idx) => {
        const c = colorFor(h.colorIdx);
        const monthDone = countMonthDone(data, h.id);
        return (
          <div key={h.id} className="habit-row">
            <div className="color-square" style={{ background: c.bg }}>{h.emoji ?? ''}</div>
            <div className="habit-info">
              <div className="habit-name">{h.name}</div>
              <div className="habit-sub">
                {monthDone} días este mes · meta: {h.monthlyGoal}
                <br />
                <span style={{ color: 'var(--text-faint)' }}>{describeFrequency(h.frequency)}{h.reminder?.enabled ? ` · 🔔 ${pad(h.reminder.hour)}:${pad(h.reminder.minute)}` : ''}</span>
              </div>
            </div>
            <div className="habit-controls">
              <button className="icon-btn" onClick={() => onMove(h.id, -1)} disabled={idx === 0}>▲</button>
              <button className="icon-btn" onClick={() => onMove(h.id, 1)} disabled={idx === data.habits.length - 1}>▼</button>
            </div>
            <button className="pill" onClick={() => setEditing(h)}>Editar</button>
            <button className="icon-btn danger" onClick={() => confirmDelete(h, onDelete)}>🗑</button>
          </div>
        );
      })}

      <div className="section-label" style={{ marginTop: 24 }}>Datos y apariencia</div>
      <div className="card">
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => downloadBackup(data)}>📤 Exportar</button>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleImport}>📥 Importar</button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13 }}>Tema</span>
          <div className="segmented">
            <button className={data.theme === 'dark' ? 'on' : ''} onClick={() => onSetTheme('dark')}>🌙 Oscuro</button>
            <button className={data.theme === 'light' ? 'on' : ''} onClick={() => onSetTheme('light')}>☀ Claro</button>
          </div>
        </div>
      </div>

      {creating && (
        <HabitModal
          title="Nuevo hábito"
          initial={{ name: '', emoji: '', colorIdx: nextColor(data), monthlyGoal: 20, frequency: { type: 'daily' }, reminder: undefined, intention: '', timeSlot: 'anytime' }}
          onCancel={() => setCreating(false)}
          onSave={(payload, reminder) => {
            onAdd(payload.name, payload.colorIdx, payload.monthlyGoal, {
              emoji: payload.emoji || undefined,
              frequency: payload.frequency,
              intention: payload.intention || undefined,
              timeSlot: payload.timeSlot,
            });
            setCreating(false);
            if (reminder?.enabled) setTimeout(() => {
              const last = data.habits[data.habits.length - 1];
              if (last) onSetReminder(last.id, reminder);
            }, 50);
          }}
          onRequestNotificationPerm={requestPermission}
        />
      )}

      {editing && (
        <HabitModal
          title="Editar hábito"
          initial={{ ...editing, emoji: editing.emoji ?? '', intention: editing.intention ?? '', timeSlot: editing.timeSlot ?? 'anytime' }}
          onCancel={() => setEditing(null)}
          onSave={(payload, reminder) => {
            onUpdate(editing.id, {
              name: payload.name,
              colorIdx: payload.colorIdx,
              monthlyGoal: payload.monthlyGoal,
              emoji: payload.emoji || undefined,
              frequency: payload.frequency,
              intention: payload.intention || undefined,
              timeSlot: payload.timeSlot,
            });
            onSetReminder(editing.id, reminder);
            setEditing(null);
          }}
          onRequestNotificationPerm={requestPermission}
        />
      )}

      {showTemplates && (
        <TemplatesModal
          existing={new Set(data.habits.map(h => h.name))}
          onCancel={() => setShowTemplates(false)}
          onAdd={(picks) => { onAddMany(picks); setShowTemplates(false); }}
        />
      )}
    </>
  );
}

interface ModalPayload {
  name: string;
  emoji: string;
  colorIdx: number;
  monthlyGoal: number;
  frequency: Frequency;
  intention: string;
  timeSlot: TimeSlot;
}

const TIMESLOT_LABEL: Record<TimeSlot, string> = {
  morning: '🌅 Mañana',
  afternoon: '☀️ Tarde',
  evening: '🌙 Noche',
  anytime: '⏱ Cualquiera',
};

function HabitModal({ title, initial, onCancel, onSave, onRequestNotificationPerm }: {
  title: string;
  initial: ModalPayload & { reminder?: Reminder };
  onCancel: () => void;
  onSave: (payload: ModalPayload, reminder: Reminder | undefined) => void;
  onRequestNotificationPerm: () => Promise<boolean>;
}) {
  const [name, setName] = useState(initial.name);
  const [emoji, setEmoji] = useState(initial.emoji);
  const [colorIdx, setColorIdx] = useState(initial.colorIdx);
  const [goal, setGoal] = useState(initial.monthlyGoal);
  const [freqType, setFreqType] = useState<Frequency['type']>(initial.frequency.type);
  const [timesPerWeek, setTimesPerWeek] = useState(initial.frequency.type === 'weekly' ? initial.frequency.timesPerWeek : 3);
  const [weekdays, setWeekdays] = useState<number[]>(initial.frequency.type === 'specific' ? initial.frequency.weekdays : [1, 2, 3, 4, 5]);
  const [reminderEnabled, setReminderEnabled] = useState(!!initial.reminder?.enabled);
  const [reminderTime, setReminderTime] = useState(`${pad(initial.reminder?.hour ?? 9)}:${pad(initial.reminder?.minute ?? 0)}`);
  const [intention, setIntention] = useState(initial.intention);
  const [timeSlot, setTimeSlot] = useState<TimeSlot>(initial.timeSlot);

  const canSave = name.trim().length > 0 && goal > 0 && (freqType !== 'specific' || weekdays.length > 0);

  function buildFreq(): Frequency {
    if (freqType === 'daily') return { type: 'daily' };
    if (freqType === 'weekly') return { type: 'weekly', timesPerWeek };
    return { type: 'specific', weekdays: weekdays.sort((a, b) => a - b) };
  }

  function buildReminder(): Reminder | undefined {
    if (!reminderEnabled) return undefined;
    const [h, m] = reminderTime.split(':').map(Number);
    return { hour: h || 0, minute: m || 0, enabled: true };
  }

  async function toggleReminder() {
    if (!reminderEnabled) {
      const ok = await onRequestNotificationPerm();
      if (!ok) { alert('Sin permiso de notificaciones no podemos recordarte.'); return; }
    }
    setReminderEnabled(v => !v);
  }

  function toggleWeekday(i: number) {
    setWeekdays(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal scroll" onClick={e => e.stopPropagation()}>
        <h2>{title}</h2>
        <div className="modal-row">
          <label>Nombre</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Leer 15 minutos" autoFocus />
        </div>
        <div className="modal-row">
          <label>Emoji (opcional)</label>
          <input value={emoji} onChange={e => setEmoji(e.target.value.slice(0, 2))} placeholder="📚" maxLength={2} style={{ maxWidth: 80 }} />
        </div>
        <div className="modal-row">
          <label>Frecuencia</label>
          <div className="freq-tabs">
            <button className={freqType === 'daily' ? 'on' : ''} onClick={() => setFreqType('daily')}>Diario</button>
            <button className={freqType === 'weekly' ? 'on' : ''} onClick={() => setFreqType('weekly')}>X / semana</button>
            <button className={freqType === 'specific' ? 'on' : ''} onClick={() => setFreqType('specific')}>Días específicos</button>
          </div>
          {freqType === 'weekly' && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="number" min={1} max={7} value={timesPerWeek} onChange={e => setTimesPerWeek(Math.max(1, Math.min(7, parseInt(e.target.value) || 1)))} style={{ maxWidth: 80 }} />
              <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>veces por semana</span>
            </div>
          )}
          {freqType === 'specific' && (
            <div className="weekday-picker">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((l, i) => (
                <button key={i} className={weekdays.includes(i) ? 'on' : ''} onClick={() => toggleWeekday(i)}>{l}</button>
              ))}
            </div>
          )}
        </div>
        <div className="modal-row">
          <label>Meta mensual (días)</label>
          <input type="number" min={1} max={31} value={goal} onChange={e => setGoal(parseInt(e.target.value) || 1)} />
        </div>
        <div className="modal-row">
          <label>Color</label>
          <div className="color-picker">
            {HABIT_COLORS.map((c, i) => (
              <button
                key={i}
                className={`color-pick ${i === colorIdx ? 'selected' : ''}`}
                style={{ background: c.bg }}
                onClick={() => setColorIdx(i)}
              />
            ))}
          </div>
        </div>
        <div className="modal-row">
          <label>Momento del día</label>
          <div className="freq-tabs">
            {(['morning', 'afternoon', 'evening', 'anytime'] as const).map(t => (
              <button key={t} className={timeSlot === t ? 'on' : ''} onClick={() => setTimeSlot(t)}>{TIMESLOT_LABEL[t]}</button>
            ))}
          </div>
        </div>
        <div className="modal-row">
          <label>Recordatorio</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className={`pill ${reminderEnabled ? 'on' : ''}`} onClick={toggleReminder}>{reminderEnabled ? '🔔 Activo' : 'Activar'}</button>
            {reminderEnabled && (
              <input type="time" value={reminderTime} onChange={e => setReminderTime(e.target.value)} style={{ flex: 1 }} />
            )}
          </div>
        </div>
        <div className="modal-row">
          <label>Cuándo lo voy a hacer (opcional)</label>
          <textarea
            value={intention}
            onChange={e => setIntention(e.target.value)}
            placeholder="Ej: cuando termine de cenar, en el sillón con un té"
            rows={2}
            style={{ resize: 'vertical', minHeight: 50 }}
          />
          <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 4 }}>
            Definir cuándo y dónde casi duplica la chance de cumplirlo (Gollwitzer, d=0.65).
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => canSave && onSave({ name: name.trim(), emoji, colorIdx, monthlyGoal: goal, frequency: buildFreq(), intention: intention.trim(), timeSlot }, buildReminder())} disabled={!canSave}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

function TemplatesModal({ existing, onCancel, onAdd }: { existing: Set<string>; onCancel: () => void; onAdd: (picks: typeof TEMPLATES) => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const list = activeCategory === 'all' ? TEMPLATES : TEMPLATES.filter(t => t.category === activeCategory);

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal scroll" onClick={e => e.stopPropagation()}>
        <h2>Plantillas sugeridas</h2>
        <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: '0 0 12px' }}>{TEMPLATES.length} hábitos respaldados por research. Tocá los que querés sumar.</p>
        <div className="category-tabs">
          <button className={activeCategory === 'all' ? 'on' : ''} onClick={() => setActiveCategory('all')}>Todos</button>
          {CATEGORIES.map(c => (
            <button key={c} className={activeCategory === c ? 'on' : ''} onClick={() => setActiveCategory(c)}>{CATEGORY_EMOJI[c] ?? ''} {c}</button>
          ))}
        </div>
        <div className="template-list">
          {list.map(t => {
            const already = existing.has(t.name);
            const isSel = selected.has(t.name);
            const isRec = TOP_RECOMMENDED_NAMES.has(t.name);
            return (
              <button
                key={t.name}
                disabled={already}
                className={`template-row ${isSel ? 'selected' : ''} ${already ? 'dim' : ''}`}
                onClick={() => setSelected(prev => { const s = new Set(prev); s.has(t.name) ? s.delete(t.name) : s.add(t.name); return s; })}
              >
                <span className="template-emoji">{t.emoji}</span>
                <div className="template-info">
                  <div className="template-name">
                    {t.name}
                    {isRec && <span className="badge-tag rec">⭐</span>}
                    {t.keystone && <span className="badge-tag keystone">🪨</span>}
                    {already && <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>(ya tenés)</span>}
                  </div>
                  <div className="template-sub">{describeFrequency(t.frequency)} · {t.description}</div>
                </div>
                <span className={`template-check ${isSel ? 'on' : ''}`}>{isSel ? '✓' : ''}</span>
              </button>
            );
          })}
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
          <button
            className="btn btn-primary"
            disabled={selected.size === 0}
            onClick={() => onAdd(TEMPLATES.filter(t => selected.has(t.name)))}
          >
            Sumar ({selected.size})
          </button>
        </div>
      </div>
    </div>
  );
}

function nextColor(data: AppData): number {
  const used = new Set(data.habits.map(h => h.colorIdx));
  for (let i = 0; i < HABIT_COLORS.length; i++) if (!used.has(i)) return i;
  return data.habits.length % HABIT_COLORS.length;
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

function confirmDelete(h: Habit, onDelete: (id: string) => void) {
  if (window.confirm(`¿Borrar "${h.name}"? Se eliminará todo su historial.`)) onDelete(h.id);
}

function pad(n: number): string { return n.toString().padStart(2, '0'); }
