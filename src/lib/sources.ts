// Fuentes y citas de la información científica/médica que usa el Coach.
// Requerido por App Store Guideline 1.4.1 (Safety - Physical Harm): toda app
// con info de salud debe incluir citas + links funcionales a las fuentes,
// fáciles de encontrar. Se muestran en la pantalla "Fuentes y ciencia" del Coach.

export const MEDICAL_DISCLAIMER =
  'La información de Husu es educativa y motivacional. No reemplaza el consejo, ' +
  'diagnóstico ni tratamiento de un profesional de la salud. Ante cualquier duda ' +
  'o síntoma, consultá a un profesional. En una emergencia, contactá a los ' +
  'servicios locales (en Argentina, 107 / SAME o 911).';

export interface Source {
  topic: string;     // qué afirmación respalda
  citation: string;  // cita formal
  url: string;       // link funcional a la fuente
}

export const SOURCES: Source[] = [
  {
    topic: 'Hábitos basados en identidad, regla de los 2 minutos, las 4 leyes del cambio y habit stacking',
    citation: 'Clear, J. (2018). Atomic Habits. Penguin Random House.',
    url: 'https://jamesclear.com/atomic-habits',
  },
  {
    topic: 'Cuánto tarda en formarse un hábito: mediana de ~66 días (no 21)',
    citation: 'Lally, P., van Jaarsveld, C. H. M., Potts, H. W. W., & Wardle, J. (2010). How are habits formed: Modelling habit formation in the real world. European Journal of Social Psychology, 40(6), 998–1009. (University College London)',
    url: 'https://onlinelibrary.wiley.com/doi/10.1002/ejsp.674',
  },
  {
    topic: 'El entorno y el contexto influyen más que la fuerza de voluntad',
    citation: 'Wood, W., & Neal, D. T. (2007). A new look at habits and the habit–goal interface. Psychological Review, 114(4), 843–863. (University of Southern California)',
    url: 'https://doi.org/10.1037/0033-295X.114.4.843',
  },
  {
    topic: 'Hábitos keystone (piedra angular) que disparan otros cambios',
    citation: 'Duhigg, C. (2012). The Power of Habit. Random House.',
    url: 'https://charlesduhigg.com/the-power-of-habit/',
  },
  {
    topic: 'Intenciones de implementación ("cuando pase X, voy a hacer Y")',
    citation: 'Gollwitzer, P. M., & Sheeran, P. (2006). Implementation intentions and goal achievement: A meta-analysis of effects and processes. Advances in Experimental Social Psychology, 38, 69–119.',
    url: 'https://doi.org/10.1016/S0065-2601(06)38002-1',
  },
  {
    topic: 'Temptation bundling: combinar lo que tenés que hacer con lo que disfrutás',
    citation: 'Milkman, K. L., Minson, J. A., & Volpp, K. G. M. (2014). Holding the Hunger Games Hostage at the Gym: An Evaluation of Temptation Bundling. Management Science, 60(2), 283–299.',
    url: 'https://doi.org/10.1287/mnsc.2013.1784',
  },
  {
    topic: 'El compromiso público aumenta el cumplimiento de metas',
    citation: 'Klein, H. J., Wesson, M. J., Hollenbeck, J. R., & Alge, B. J. (1999). Goal commitment and the goal-setting process: A meta-analysis. Journal of Applied Psychology, 84(6), 885–896.',
    url: 'https://doi.org/10.1037/0021-9010.84.6.885',
  },
  {
    topic: 'Ningún nivel de consumo de alcohol es seguro para la salud',
    citation: 'Organización Mundial de la Salud (OMS / WHO), enero 2023. "No level of alcohol consumption is safe for our health."',
    url: 'https://www.who.int/europe/news/item/04-01-2023-no-level-of-alcohol-consumption-is-safe-for-our-health',
  },
  {
    topic: 'Actividad física: el beneficio de los pasos diarios se estabiliza alrededor de ~7.500/día',
    citation: 'Lee, I-M., Shiroma, E. J., Kamada, M., et al. (2019). Association of Step Volume and Intensity With All-Cause Mortality in Older Women. JAMA Internal Medicine, 179(8), 1105–1112.',
    url: 'https://jamanetwork.com/journals/jamainternalmedicine/fullarticle/2734709',
  },
  {
    topic: 'Las pantallas y la luz antes de dormir afectan el sueño',
    citation: 'Sleep Foundation — How Electronics Affect Sleep.',
    url: 'https://www.sleepfoundation.org/how-sleep-works/how-electronics-affect-sleep',
  },
  {
    topic: 'El tamaño de la porción y del plato influye en cuánto comemos',
    citation: 'Hollands, G. J., Shemilt, I., Marteau, T. M., et al. (2015). Portion, package or tableware size for changing selection and consumption of food, alcohol and tobacco. Cochrane Database of Systematic Reviews, (9): CD011045.',
    url: 'https://doi.org/10.1002/14651858.CD011045.pub2',
  },
];
