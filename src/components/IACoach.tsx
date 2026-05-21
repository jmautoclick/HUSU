// HusuAI — Chat coach con motor de respuestas offline (coach-rules.ts).
// No requiere API key, no requiere internet, no consume cuota.
// Si en el futuro hay key Gemini configurada, el componente puede
// optar por usar el LLM real (queda preparado pero no expuesto en UI por ahora).

import { useEffect, useRef, useState } from 'react';
import type { AppData } from '../lib/types';
import { getCoachResponse } from '../lib/coach-rules';

interface Props {
  data: AppData;
  onSetKey: (key: string) => void;
}

interface Message {
  role: 'user' | 'bot';
  text: string;
}

const SUGGESTIONS = [
  '¿Cómo voy este mes?',
  '¿Qué día de la semana fallo más?',
  '¿Qué hábito necesita más atención?',
  'Dame un consejo',
  '¿Cómo va mi semana?',
];

export function IACoach({ data, onSetKey: _onSetKey }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  function send(text: string) {
    if (!text.trim() || thinking) return;
    const userMsg: Message = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setThinking(true);

    // Pequeño delay para sentir que "piensa" (UX, no por necesidad)
    const delay = 400 + Math.random() * 400;
    setTimeout(() => {
      const reply = getCoachResponse(text, data);
      setMessages(prev => [...prev, { role: 'bot', text: reply }]);
      setThinking(false);
    }, delay);
  }

  return (
    <>
      <div className="card coach-intro">
        <div className="coach-avatar">🐼</div>
        <div style={{ flex: 1 }}>
          <div className="coach-name">HusuAI</div>
          <div className="coach-tagline">
            Conozco todo tu historial — patrones por día, rachas, hábitos abandonados, todo. Preguntame.
          </div>
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
      {thinking && (
        <div className="chat-bubble bot thinking">
          <span className="dot-pulse" /><span className="dot-pulse" /><span className="dot-pulse" />
        </div>
      )}
      <div ref={scrollRef} />

      <div className="chat-input">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send(input); }}
          placeholder="Preguntale algo a tu coach..."
        />
        <button className="send-btn" onClick={() => send(input)} disabled={thinking || !input.trim()}>➤</button>
      </div>

      {messages.length > 0 && (
        <button className="config-link" onClick={() => setMessages([])}>Nueva conversación</button>
      )}
    </>
  );
}
