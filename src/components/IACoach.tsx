// HusuAI v2.2 — Coach con voz, typewriter, daily brief auto, sentiment + memoria light.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AppData } from '../lib/types';
import { HusuPanda } from './HusuPanda';
import { SourcesModal } from './SourcesModal';
import {
  getCoachResult,
  proactiveInsight,
  SUGGESTION_CATEGORIES,
  dailyBrief,
  type Intent,
} from '../lib/coach-rules';

interface Props {
  data: AppData;
  onSetKey: (key: string) => void;
}

interface Message {
  role: 'user' | 'bot';
  text: string;
  fullText?: string;
  followUps?: string[];
  intent?: Intent;
  ts?: number;
  typed?: boolean;
}

const CHAT_STORAGE_KEY = 'husu-habits-chat-v1';
const LAST_BRIEF_KEY = 'husu-habits-last-brief';
const MAX_PERSIST = 30;
const STALE_HOURS = 24;
const TYPEWRITER_SPEED_MS_PER_CHAR = 14; // ~70 chars/sec

function loadChat(): Message[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Message[];
    if (!Array.isArray(parsed)) return [];
    const last = parsed[parsed.length - 1];
    if (last?.ts && Date.now() - last.ts > STALE_HOURS * 3600 * 1000) return [];
    return parsed.slice(-MAX_PERSIST).map(m => ({ ...m, typed: true })); // las viejas ya están "tipeadas"
  } catch {
    return [];
  }
}

function saveChat(messages: Message[]): void {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-MAX_PERSIST)));
  } catch {}
}

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function shouldShowDailyBrief(): boolean {
  try {
    const last = localStorage.getItem(LAST_BRIEF_KEY);
    return last !== todayString();
  } catch {
    return false;
  }
}

function markBriefShown(): void {
  try { localStorage.setItem(LAST_BRIEF_KEY, todayString()); } catch {}
}

// Markdown bold parser → JSX
function renderBold(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIdx) parts.push(text.slice(lastIdx, match.index));
    parts.push(<strong key={key++}>{match[1]}</strong>);
    lastIdx = re.lastIndex;
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx));
  return parts;
}

// Web Speech API check
function speechSupported(): boolean {
  return typeof window !== 'undefined' &&
    !!(((window as any).SpeechRecognition) || ((window as any).webkitSpeechRecognition));
}

function createRecognition(): any | null {
  const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!Ctor) return null;
  const r = new Ctor();
  r.lang = 'es-AR';
  r.continuous = false;
  r.interimResults = false;
  return r;
}

export function IACoach({ data, onSetKey: _onSetKey }: Props) {
  const [messages, setMessages] = useState<Message[]>(() => loadChat());
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>(SUGGESTION_CATEGORIES[0].id);
  const [listening, setListening] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const insight = useMemo(() => proactiveInsight(data), [data]);
  const activeQuestions = useMemo(
    () => SUGGESTION_CATEGORIES.find(c => c.id === activeCategory)?.questions ?? [],
    [activeCategory],
  );
  const canSpeak = useMemo(() => speechSupported(), []);

  // Daily Brief automático: si hoy no se mostró Y no hay conversación reciente
  useEffect(() => {
    if (data.habits.length === 0) return;
    if (messages.length > 0) return;
    if (!shouldShowDailyBrief()) return;
    const brief = dailyBrief(data);
    if (!brief) return;
    markBriefShown();
    const briefMsg: Message = {
      role: 'bot',
      text: brief,
      fullText: brief,
      ts: Date.now(),
      typed: false,
      followUps: ['¿Qué tengo hoy?', 'Dame un consejo', 'Motivame'],
      intent: 'daily_brief',
    };
    setMessages([briefMsg]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { saveChat(messages); }, [messages]);
  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, thinking]);

  // Typewriter effect — para el último bot message no typed
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'bot' || last.typed) return;
    if (!last.fullText) return;

    const full = last.fullText;
    let idx = last.text.length;
    if (idx >= full.length) {
      setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, typed: true } : m));
      return;
    }

    const interval = window.setInterval(() => {
      idx += 2; // 2 chars por tick para velocidad agradable
      if (idx >= full.length) {
        setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, text: full, typed: true } : m));
        window.clearInterval(interval);
      } else {
        setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, text: full.slice(0, idx) } : m));
      }
    }, TYPEWRITER_SPEED_MS_PER_CHAR);

    return () => window.clearInterval(interval);
  }, [messages.length, messages[messages.length - 1]?.typed]);

  const skipTypewriter = useCallback(() => {
    setMessages(prev => prev.map((m, i) => {
      if (i === prev.length - 1 && m.role === 'bot' && m.fullText && !m.typed) {
        return { ...m, text: m.fullText, typed: true };
      }
      return m;
    }));
  }, []);

  const send = useCallback((text: string) => {
    if (!text.trim() || thinking) return;
    const userMsg: Message = { role: 'user', text, ts: Date.now(), typed: true };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setThinking(true);

    const delay = 400 + Math.random() * 500;
    setTimeout(() => {
      // Memoria light: pasar últimos 4 intents al engine
      const recentIntents: Intent[] = [];
      for (let i = messages.length - 1; i >= 0 && recentIntents.length < 4; i--) {
        const m = messages[i];
        if (m.role === 'bot' && m.intent) recentIntents.unshift(m.intent);
      }
      const result = getCoachResult(text, data, recentIntents);
      const botMsg: Message = {
        role: 'bot',
        text: '', // typewriter va a llenar
        fullText: result.text,
        followUps: result.followUps,
        intent: result.intent,
        ts: Date.now(),
        typed: false,
      };
      setMessages(prev => [...prev, botMsg]);
      setThinking(false);
    }, delay);
  }, [thinking, data, messages]);

  function clearChat() {
    setMessages([]);
    localStorage.removeItem(CHAT_STORAGE_KEY);
  }

  // Voice input
  function toggleVoice() {
    if (listening) {
      recognitionRef.current?.stop?.();
      setListening(false);
      return;
    }
    const r = createRecognition();
    if (!r) return;
    recognitionRef.current = r;
    r.onresult = (e: any) => {
      const t = e.results?.[0]?.[0]?.transcript;
      if (t) {
        setInput(t);
        setTimeout(() => send(t), 100);
      }
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    r.start();
    setListening(true);
  }

  return (
    <>
      <div className="card coach-intro">
        <div className="coach-avatar"><HusuPanda size={36} /></div>
        <div style={{ flex: 1 }}>
          <div className="coach-name">HusuAI</div>
          <div className="coach-tagline">
            Tu coach de hábitos. Conozco todo tu historial — patrones, rachas, lo que se cae. Preguntame lo que quieras.
          </div>
          <button className="sources-btn" onClick={() => setShowSources(true)}>
            📚 Fuentes y ciencia
          </button>
        </div>
      </div>

      {showSources && <SourcesModal onClose={() => setShowSources(false)} />}

      {insight && messages.length === 0 && (
        <div className="proactive-insight">{renderBold(insight)}</div>
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
            O escribime libre — entiendo "qué tal va leer", "compará leer con meditar", "hace cuánto que no entreno", "necesito energía".
            {canSpeak && ' También podés usar el micrófono 🎙.'}
          </div>
        </>
      )}

      {messages.map((m, i) => {
        const isLastBot = m.role === 'bot' && i === messages.length - 1 && !thinking;
        const isTyping = m.role === 'bot' && !m.typed && m.fullText;
        return (
          <div key={i}>
            <div
              className={`chat-bubble ${m.role} ${isTyping ? 'typing' : ''}`}
              onClick={isTyping ? skipTypewriter : undefined}
            >
              {renderBold(m.text)}
              {isTyping && <span className="cursor-blink">▍</span>}
            </div>
            {isLastBot && m.typed && m.followUps && m.followUps.length > 0 && (
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
        {canSpeak && (
          <button
            className={`mic-btn ${listening ? 'listening' : ''}`}
            onClick={toggleVoice}
            aria-label={listening ? 'Escuchando…' : 'Dictar'}
            title={listening ? 'Toca para parar' : 'Hablar'}
          >
            🎙
          </button>
        )}
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send(input); }}
          placeholder={listening ? 'Escuchando…' : 'Preguntale a HusuAI...'}
          disabled={listening}
        />
        <button className="send-btn" onClick={() => send(input)} disabled={thinking || !input.trim()}>➤</button>
      </div>

      {messages.length > 0 && (
        <button className="config-link" onClick={clearChat}>Nueva conversación</button>
      )}
    </>
  );
}
