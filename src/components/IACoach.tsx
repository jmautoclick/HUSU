// HusuAI v2 — UI completa con categorías, proactive insight y follow-ups.

import { useEffect, useMemo, useRef, useState } from 'react';
import type { AppData } from '../lib/types';
import { getCoachResult, proactiveInsight, SUGGESTION_CATEGORIES } from '../lib/coach-rules';

interface Props {
  data: AppData;
  onSetKey: (key: string) => void;
}

interface Message {
  role: 'user' | 'bot';
  text: string;
  followUps?: string[];
}

export function IACoach({ data, onSetKey: _onSetKey }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>(SUGGESTION_CATEGORIES[0].id);
  const scrollRef = useRef<HTMLDivElement>(null);

  const insight = useMemo(() => proactiveInsight(data), [data]);
  const activeQuestions = useMemo(
    () => SUGGESTION_CATEGORIES.find(c => c.id === activeCategory)?.questions ?? [],
    [activeCategory],
  );

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  function send(text: string) {
    if (!text.trim() || thinking) return;
    const userMsg: Message = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setThinking(true);

    const delay = 400 + Math.random() * 500;
    setTimeout(() => {
      const result = getCoachResult(text, data);
      setMessages(prev => [...prev, { role: 'bot', text: result.text, followUps: result.followUps }]);
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
            Tu coach de hábitos. Conozco todo tu historial — patrones, rachas, lo que se cae. Preguntame lo que quieras.
          </div>
        </div>
      </div>

      {insight && messages.length === 0 && (
        <div className="proactive-insight">{insight}</div>
      )}

      {messages.length === 0 && (
        <>
          <div className="section-label">Preguntá sobre…</div>
          <div className="category-tabs-wrap">
            <div className="category-tabs">
              {SUGGESTION_CATEGORIES.map(c => (
                <button
                  key={c.id}
                  className={activeCategory === c.id ? 'on' : ''}
                  onClick={() => setActiveCategory(c.id)}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>
          <div className="suggestion-list">
            {activeQuestions.map(q => (
              <button key={q} className="chip" onClick={() => send(q)}>💬 {q}</button>
            ))}
          </div>
          <div className="suggestion-hint">
            O escribime libre — entiendo cosas tipo "qué tal va leer", "tip para mi rutina", "necesito energía".
          </div>
        </>
      )}

      {messages.map((m, i) => {
        const isLastBot = m.role === 'bot' && i === messages.length - 1 && !thinking;
        return (
          <div key={i}>
            <div className={`chat-bubble ${m.role}`}>{m.text}</div>
            {isLastBot && m.followUps && m.followUps.length > 0 && (
              <div className="follow-ups">
                {m.followUps.map(q => (
                  <button key={q} className="follow-up-chip" onClick={() => send(q)}>{q}</button>
                ))}
              </div>
            )}
          </div>
        );
      })}
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
          placeholder="Preguntale a HusuAI..."
        />
        <button className="send-btn" onClick={() => send(input)} disabled={thinking || !input.trim()}>➤</button>
      </div>

      {messages.length > 0 && (
        <button className="config-link" onClick={() => setMessages([])}>Nueva conversación</button>
      )}
    </>
  );
}
