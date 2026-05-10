import { useState } from 'react';
import type { Habit } from '../lib/types';
import { colorFor } from '../lib/colors';

interface Props {
  habit: Habit;
  date: string;
  initialNote: string;
  onClose: () => void;
  onSave: (note: string) => void;
}

export function NoteEditor({ habit, date, initialNote, onClose, onSave }: Props) {
  const [note, setNote] = useState(initialNote);
  const c = colorFor(habit.colorIdx);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 style={{ color: c.bg, display: 'flex', alignItems: 'center', gap: 8 }}>
          {habit.emoji ? <span>{habit.emoji}</span> : null}
          <span>{habit.name}</span>
        </h2>
        <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: '0 0 12px' }}>
          Nota del {date}
        </p>
        <div className="modal-row">
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="¿Cómo te fue hoy con esto? (opcional)"
            rows={5}
            autoFocus
            style={{ resize: 'vertical', minHeight: 100 }}
          />
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => { onSave(note.trim()); onClose(); }}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
