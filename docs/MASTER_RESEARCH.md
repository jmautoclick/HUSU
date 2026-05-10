# Husu Habits — Síntesis de Investigación

> Consolidación de 6 dossiers de research. Lee solo este si tenés 10 minutos. Si tenés más tiempo, los docs detallados están abajo.

## Documentos fuente

| Doc | Foco |
|---|---|
| [COMPETITIVE_ANALYSIS.md](COMPETITIVE_ANALYSIS.md) | 12 apps comparadas + gaps + posicionamiento |
| [HABIT_SCIENCE.md](HABIT_SCIENCE.md) | 8 modelos canónicos + Lally 66 días + anti-mitos |
| [MEDICAL_GUIDELINES.md](MEDICAL_GUIDELINES.md) | WHO/CDC/AHA con citas verificables |
| [HABIT_LIBRARY.md](HABIT_LIBRARY.md) + `.json` | 104 templates en 12 categorías + 4 kits |
| [UX_PATTERNS.md](UX_PATTERNS.md) | 10 clusters + top 15 ideas accionables |
| [BRANDING_HUSU.md](BRANDING_HUSU.md) | Mascota, paleta, voz, tipografía |

---

## Decisiones LOCKED (no más debate)

### Identidad

- **Mascota oficial:** Husu = **panda rojo** 🐼 (espacio vacío en wellness, encaje fonético Himalaya, silueta icónica a 48-512dp).
- **Personalidad:** compañero, no jefe. Adulto curioso, observador, persistente sin presión. Voseo argentino. Calmo, breve, no culpógeno, no infantilizante.
- **Tipografía:** **Fraunces** (display serif cálido editorial) + **Nunito** (UI sans rounded). Google Fonts, self-hosteables.

### Paleta oficial

| Token | HEX | Uso |
|---|---|---|
| `husu-clay` | `#C97B5A` | Brand accent, CTA primario |
| `husu-cream` | `#F5EFE6` | Background light theme |
| `husu-ink` | `#2A2823` | Texto principal, dark BG |
| `sage` | `#7A9B7E` | Soporte success/calm |
| `sand` | `#E8DCC4` | Soporte neutral |
| `dusk` | `#4A5568` | Soporte text-dim |
| `ember` | `#E5A04C` | Soporte streak/heat |
| `mist` | `#B8C5C1` | Soporte info |

WCAG AA verificado. Reemplaza el gradiente naranja-rojo actual.

### Posicionamiento + tagline

> **"Hábitos en español, con un coach que sí te escucha. Sin suscripciones abusivas, sin RPGs distractores, sin castigarte por ser humano."**

3 diferenciadores defendibles vs el rubro:
1. **AI Coach con Gemini contextual** (nadie más tiene LLM real entendiendo historial)
2. **Español rioplatense genuino** (LATAM virgen, todos los líderes son traducciones literales)
3. **Compañero, no jefe** (calmo + privado + sin feed social vs Habitica gamer-y / Streaks austero iOS-only)

---

## Gaps cierto vs el rubro (oportunidades top)

Del análisis competitivo + UX research:

| # | Feature | Estado en Husu | Estado en competencia | Acción |
|---|---|---|---|---|
| 1 | AI Coach con LLM real contextual | ✅ Tenemos | ❌ Nadie | **Mantener + amplificar** (Sunday Recap, pattern detection) |
| 2 | Identity-based onboarding | ❌ Falta | ❌ Mayoría falla | **Implementar urgente** — 2.7x retención a 6 meses |
| 3 | Streak Freeze auto y gratis | ❌ Falta | ⚠️ Algunos pagos, otros toscos | **Implementar urgente** — Duolingo: -21% churn, NUNCA paywall |
| 4 | One-tap check desde notificación | ❌ Falta | ⚠️ Pocos | Implementar — fricción <5s clave para retención |
| 5 | Widget Android home | ❌ Falta | ⚠️ HabitNow, Loop tienen | P2, esfuerzo XL |
| 6 | Sunday Recap shareable | ❌ Falta | ❌ Casi nadie | Spotify Wrapped style + AI insights |
| 7 | Habit grouping por momento del día | ❌ Falta | ✅ Habitify lo hace bien | Considerar para Registro |
| 8 | Implementation intentions ("cuándo/dónde") | ❌ Falta | ❌ Nadie | Effect size d=0.65 — campo opcional en modal |
| 9 | Templates con difficulty + keystone tags | ❌ Falta | ❌ Nadie | Sumar al modelo + visual badges |
| 10 | Skip-day sin romper streak (grace period) | ❌ Falta | ❌ Mayoría no lo tiene | Queja #1 en reviews — decisión brand-defining |

---

## Correcciones requeridas en lo ya implementado

### Templates actuales (tienen errores médicos)

Los 15 templates actuales necesitan ajustes según WHO/CDC/AHA citados en MEDICAL_GUIDELINES.md:

| Template actual | Problema | Corrección |
|---|---|---|
| "Tomar 2L de agua" | "8 vasos / 2L" no es guideline | Cambiar a "Hidratación: 2-2.5L" o separar por género |
| Implícito 10k pasos en futuras versiones | Mito de marketing (Lee 2019 plateau ~7.500) | Default 7.500, no 10.000 |
| "No alcohol" | Copy puede sonar puritano | OK como está, pero AI Coach NUNCA debe decir "una copita está bien" — WHO 2023 |

### Reemplazar templates por library expandida

`src/lib/templates.ts` actualmente tiene 15. La nueva library tiene **104 templates en 12 categorías** con campos extra (`difficulty`, `keystone`, `description`, `recommendedFor`). Hay que extender la interfaz `HabitTemplate` y migrar.

---

## Anti-patterns flagged (NO hacer jamás)

1. **Snapchat hourglass / countdown a perder racha** — toxico, genera ansiedad. (UX research)
2. **Paywall sobre features básicas (3-4 hábitos free)** — queja #1 en reviews 2024-26 del rubro
3. **Gamification RPG densa estilo Habitica** — research académico muestra "counterproductive effects" en adultos
4. **Notification spam genérico** — "no te olvides!" sin contexto = uninstall
5. **Traducción literal robótica** — todas las apps top fallan acá en español
6. **Streak shame / "broke your X-day streak" rojo** — recovery sí, vergüenza no
7. **Mostrar "una copita está bien"** — WHO 2023 retiró safe levels para alcohol

---

## Insights que cambian el roadmap

### El día 66, no el 21

Lally et al. 2010 (UCL): mediana 66 días para automatizar un hábito (rango 18-254). **Habría que celebrar el día 66 con un achievement especial**, no usar el folk "21 días" como benchmark.

### Identity > Action

Atomic Habits research: usuarios que dicen "soy alguien que medita" sostienen el hábito 2.7x más que "voy a meditar". **Onboarding tiene que preguntar identidad antes que acción**.

### Implementation intentions tienen el mejor effect size de behavior change

Gollwitzer meta-analysis: d=0.65 — muy alto. **Modal de hábito debería tener campo opcional "cuándo / dónde"** ("cuando termine de cenar, voy a leer en el sillón").

### Streak protection no es opinión

Duolingo (Penn/UCLA research): streak freeze auto y gratis = **-21% churn**. Critical: NUNCA monetizarlo, sino se convierte en manipulación.

### 3-5 hábitos máximo en onboarding

No hay RCT canónico, pero literatura aplicada (cognitive load + decision fatigue) converge en **no sugerir más de 3-5 hábitos iniciales**. La picker actual permite seleccionar todos los 15 — habría que limitar visualmente o avisar "empezá con pocos".

---

## Próximos pasos sugeridos

Hay 3 caminos:

**A) Implementar TODO del research antes del diseño (Wave 5+6)**
~12-15 hs adicionales: identity onboarding, streak freeze, library expandida 104 templates, implementation intentions, sunday recap, habit grouping, fixes médicos, paleta nueva en CSS.

**B) Implementar solo lo CRÍTICO (Wave 5 mínima)**
~4-6 hs: identity onboarding step, streak freeze, library expandida, fixes médicos. Dejar widget, recap, habit grouping para después del diseño.

**C) Ir directo a diseño con lo actual + plan futuro**
0 hs implementación. Pasar el prompt actualizado a Claude Design y meter los features post-diseño. Riesgo: el diseñador no ve algunas pantallas que vamos a necesitar.

**Recomendación:** **B**. Los 4 críticos son brand-defining y todos modifican pantallas que el diseñador necesita ver para diseñar coherente. Widget, recap y notification UX son post-diseño OK.

Ver [FEATURES_BACKLOG_V2.md](FEATURES_BACKLOG_V2.md) para detalle de cada feature priorizada.
