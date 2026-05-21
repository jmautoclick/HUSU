// IA Coach está temporalmente bloqueado / "Próximamente".
// El código completo del chat con Gemini sigue vivo en:
//   - src/lib/gemini.ts (askGemini, buildSystemContext con guardrails médicos)
//   - src/lib/patterns.ts (detección de patrones para inyectar al LLM)
// Cuando lo reactivemos, restaurar el componente anterior y volver a wire-up onSetKey en App.tsx.

import type { AppData } from '../lib/types';

interface Props {
  data: AppData;
  onSetKey: (key: string) => void;
}

export function IACoach(_: Props) {
  return (
    <div className="coming-soon">
      <div className="coming-soon-hero">🐼💭</div>
      <h2 className="coming-soon-title">HusuAI · Próximamente</h2>
      <p className="coming-soon-sub">
        Tu coach personal de hábitos basado en IA. Va a entender tu historial, detectar patrones
        ("fallás más los lunes", "cumplís todo cuando dormís 7+ hs") y darte recomendaciones
        accionables en español.
      </p>

      <div className="coming-soon-card">
        <div className="coming-soon-eyebrow">Qué va a poder hacer</div>
        <ul className="coming-soon-list">
          <li>📊 Analizar tu mes y darte un resumen accionable</li>
          <li>🔍 Detectar qué día de la semana te cuesta más</li>
          <li>🔗 Encontrar correlaciones entre tus hábitos</li>
          <li>🎯 Sugerir ajustes basados en tus rachas y metas</li>
          <li>📝 Responder preguntas sobre tu progreso</li>
        </ul>
      </div>

      <div className="coming-soon-footnote">
        Mientras tanto, en la pestaña <strong>Stats</strong> ya tenés patrones por día de semana,
        calendario mensual y heatmap anual.
      </div>
    </div>
  );
}
