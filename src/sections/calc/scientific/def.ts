import type { ToolDef } from "@/registry/types";

export const scientificTool: ToolDef = {
  slug: "scientific-calculator",
  component: "calc/scientific",
  icon: "SquareFunction",
  popular: true,
  name: { ru: "Инженерный калькулятор", en: "Scientific calculator" },
  title: { ru: "Инженерный калькулятор онлайн — научный, с историей", en: "Scientific calculator online — with history" },
  h1: { ru: "Инженерный калькулятор онлайн", en: "Scientific calculator" },
  description: {
    ru: "Научный калькулятор онлайн: тригонометрия в градусах и радианах, логарифмы, корни, степени, факториал, скобки и число π. Результат считается при вводе, история сохраняется.",
    en: "Online scientific calculator: trigonometry in degrees or radians, logarithms, roots, powers, factorials, parentheses and π. Results update as you type and history is saved.",
  },
  lead: {
    ru: "Пишите выражение как на бумаге — 2π × sin(30) + √16 = 7,14159… — ответ появляется сразу.",
    en: "Type the expression as you would write it — 2π × sin(30) + √16 = 7.14159… — and the answer appears instantly.",
  },
  keywords: {
    ru: ["инженерный калькулятор", "научный калькулятор", "калькулятор синусов", "калькулятор логарифмов", "калькулятор со скобками"],
    en: ["scientific calculator", "online calculator", "trig calculator", "log calculator", "calculator with parentheses"],
  },
  props: {},
  howTo: {
    ru: [
      "Введите выражение с клавиатуры или кнопками: числа, скобки, функции sin, log, √ и другие.",
      "Выберите единицы углов — градусы (DEG) или радианы (RAD).",
      "Результат показывается сразу; Enter или «=» сохраняет вычисление в историю.",
      "Нажмите на запись в истории, чтобы вернуть выражение для правки.",
    ],
    en: [
      "Type an expression or use the buttons: numbers, parentheses, sin, log, √ and more.",
      "Choose the angle unit — degrees (DEG) or radians (RAD).",
      "The result appears as you type; Enter or = saves it to your history.",
      "Click a history entry to bring the expression back for editing.",
    ],
  },
  about: {
    ru: [
      "Калькулятор разбирает выражение по правилам математики: сначала скобки и функции, затем степени (справа налево), умножение и деление, потом сложение и вычитание. Знак умножения можно не писать: 2π, 3(1 + 2), 2sin(30).",
      "Тригонометрия работает в градусах и радианах; для «круглых» углов результат точный: sin 180° = 0, а не 1,2·10⁻¹⁶. log — десятичный логарифм, ln — натуральный, а log(x; b) считает по любому основанию.",
      "Клавиатура калькулятора реагирует, только когда поле ввода в фокусе, — остальные сочетания клавиш на странице не перехватываются. История вычислений хранится в вашем браузере.",
    ],
    en: [
      "Expressions follow the usual order of operations: parentheses and functions first, then powers (right to left), multiplication and division, then addition and subtraction. You can omit the multiplication sign: 2π, 3(1 + 2), 2sin(30).",
      "Trigonometry works in degrees or radians, with exact results for common angles: sin 180° = 0 rather than 1.2e−16. log is base 10, ln is natural, and log(x, b) uses any base.",
      "Keyboard input only works while the expression field has focus — no other shortcuts on the page are captured. Your history is stored in your browser.",
    ],
  },
  faq: {
    ru: [
      { q: "Как посчитать синус в градусах?", a: "Выберите режим DEG и введите sin(30) — получится 0,5. В режиме RAD аргумент считается в радианах: sin(π/6) = 0,5." },
      { q: "Чем log отличается от ln?", a: "log — логарифм по основанию 10 (log 100 = 2), ln — натуральный логарифм по основанию e (ln e = 1). Для другого основания используйте log(x; b): log(8; 2) = 3." },
      { q: "Как возвести в степень и извлечь корень?", a: "Степень — знак ^: 2^10 = 1024. Корень — √ или sqrt(): √16 = 4; корень n-й степени — nroot(27; 3) = 3 или 27^(1/3)." },
      { q: "В каком порядке выполняются действия?", a: "Скобки, функции, степени, умножение и деление, сложение и вычитание. Степень выполняется справа налево: 2^3^2 = 2^9 = 512, а −2^2 = −4." },
    ],
    en: [
      { q: "How do I calculate sine in degrees?", a: "Choose DEG and type sin(30) to get 0.5. In RAD mode the argument is in radians: sin(π/6) = 0.5." },
      { q: "What is the difference between log and ln?", a: "log is base 10 (log 100 = 2) and ln is the natural logarithm (ln e = 1). For another base use log(x, b): log(8, 2) = 3." },
      { q: "How do I use powers and roots?", a: "Powers use ^: 2^10 = 1024. Roots use √ or sqrt(): √16 = 4; the n-th root is nroot(27, 3) = 3 or 27^(1/3)." },
      { q: "What order are operations done in?", a: "Parentheses, functions, powers, multiplication and division, addition and subtraction. Powers go right to left: 2^3^2 = 2^9 = 512, and −2^2 = −4." },
    ],
  },
  related: ["graphing-calculator", "percentage-calculator", "fraction-calculator", "logarithm-calculator", "equation-solver"],
};
