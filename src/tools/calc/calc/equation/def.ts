import type { Locale } from "@/i18n/config";
import type { Block, QA, ToolDef, VariantDef } from "@/registry/types";
import { complexText, cubic, num, poly, quadratic } from "../algebra/poly";

function quadTable(locale: Locale): Block {
  const ru = locale === "ru";
  const ex: [number, number, number][] = [
    [1, -3, 2],
    [1, -5, 6],
    [2, -7, 3],
    [1, -4, 4],
    [1, 0, -9],
    [1, -3, 1],
    [1, 2, 5],
    [1, 1, 1],
    [3, 0, 12],
  ];
  return {
    type: "table",
    title: ru ? "Примеры квадратных уравнений" : "Quadratic equation examples",
    head: ru ? ["Уравнение", "D", "Корни"] : ["Equation", "D", "Roots"],
    rows: ex.map(([a, b, c]) => {
      const r = quadratic(locale, a, b, c);
      const same = r.roots[0].re === r.roots[1].re && r.roots[0].im === r.roots[1].im;
      return [`${poly(locale, [a, b, c])} = 0`, num(locale, r.D), r.exact ? `x = ${r.exact}` : same ? `x = ${complexText(locale, r.roots[0])}` : r.roots.map((z) => complexText(locale, z)).join("; ")];
    }),
  };
}

function cubicTable(locale: Locale): Block {
  const ru = locale === "ru";
  const ex: [number, number, number, number][] = [
    [1, -6, 11, -6],
    [1, 0, 0, -8],
    [1, 0, 0, 1],
    [1, -3, 3, -1],
    [2, -3, -3, 2],
    [1, 0, -7, 6],
  ];
  return {
    type: "table",
    title: ru ? "Примеры кубических уравнений" : "Cubic equation examples",
    head: ru ? ["Уравнение", "Корни"] : ["Equation", "Roots"],
    rows: ex.map(([a, b, c, d]) => [`${poly(locale, [a, b, c, d])} = 0`, cubic(a, b, c, d).roots.map((z) => complexText(locale, z, 4)).join("; ")]),
  };
}

/** "2x + 3y − z" from coefficients and variable names. */
function lin(locale: Locale, coeffs: number[], vars: string[]): string {
  const parts: string[] = [];
  coeffs.forEach((c, i) => {
    if (c === 0) return;
    const abs = Math.abs(c);
    const term = `${abs === 1 ? "" : num(locale, abs)}${vars[i]}`;
    if (parts.length === 0) parts.push(c < 0 ? `−${term}` : term);
    else parts.push(c < 0 ? `− ${term}` : `+ ${term}`);
  });
  return parts.join(" ") || "0";
}

function det2(a: number, b: number, c: number, d: number): number {
  return a * d - b * c;
}

function det3(m: number[][]): number {
  return m[0][0] * det2(m[1][1], m[1][2], m[2][1], m[2][2]) - m[0][1] * det2(m[1][0], m[1][2], m[2][0], m[2][2]) + m[0][2] * det2(m[1][0], m[1][1], m[2][0], m[2][1]);
}

function linearTable(locale: Locale): Block {
  const ru = locale === "ru";
  const ex: [number, number, number][] = [
    [2, 3, 11],
    [5, -7, 18],
    [3, -9, 12],
    [-4, 10, 2],
    [0.5, 1, 4],
    [7, 2, 2],
    [6, -3, 0],
    [1.5, -4.5, 3],
  ];
  return {
    type: "table",
    title: ru ? "Примеры линейных уравнений" : "Linear equation examples",
    head: ru ? ["Уравнение", "Шаг", "Ответ"] : ["Equation", "Step", "Answer"],
    rows: ex.map(([a, b, c]) => [`${poly(locale, [a, b])} = ${num(locale, c)}`, `${poly(locale, [a, 0])} = ${num(locale, c - b)}`, `x = ${num(locale, (c - b) / a, 4)}`]),
  };
}

function system2Table(locale: Locale): Block {
  const ru = locale === "ru";
  const ex: [number, number, number, number, number, number][] = [
    [2, 3, 13, 1, -1, -1],
    [1, 1, 10, 1, -1, 2],
    [3, -2, 4, 5, 1, 11],
    [4, 1, 9, 2, 3, 7],
    [1, 2, 4, 2, 4, 8],
    [1, 2, 4, 2, 4, 9],
  ];
  return {
    type: "table",
    title: ru ? "Примеры систем 2×2" : "2×2 system examples",
    head: ru ? ["Система", "Δ", "Решение"] : ["System", "Δ", "Solution"],
    rows: ex.map(([a1, b1, c1, a2, b2, c2]) => {
      const d = det2(a1, b1, a2, b2);
      const sys = `${lin(locale, [a1, b1], ["x", "y"])} = ${num(locale, c1)}; ${lin(locale, [a2, b2], ["x", "y"])} = ${num(locale, c2)}`;
      if (d !== 0) return [sys, num(locale, d), `x = ${num(locale, det2(c1, b1, c2, b2) / d, 4)}, y = ${num(locale, det2(a1, c1, a2, c2) / d, 4)}`];
      const same = det2(a1, c1, a2, c2) === 0 && det2(c1, b1, c2, b2) === 0;
      return [sys, "0", same ? (ru ? "бесконечно много" : "infinitely many") : ru ? "нет решений" : "no solution"];
    }),
  };
}

function system3Table(locale: Locale): Block {
  const ru = locale === "ru";
  const ex: [number[][], number[]][] = [
    [[[1, 1, 1], [0, 2, 5], [2, 5, -1]], [6, -4, 27]],
    [[[2, 1, -1], [-3, -1, 2], [-2, 1, 2]], [8, -11, -3]],
    [[[1, 2, 3], [2, -1, 1], [3, 0, -1]], [14, 3, 0]],
    [[[1, 1, 0], [0, 1, 1], [1, 0, 1]], [3, 5, 4]],
  ];
  const V = ["x", "y", "z"];
  return {
    type: "table",
    title: ru ? "Примеры систем 3×3" : "3×3 system examples",
    head: ru ? ["Система", "Δ", "Решение"] : ["System", "Δ", "Solution"],
    rows: ex.map(([m, c]) => {
      const d = det3(m);
      const sys = m.map((row, i) => `${lin(locale, row, V)} = ${num(locale, c[i])}`).join("; ");
      const sol = V.map((v, k) => `${v} = ${num(locale, det3(m.map((row, i) => row.map((x, j) => (j === k ? c[i] : x)))) / d, 4)}`).join(", ");
      return [sys, num(locale, d), sol];
    }),
  };
}

interface VText {
  name: [string, string];
  title: [string, string];
  h1: [string, string];
  description: [string, string];
  lead: [string, string];
  faq: [QA[], QA[]];
  blocks?: (locale: Locale) => Block[];
}

const V: Record<string, VText> = {
  linear: {
    name: ["Линейное уравнение", "Linear equation"],
    title: ["Решение линейных уравнений онлайн — с шагами", "Linear equation solver — step by step"],
    h1: ["Решение линейного уравнения", "Linear equation solver"],
    description: [
      "Решите уравнение вида ax + b = c: x = (c − b) / a. Калькулятор показывает шаги и разбирает особые случаи, когда решений нет или подходит любое x.",
      "Solve an equation of the form ax + b = c: x = (c − b) / a. The solver shows the steps and handles the special cases of no solution or every x being a solution.",
    ],
    lead: ["2x + 3 = 11 → 2x = 8 → x = 4.", "2x + 3 = 11 → 2x = 8 → x = 4."],
    faq: [
      [
        { q: "Как решить линейное уравнение?", a: "Перенесите число без x в правую часть и разделите на коэффициент при x: 5x − 7 = 18 → 5x = 25 → x = 5." },
        { q: "Когда у линейного уравнения нет решений?", a: "Когда коэффициент при x равен нулю, а числа слева и справа разные: 0·x + 3 = 5. Если числа равны, подходит любое x." },
      ],
      [
        { q: "How do I solve a linear equation?", a: "Move the constant to the right-hand side and divide by the coefficient of x: 5x − 7 = 18 → 5x = 25 → x = 5." },
        { q: "When does a linear equation have no solution?", a: "When the coefficient of x is zero and the two sides differ: 0·x + 3 = 5. If they are equal, every x works." },
      ],
    ],
    blocks: (locale) => [linearTable(locale)],
  },
  quadratic: {
    name: ["Квадратное уравнение", "Quadratic equation"],
    title: ["Решение квадратных уравнений онлайн — дискриминант", "Quadratic equation solver — discriminant and roots"],
    h1: ["Решение квадратного уравнения", "Quadratic equation solver"],
    description: [
      "Решите квадратное уравнение ax² + bx + c = 0 через дискриминант: действительные и комплексные корни, точная запись с корнем вроде (3 ± √5) / 2 и решение по шагам.",
      "Solve ax² + bx + c = 0 with the discriminant: real and complex roots, exact radical form such as (3 ± √5) / 2, and a step-by-step solution.",
    ],
    lead: ["x² − 3x + 2 = 0: D = 1, корни 1 и 2; при D < 0 корни комплексные — x² + 2x + 5 = 0 даёт x = −1 ± 2i.", "x² − 3x + 2 = 0: D = 1, roots 1 and 2; when D < 0 the roots are complex — x² + 2x + 5 = 0 gives x = −1 ± 2i."],
    faq: [
      [
        { q: "Как найти дискриминант?", a: "D = b² − 4ac. Для 2x² − 7x + 3 = 0: D = 49 − 24 = 25, корни (7 ± 5) / 4 — то есть 3 и 0,5." },
        { q: "Что делать, если дискриминант отрицательный?", a: "Действительных корней нет, но есть два комплексно-сопряжённых: x = −b/2a ± i·√(−D)/2a. Для x² + 2x + 5 = 0: x = −1 ± 2i." },
        { q: "Что значит D = 0?", a: "Уравнение имеет один корень (два совпадающих): x = −b / 2a. Например, x² − 4x + 4 = 0 → x = 2." },
      ],
      [
        { q: "How do I find the discriminant?", a: "D = b² − 4ac. For 2x² − 7x + 3 = 0: D = 49 − 24 = 25 and the roots are (7 ± 5) / 4, i.e. 3 and 0.5." },
        { q: "What if the discriminant is negative?", a: "There are no real roots but two complex conjugate ones: x = −b/2a ± i·√(−D)/2a. For x² + 2x + 5 = 0: x = −1 ± 2i." },
        { q: "What does D = 0 mean?", a: "There is one repeated root: x = −b / 2a. For example, x² − 4x + 4 = 0 → x = 2." },
      ],
    ],
    blocks: (locale) => [quadTable(locale)],
  },
  cubic: {
    name: ["Кубическое уравнение", "Cubic equation"],
    title: ["Решение кубических уравнений онлайн — формула Кардано", "Cubic equation solver — Cardano's formula"],
    h1: ["Решение кубического уравнения", "Cubic equation solver"],
    description: [
      "Найдите все три корня уравнения ax³ + bx² + cx + d = 0 — действительные и комплексные — по формуле Кардано или тригонометрическим способом, с разбором по шагам.",
      "Find all three roots of ax³ + bx² + cx + d = 0 — real and complex — with Cardano's formula or the trigonometric method, with the working shown.",
    ],
    lead: ["x³ − 6x² + 11x − 6 = 0 имеет корни 1, 2 и 3; x³ + 1 = 0 — корень −1 и пара 0,5 ± 0,866i.", "x³ − 6x² + 11x − 6 = 0 has roots 1, 2 and 3; x³ + 1 = 0 has −1 and the pair 0.5 ± 0.866i."],
    faq: [
      [
        { q: "Сколько корней у кубического уравнения?", a: "Всегда три с учётом кратности и комплексных: либо три действительных, либо один действительный и два комплексно-сопряжённых." },
        { q: "Как решается кубическое уравнение?", a: "Заменой x = t − b/3a уравнение приводится к виду t³ + pt + q = 0, затем применяется формула Кардано или тригонометрическая формула — в зависимости от знака Δ = (q/2)² + (p/3)³." },
      ],
      [
        { q: "How many roots does a cubic have?", a: "Always three counting multiplicity and complex roots: either three real roots or one real and two complex conjugates." },
        { q: "How is a cubic solved?", a: "The substitution x = t − b/3a gives t³ + pt + q = 0, then Cardano's formula or the trigonometric formula is used depending on the sign of Δ = (q/2)² + (p/3)³." },
      ],
    ],
    blocks: (locale) => [cubicTable(locale)],
  },
  "system-2x2": {
    name: ["Система 2×2", "2×2 system"],
    title: ["Решение системы двух уравнений онлайн — метод Крамера", "Solve a system of 2 linear equations — Cramer's rule"],
    h1: ["Решение системы двух линейных уравнений", "System of two linear equations solver"],
    description: [
      "Решите систему двух линейных уравнений с двумя неизвестными методом Крамера: определители Δ, Δx, Δy и точный ответ. Определяет, если решений нет или их бесконечно много.",
      "Solve a system of two linear equations in two unknowns with Cramer's rule: determinants Δ, Δx, Δy and an exact answer, including no-solution and infinite cases.",
    ],
    lead: ["2x + 3y = 13 и x − y = −1: Δ = −5, x = 2, y = 3.", "2x + 3y = 13 and x − y = −1: Δ = −5, x = 2, y = 3."],
    faq: [
      [
        { q: "Как решить систему уравнений методом Крамера?", a: "Найдите главный определитель Δ = a₁b₂ − a₂b₁, затем Δx и Δy, заменяя столбец коэффициентов свободными членами. x = Δx/Δ, y = Δy/Δ." },
        { q: "Что если определитель равен нулю?", a: "Прямые параллельны (решений нет) или совпадают (решений бесконечно много). Калькулятор определяет вариант по рангу матрицы." },
      ],
      [
        { q: "How does Cramer's rule work?", a: "Compute Δ = a₁b₂ − a₂b₁, then Δx and Δy by replacing a column with the constants. x = Δx/Δ and y = Δy/Δ." },
        { q: "What if the determinant is zero?", a: "The lines are parallel (no solution) or the same line (infinitely many). The calculator decides using the matrix rank." },
      ],
    ],
    blocks: (locale) => [system2Table(locale)],
  },
  "system-3x3": {
    name: ["Система 3×3", "3×3 system"],
    title: ["Решение системы трёх уравнений с тремя неизвестными", "Solve a 3×3 system of linear equations"],
    h1: ["Решение системы трёх линейных уравнений", "3×3 linear system solver"],
    description: [
      "Решите систему трёх линейных уравнений с тремя неизвестными по формулам Крамера: определители, точный ответ в обыкновенных дробях и проверка на несовместность.",
      "Solve three linear equations in three unknowns with Cramer's rule: determinants, an exact answer in fractions, and a check for inconsistent or dependent systems.",
    ],
    lead: ["x + y + z = 6, 2y + 5z = −4, 2x + 5y − z = 27 → x = 5, y = 3, z = −2.", "x + y + z = 6, 2y + 5z = −4, 2x + 5y − z = 27 → x = 5, y = 3, z = −2."],
    faq: [
      [
        { q: "Как решить систему из трёх уравнений?", a: "Методом Крамера: вычислите определитель матрицы коэффициентов Δ и три определителя Δx, Δy, Δz; каждое неизвестное равно отношению соответствующего определителя к Δ." },
        { q: "Можно ли вводить дроби?", a: "Да: 1/2, 0,75, −3. Вычисления точные, поэтому ответ тоже может быть обыкновенной дробью." },
      ],
      [
        { q: "How do I solve three equations in three unknowns?", a: "With Cramer's rule: compute the determinant Δ of the coefficient matrix and Δx, Δy, Δz; each unknown is its determinant divided by Δ." },
        { q: "Can I enter fractions?", a: "Yes: 1/2, 0.75, −3. The arithmetic is exact, so the answer may be a fraction too." },
      ],
    ],
    blocks: (locale) => [system3Table(locale)],
  },
};

function variants(): VariantDef[] {
  return Object.entries(V).map(([slug, x]) => ({
    slug,
    name: { ru: x.name[0], en: x.name[1] },
    title: { ru: x.title[0], en: x.title[1] },
    h1: { ru: x.h1[0], en: x.h1[1] },
    description: { ru: x.description[0], en: x.description[1] },
    lead: { ru: x.lead[0], en: x.lead[1] },
    props: { mode: slug },
    faq: { ru: x.faq[0], en: x.faq[1] },
    blocks: x.blocks,
  }));
}

export const equationTool: ToolDef = {
  slug: "equation-solver",
    seoAlt: { ru: ["калькулятор уравнений", "калькулятор"], en: ["equation calculator", "calculator"] },
  component: "calc/equation",
  icon: "Sigma",
  popular: true,
  name: { ru: "Решение уравнений", en: "Equation solver" },
  title: { ru: "Решение уравнений онлайн — квадратные, кубические, системы", en: "Equation solver — quadratic, cubic and linear systems" },
  h1: { ru: "Решение уравнений онлайн", en: "Online equation solver" },
  description: {
    ru: "Решайте линейные, квадратные и кубические уравнения, системы 2×2 и 3×3 с решением по шагам: дискриминант, комплексные корни, формула Кардано, метод Крамера.",
    en: "Solve linear, quadratic and cubic equations and 2×2 or 3×3 linear systems step by step: discriminant, complex roots, Cardano's formula and Cramer's rule.",
  },
  lead: {
    ru: "Введите коэффициенты — корни и решение по шагам появятся сразу, включая комплексные корни.",
    en: "Enter the coefficients — the roots and a step-by-step solution appear instantly, complex roots included.",
  },
  keywords: {
    ru: ["решение уравнений онлайн", "квадратное уравнение", "дискриминант", "кубическое уравнение", "система уравнений", "метод Крамера"],
    en: ["equation solver", "quadratic formula", "discriminant", "cubic equation", "system of equations", "cramer's rule"],
  },
  props: { mode: "quadratic" },
  howTo: {
    ru: [
      "Выберите тип: линейное, квадратное, кубическое уравнение или система 2×2 / 3×3.",
      "Введите коэффициенты — целые, десятичные или дроби вроде 1/2.",
      "Корни появляются сразу; для квадратного уравнения — и в точной записи с корнем.",
      "Ниже — решение по шагам, которое можно сверить с тетрадью.",
    ],
    en: [
      "Choose the type: linear, quadratic, cubic or a 2×2 / 3×3 system.",
      "Enter the coefficients — integers, decimals or fractions such as 1/2.",
      "The roots appear instantly; quadratics also get an exact radical form.",
      "Below is a step-by-step solution you can check against your notes.",
    ],
  },
  about: {
    ru: [
      "Квадратное уравнение решается через дискриминант D = b² − 4ac. Если D < 0, калькулятор не пишет «корней нет», а показывает комплексные корни вида −1 ± 2i — так, как это принято в высшей математике. Уравнение и ответы записываются аккуратно: «x² − 3x + 2», а не «1x² + -3x + 2».",
      "Кубические уравнения решаются по формуле Кардано или тригонометрически, системы — методом Крамера с точной арифметикой обыкновенных дробей. Если определитель системы равен нулю, по рангу матриц определяется, есть ли решения.",
    ],
    en: [
      "Quadratics are solved with the discriminant D = b² − 4ac. When D < 0 the solver does not stop at 'no roots' but shows the complex roots, such as −1 ± 2i. Equations and answers are written cleanly: 'x² − 3x + 2', not '1x² + -3x + 2'.",
      "Cubics are solved with Cardano's formula or the trigonometric method, and systems with Cramer's rule using exact fractions. If a system's determinant is zero, the ranks decide whether there are solutions.",
    ],
  },
  faq: {
    ru: [
      { q: "Как решить квадратное уравнение?", a: "Найдите дискриминант D = b² − 4ac и корни x = (−b ± √D) / 2a. Для x² − 5x + 6 = 0: D = 1, x = (5 ± 1) / 2, то есть 2 и 3." },
      { q: "Показывает ли калькулятор комплексные корни?", a: "Да. При D < 0 корни записываются как a ± bi: x² + 2x + 5 = 0 → x = −1 ± 2i." },
      { q: "Можно ли решить систему уравнений?", a: "Да, системы из двух и трёх линейных уравнений решаются методом Крамера с точным ответом в обыкновенных дробях." },
    ],
    en: [
      { q: "How do I solve a quadratic equation?", a: "Find D = b² − 4ac and the roots x = (−b ± √D) / 2a. For x² − 5x + 6 = 0: D = 1, x = (5 ± 1) / 2, i.e. 2 and 3." },
      { q: "Does it show complex roots?", a: "Yes. When D < 0 the roots are written as a ± bi: x² + 2x + 5 = 0 → x = −1 ± 2i." },
      { q: "Can it solve systems of equations?", a: "Yes, systems of two or three linear equations are solved with Cramer's rule and an exact answer in fractions." },
    ],
  },
  related: ["matrix-calculator", "graphing-calculator", "scientific-calculator", "fraction-calculator"],
  variants: { title: { ru: "Типы уравнений", en: "Equation types" }, list: variants },
};
