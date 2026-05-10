import type { Frequency } from './types';
import raw from './templates.json';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface HabitTemplate {
  emoji: string;
  name: string;
  category: string;
  frequency: Frequency;
  monthlyGoal: number;
  difficulty: Difficulty;
  keystone: boolean;
  description: string;
  recommendedFor: string[];
}

export const TEMPLATES: HabitTemplate[] = raw as HabitTemplate[];

export const CATEGORIES = [
  'Sueño',
  'Movimiento y ejercicio',
  'Nutrición',
  'Salud mental',
  'Productividad y trabajo',
  'Aprendizaje',
  'Vínculos y relaciones',
  'Hábitos de evitación',
  'Hogar y entorno',
  'Finanzas',
  'Salud preventiva',
  'Espiritual',
] as const;

export const CATEGORY_EMOJI: Record<string, string> = {
  'Sueño': '🌙',
  'Movimiento y ejercicio': '🏃',
  'Nutrición': '🥗',
  'Salud mental': '🧘',
  'Productividad y trabajo': '💼',
  'Aprendizaje': '📚',
  'Vínculos y relaciones': '🤝',
  'Hábitos de evitación': '🚫',
  'Hogar y entorno': '🏠',
  'Finanzas': '💰',
  'Salud preventiva': '🩺',
  'Espiritual': '✨',
};

export const TOP_RECOMMENDED_NAMES = new Set<string>([
  'Dormir 7+ horas',
  'Caminar 30 minutos',
  'Tomar 2L de agua',
  'Comer 5 porciones de fruta y verdura',
  'Meditar 10 minutos',
  'Leer 20 minutos',
  'Tender la cama',
  'Estirar 10 minutos',
  'No fumar',
  'Sin alcohol',
  'Journaling de 5 minutos',
  'Gratitud diaria',
  'Llamar a alguien querido',
  'Salir a la naturaleza',
  'Cocinar en casa',
  'Registrar gastos',
  'Sin pantallas 1 hora antes de dormir',
  'Levantarme a la misma hora',
  'Entrenamiento de fuerza',
  'Planear el día siguiente',
]);

export const IDENTITY_TO_CATEGORIES: Record<string, string[]> = {
  'Alguien que se cuida': ['Sueño', 'Nutrición', 'Salud mental', 'Salud preventiva'],
  'Alguien constante': ['Sueño', 'Movimiento y ejercicio', 'Productividad y trabajo'],
  'Alguien presente': ['Salud mental', 'Vínculos y relaciones', 'Espiritual'],
  'Alguien curioso': ['Aprendizaje', 'Espiritual'],
  'Alguien fuerte': ['Movimiento y ejercicio', 'Hábitos de evitación', 'Salud preventiva'],
  'Alguien en paz': ['Salud mental', 'Sueño', 'Espiritual'],
  'Alguien organizado': ['Productividad y trabajo', 'Hogar y entorno', 'Finanzas'],
  'Alguien libre': ['Hábitos de evitación', 'Finanzas', 'Salud mental'],
};

export const IDENTITIES = Object.keys(IDENTITY_TO_CATEGORIES);
