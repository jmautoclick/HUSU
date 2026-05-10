import { useMemo, useState } from 'react';
import { TEMPLATES, type HabitTemplate, CATEGORIES, IDENTITIES, IDENTITY_TO_CATEGORIES, TOP_RECOMMENDED_NAMES, CATEGORY_EMOJI } from '../lib/templates';
import { describeFrequency } from '../lib/frequency';

interface Props {
  onComplete: (selected: HabitTemplate[], identity?: string) => void;
  onSkip: () => void;
}

type Step = 'welcome' | 'identity' | 'pick';

const MAX_RECOMMENDED = 5;

export function Onboarding({ onComplete, onSkip }: Props) {
  const [step, setStep] = useState<Step>('welcome');
  const [identity, setIdentity] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const visibleCategories = useMemo(() => {
    if (!identity) return CATEGORIES;
    const preferred = IDENTITY_TO_CATEGORIES[identity] ?? [];
    return [...preferred, ...CATEGORIES.filter(c => !preferred.includes(c))];
  }, [identity]);

  const filteredTemplates = useMemo(() => {
    if (activeCategory === 'all') {
      if (!identity) return TEMPLATES;
      const preferred = new Set(IDENTITY_TO_CATEGORIES[identity] ?? []);
      return [...TEMPLATES].sort((a, b) => {
        const aPref = preferred.has(a.category) ? 0 : 1;
        const bPref = preferred.has(b.category) ? 0 : 1;
        if (aPref !== bPref) return aPref - bPref;
        const aRec = TOP_RECOMMENDED_NAMES.has(a.name) ? 0 : 1;
        const bRec = TOP_RECOMMENDED_NAMES.has(b.name) ? 0 : 1;
        return aRec - bRec;
      });
    }
    return TEMPLATES.filter(t => t.category === activeCategory);
  }, [activeCategory, identity]);

  function toggle(name: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }

  if (step === 'welcome') {
    return (
      <div className="onboarding-overlay">
        <div className="onboarding-content">
          <div className="onboarding-hero">🐼</div>
          <h1 className="onboarding-title">Hola, soy Husu.</h1>
          <p className="onboarding-sub">
            Te acompaño a construir mejores rutinas, sin presión y a tu ritmo. Empezamos cuando vos quieras.
          </p>
          <button className="btn btn-primary onboarding-cta" onClick={() => setStep('identity')}>Empezar</button>
          <button className="config-link" onClick={onSkip}>Saltar y empezar de cero</button>
        </div>
      </div>
    );
  }

  if (step === 'identity') {
    return (
      <div className="onboarding-overlay">
        <div className="onboarding-content scroll">
          <div className="onboarding-hero" style={{ fontSize: 48 }}>🤔</div>
          <h2 className="onboarding-title-sm" style={{ textAlign: 'center' }}>¿Quién querés ser?</h2>
          <p className="onboarding-sub-sm" style={{ textAlign: 'center', marginBottom: 20 }}>
            Los hábitos que duran nacen de una identidad. Elegí cómo te gustaría verte.
          </p>

          <div className="identity-grid">
            {IDENTITIES.map(id => (
              <button
                key={id}
                className={`identity-chip ${identity === id ? 'selected' : ''}`}
                onClick={() => setIdentity(id)}
              >
                {id}
              </button>
            ))}
          </div>

          <div className="onboarding-footer">
            <button className="btn btn-secondary" onClick={() => setStep('welcome')}>← Atrás</button>
            <button className="btn btn-primary" onClick={() => setStep('pick')} disabled={!identity}>
              Seguir
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tooMany = selected.size > MAX_RECOMMENDED;

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-content scroll">
        <h2 className="onboarding-title-sm">Elegí tus primeros hábitos</h2>
        <p className="onboarding-sub-sm">
          Empezá con pocos. La constancia gana a la cantidad — recomendamos hasta {MAX_RECOMMENDED}.
        </p>

        <div className="category-tabs">
          <button
            className={activeCategory === 'all' ? 'on' : ''}
            onClick={() => setActiveCategory('all')}
          >
            ⭐ Para vos
          </button>
          {visibleCategories.map(c => (
            <button
              key={c}
              className={activeCategory === c ? 'on' : ''}
              onClick={() => setActiveCategory(c)}
            >
              {CATEGORY_EMOJI[c] ?? ''} {c}
            </button>
          ))}
        </div>

        <div className="template-list">
          {filteredTemplates.map(t => {
            const isSelected = selected.has(t.name);
            const isRecommended = TOP_RECOMMENDED_NAMES.has(t.name);
            return (
              <button
                key={t.name}
                className={`template-row ${isSelected ? 'selected' : ''}`}
                onClick={() => toggle(t.name)}
              >
                <span className="template-emoji">{t.emoji}</span>
                <div className="template-info">
                  <div className="template-name">
                    {t.name}
                    {isRecommended && <span className="badge-tag rec">⭐</span>}
                    {t.keystone && <span className="badge-tag keystone" title="Hábito keystone (dispara otros)">🪨</span>}
                  </div>
                  <div className="template-sub">
                    {describeFrequency(t.frequency)} · {t.description}
                  </div>
                  <div className="difficulty-dots" aria-label={`Dificultad ${t.difficulty}`}>
                    {[0, 1, 2].map(i => (
                      <span key={i} className={`dot ${(t.difficulty === 'easy' && i < 1) || (t.difficulty === 'medium' && i < 2) || (t.difficulty === 'hard' && i < 3) ? 'on' : ''}`} />
                    ))}
                  </div>
                </div>
                <span className={`template-check ${isSelected ? 'on' : ''}`}>
                  {isSelected ? '✓' : ''}
                </span>
              </button>
            );
          })}
        </div>

        {tooMany && (
          <div className="warning-banner">
            Elegiste {selected.size}. Se aprende mejor con pocos — podés sumar más después.
          </div>
        )}

        <div className="onboarding-footer">
          <button className="btn btn-secondary" onClick={onSkip}>Empezar de cero</button>
          <button
            className="btn btn-primary"
            onClick={() => onComplete(TEMPLATES.filter(t => selected.has(t.name)), identity ?? undefined)}
            disabled={selected.size === 0}
          >
            Sumar ({selected.size})
          </button>
        </div>
      </div>
    </div>
  );
}
