import { useEffect, useRef, useState } from 'react';
import type { AppData } from '../lib/types';
import { askGemini, buildSystemContext } from '../lib/gemini';

interface Props {
  data: AppData;
  onSetKey: (key: string) => void;
}

interface Message {
  role: 'user' | 'bot' | 'error';
  text: string;
}

const SUGGESTIONS = [
  '¿Cómo estoy yendo este mes?',
  '¿Qué días de la semana fallo más?',
  '¿Qué hábito necesita más atención?',
  'Dame un consejo para mejorar',
];

export function IACoach({ data, onSetKey }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    if (!data.geminiKey) { setShowConfig(true); return; }

    const newMessages: Message[] = [...messages, { role: 'user', text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const system = buildSystemContext(data);
      const history = [
        { role: 'user' as const, parts: [{ text: system }] },
        { role: 'model' as const, parts: [{ text: 'Entendido, soy HusuAI. ¿En qué te ayudo?' }] },
        ...newMessages.filter(m => m.role !== 'error').map(m => ({
          role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
          parts: [{ text: m.text }],
        })),
      ];
      const reply = await askGemini(data.geminiKey, history);
      setMessages([...newMessages, { role: 'bot', text: reply }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      setMessages([...newMessages, { role: 'error', text: `No pude procesar la respuesta: ${msg}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!data.geminiKey && (
        <div className="api-banner">
          <strong>HusuAI necesita una API key</strong>
          <p style={{ margin: '6px 0 0' }}>
            Obtené una gratis en{' '}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">aistudio.google.com/apikey</a>
            {' '}y configurala acá abajo.
          </p>
        </div>
      )}

      <div className="card" style={{ background: 'rgba(168, 85, 247, 0.08)', borderColor: 'rgba(168, 85, 247, 0.3)' }}>
        <div style={{ color: '#c084fc', fontWeight: 700, fontSize: 13 }}>🤖 HusuAI</div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
          Tengo acceso a tu historial completo, incluyendo patrones por día de semana.
        </div>
      </div>

      {messages.length === 0 && (
        <>
          <div className="section-label">Preguntas sugeridas</div>
          {SUGGESTIONS.map(s => (
            <button key={s} className="chip" onClick={() => send(s)}>💬 {s}</button>
          ))}
        </>
      )}

      {messages.map((m, i) => (
        <div key={i} className={`chat-bubble ${m.role}`}>{m.text}</div>
      ))}
      {loading && <div className="chat-bubble bot">Pensando…</div>}
      <div ref={scrollRef} />

      <div className="chat-input">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send(input); }}
          placeholder="Preguntale algo a tu coach..."
        />
        <button className="send-btn" onClick={() => send(input)} disabled={loading || !input.trim()}>➤</button>
      </div>

      <button className="config-link" onClick={() => setShowConfig(true)}>
        {data.geminiKey ? 'Cambiar API key' : 'Configurar API key'}
      </button>

      {messages.length > 0 && (
        <button className="config-link" onClick={() => setMessages([])}>Nueva conversación</button>
      )}

      {showConfig && (
        <ApiKeyModal
          current={data.geminiKey ?? ''}
          onCancel={() => setShowConfig(false)}
          onSave={k => { onSetKey(k); setShowConfig(false); }}
        />
      )}
    </>
  );
}

function ApiKeyModal({ current, onCancel, onSave }: {
  current: string;
  onCancel: () => void;
  onSave: (key: string) => void;
}) {
  const [val, setVal] = useState(current);
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>API key de Gemini</h2>
        <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: '0 0 12px' }}>
          Tu clave se guarda solo en este dispositivo. Conseguila gratis en{' '}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={{ color: '#ffa94d' }}>
            aistudio.google.com/apikey
          </a>.
        </p>
        <div className="modal-row">
          <label>Clave</label>
          <input value={val} onChange={e => setVal(e.target.value)} placeholder="AIza..." autoFocus />
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => onSave(val.trim())}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
