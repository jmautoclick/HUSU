# Husu Habits — Paquete listo para Claude Design

## Paso a paso

1. **Abrí Claude Design** (claude.ai con vision habilitado).
2. **Pegá el prompt completo** de [`CLAUDE_DESIGN_PROMPT.md`](CLAUDE_DESIGN_PROMPT.md) — Ctrl+A, Ctrl+C, Ctrl+V.
3. **Adjuntá las 11 capturas** de `docs/screenshots/` (drag & drop al chat).
4. Si querés más profundidad, también podés adjuntar `MASTER_RESEARCH.md` y/o `BRANDING_HUSU.md` para que el diseñador entienda las decisiones de identidad.

## Capturas adjuntas (`docs/screenshots/`)

Mobile viewport 390×844 @ 2x (resolución 780×1688).

| # | Archivo | Pantalla | Detalles |
|---|---|---|---|
| 01 | `01-welcome.png` | Onboarding · Welcome | 🐼 panda, "Hola, soy Husu", CTA primary |
| 02 | `02-identity.png` | Onboarding · Identity | "¿Quién querés ser?" + 8 chips identitarios |
| 03 | `03-templates-picker.png` | Onboarding · Templates | 104 hábitos filtrados por identity, badges ⭐🪨, dificultad |
| 04 | `04-registro.png` | Tab Registro | Hábitos con streaks 🔥, "Trabajo profundo" dim "no toca hoy" |
| 05 | `05-stats-mes.png` | Tab Stats · Mes | Patrones por día semana, cards por hábito |
| 06 | `06-stats-ano.png` | Tab Stats · Año | Heatmap anual + streak cards (actual + best) |
| 07 | `07-coach.png` | Tab IA Coach | HusuAI banner + sugerencias chip |
| 08 | `08-habitos.png` | Tab Hábitos | CRUD + datos/apariencia con theme toggle |
| 09 | `09-modal-habito.png` | Modal Editar | Frecuencia tabs, color picker, recordatorio |
| 10 | `10-registro-light.png` | Tema Claro · Registro | Mismo Registro en cream theme |
| 11 | `11-achievements.png` | Stats · Achievements | Badges (9/10 unlocked, 1 lockeado 🔒) |

## Sugerencia de iteración

Si el diseñador quiere ir paso a paso (recomendado por volumen):

**Sprint 1 — Identidad y home (3-4 días)**
- App icon + adaptive icon Android
- Mascota Husu en 6 expresiones (saludando, pensativa, animando, celebrando, acompañando, con corona)
- Mockup Tab Registro rediseñado (la pantalla más vista)
- Mockup Onboarding Welcome con mascota

**Sprint 2 — Stats y Coach (3-4 días)**
- Tab Stats vista Año con heatmap mejorado
- AchievementsPanel "premium" con animación de unlock
- IA Coach con avatar animado + burbujas distintivas

**Sprint 3 — Edge cases y polish (2-3 días)**
- Modales rediseñados (live preview de hábito)
- 3 tipos de toast (streak / achievement / perfect day con confetti)
- Light theme completo en cada pantalla

## Lo que NO está en las capturas pero el diseñador necesita saber

- **Confetti CSS** del perfect day cuando todos los hábitos del día se completan
- **Toast "Escudo activado 🛡️"** cuando se aplica un freeze automático (te lo capturé en una screenshot anterior pero no quedó en la versión actual porque el seed de freezes está vacío)
- **Animación pop del checkbox** al marcar
- **Slide-down de toasts**
- **Bouncing de mascota** en welcome (el del 01 está estático pero el código tiene `@keyframes bounce`)

Todo esto está descripto en `CLAUDE_DESIGN_PROMPT.md` sección "Especificación de animaciones".

## Referencias adicionales

Si el diseñador quiere ir más profundo:
- [`BRANDING_HUSU.md`](BRANDING_HUSU.md) — análisis completo del por qué panda rojo, paleta, voz
- [`UX_PATTERNS.md`](UX_PATTERNS.md) — patrones de Habitify, Finch, Streaks que vale tomar
- [`COMPETITIVE_ANALYSIS.md`](COMPETITIVE_ANALYSIS.md) — qué hace bien y mal cada competidor
- [`MASTER_RESEARCH.md`](MASTER_RESEARCH.md) — síntesis estratégica de todo
