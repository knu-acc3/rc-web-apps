import type { Locale } from "@/i18n/config";
import type { Block, QA, ToolDef, VariantDef } from "@/registry/types";
import { det, eigenvalues, inverse, mmul, rank, rref, type M } from "../algebra/matrix";
import { complexText } from "../algebra/poly";
import { parseQ, toText } from "../algebra/rational";

const m = (rows: (number | string)[][]): M => rows.map((r) => r.map((x) => parseQ(String(x))!));
const mt = (a: M) => a.map((r) => r.map((x) => toText(x)).join("  ")).join(" | ");
const A3 = m([
  [2, -3, 1],
  [2, 0, -1],
  [1, 4, 5],
]);
const A2 = m([
  [4, 7],
  [2, 6],
]);

function example(locale: Locale, rows: [string, string][]): Block {
  return { type: "facts", title: locale === "ru" ? "Пример" : "Example", rows };
}

interface VT {
  op: string;
  name: [string, string];
  title: [string, string];
  h1: [string, string];
  description: [string, string];
  lead: [string, string];
  faq: [QA[], QA[]];
  blocks: (locale: Locale) => Block[];
}

const VS: Record<string, VT> = {
  determinant: {
    op: "det",
    name: ["Определитель", "Determinant"],
    title: ["Определитель матрицы онлайн — калькулятор до 6×6", "Matrix determinant calculator up to 6×6"],
    h1: ["Вычисление определителя матрицы", "Matrix determinant calculator"],
    description: [
      "Найдите определитель матрицы 2×2, 3×3 и до 6×6 точно, в обыкновенных дробях. Для 2×2: ad − bc; для больших — приведение к треугольному виду методом Гаусса.",
      "Find the determinant of a 2×2, 3×3 or up to 6×6 matrix exactly, in fractions. For 2×2 it is ad − bc; larger matrices are reduced to triangular form.",
    ],
    lead: ["det [[2, −3, 1], [2, 0, −1], [1, 4, 5]] = 49; для матрицы 2×2 [[1, 2], [3, 4]] определитель равен −2.", "det [[2, −3, 1], [2, 0, −1], [1, 4, 5]] = 49; for the 2×2 matrix [[1, 2], [3, 4]] the determinant is −2."],
    faq: [
      [
        { q: "Как найти определитель матрицы 3×3?", a: "По правилу треугольников (Саррюса) или разложением по строке. Калькулятор приводит матрицу к треугольному виду и перемножает диагональ — так быстрее и для больших матриц." },
        { q: "Что значит определитель, равный нулю?", a: "Матрица вырождена: её строки линейно зависимы, обратной матрицы нет, а система уравнений с такой матрицей не имеет единственного решения." },
      ],
      [
        { q: "How do I find a 3×3 determinant?", a: "With the rule of Sarrus or cofactor expansion. The calculator reduces the matrix to triangular form and multiplies the diagonal — faster for larger matrices too." },
        { q: "What does a zero determinant mean?", a: "The matrix is singular: its rows are linearly dependent, it has no inverse, and a linear system with it has no unique solution." },
      ],
    ],
    blocks: (locale) => [example(locale, [["A", mt(A3)], ["det A", toText(det(A3)!)]])],
  },
  "inverse-matrix": {
    op: "inverse",
    name: ["Обратная матрица", "Inverse matrix"],
    title: ["Обратная матрица онлайн — точно в дробях", "Inverse matrix calculator — exact fractions"],
    h1: ["Нахождение обратной матрицы", "Inverse matrix calculator"],
    description: [
      "Найдите обратную матрицу методом Гаусса — Жордана точно, в обыкновенных дробях: для [[4, 7], [2, 6]] это [[3/5, −7/10], [−1/5, 2/5]]. Размеры до 6×6.",
      "Find the inverse of a matrix by Gauss–Jordan elimination, exactly in fractions: for [[4, 7], [2, 6]] it is [[3/5, −7/10], [−1/5, 2/5]]. Sizes up to 6×6.",
    ],
    lead: ["A⁻¹ существует, только если det A ≠ 0; тогда A · A⁻¹ = E.", "A⁻¹ exists only when det A ≠ 0, and then A · A⁻¹ = I."],
    faq: [
      [
        { q: "Как найти обратную матрицу 2×2?", a: "Поменяйте местами элементы главной диагонали, у побочной смените знаки и разделите всё на определитель: для [[4, 7], [2, 6]] det = 10, A⁻¹ = [[6, −7], [−2, 4]] / 10." },
        { q: "Когда обратной матрицы нет?", a: "Когда определитель равен нулю — матрица вырождена." },
      ],
      [
        { q: "How do I invert a 2×2 matrix?", a: "Swap the main diagonal, negate the other two entries and divide by the determinant: for [[4, 7], [2, 6]] det = 10 and A⁻¹ = [[6, −7], [−2, 4]] / 10." },
        { q: "When does a matrix have no inverse?", a: "When its determinant is zero — the matrix is singular." },
      ],
    ],
    blocks: (locale) => [example(locale, [["A", mt(A2)], ["A⁻¹", mt(inverse(A2)!)]])],
  },
  "matrix-multiplication": {
    op: "multiply",
    name: ["Умножение матриц", "Matrix multiplication"],
    title: ["Умножение матриц онлайн — калькулятор A × B", "Matrix multiplication calculator — A × B"],
    h1: ["Умножение матриц онлайн", "Matrix multiplication calculator"],
    description: [
      "Перемножьте матрицы размером до 6×6: элемент результата — сумма произведений строки A на столбец B. Проверка размеров: число столбцов A равно числу строк B.",
      "Multiply matrices up to 6×6: each result entry is the sum of products of a row of A and a column of B. The number of columns of A must equal the rows of B.",
    ],
    lead: ["[[1, 2], [3, 4]] × [[5, 6], [7, 8]] = [[19, 22], [43, 50]]; умножение матриц не коммутативно: A × B ≠ B × A.", "[[1, 2], [3, 4]] × [[5, 6], [7, 8]] = [[19, 22], [43, 50]]; matrix multiplication is not commutative: A × B ≠ B × A."],
    faq: [
      [
        { q: "Как умножить матрицы?", a: "Элемент (i, j) результата равен сумме произведений элементов i-й строки первой матрицы на элементы j-го столбца второй: 1·5 + 2·7 = 19." },
        { q: "Какие матрицы можно перемножить?", a: "Если число столбцов первой равно числу строк второй. Матрица 2×3 умножается на 3×4, результат — 2×4." },
      ],
      [
        { q: "How do I multiply matrices?", a: "Entry (i, j) of the result is the sum of products of row i of the first matrix and column j of the second: 1·5 + 2·7 = 19." },
        { q: "Which matrices can be multiplied?", a: "When the columns of the first equal the rows of the second. A 2×3 matrix times a 3×4 matrix gives a 2×4 result." },
      ],
    ],
    blocks: (locale) => {
      const a = m([
        [1, 2],
        [3, 4],
      ]);
      const b = m([
        [5, 6],
        [7, 8],
      ]);
      return [example(locale, [["A", mt(a)], ["B", mt(b)], ["A × B", mt(mmul(a, b)!)], ["B × A", mt(mmul(b, a)!)]])];
    },
  },
  "matrix-rank": {
    op: "rank",
    name: ["Ранг матрицы", "Matrix rank"],
    title: ["Ранг матрицы онлайн — калькулятор методом Гаусса", "Matrix rank calculator — Gaussian elimination"],
    h1: ["Ранг матрицы онлайн", "Matrix rank calculator"],
    description: [
      "Найдите ранг матрицы любого размера до 6×6: число ненулевых строк после приведения к ступенчатому виду методом Гаусса. Вычисления точные, в дробях.",
      "Find the rank of any matrix up to 6×6: the number of non-zero rows after reducing to echelon form by Gaussian elimination. Exact arithmetic with fractions.",
    ],
    lead: ["Ранг [[1, 2, 3], [2, 4, 6], [1, 0, 1]] равен 2: вторая строка — удвоенная первая.", "The rank of [[1, 2, 3], [2, 4, 6], [1, 0, 1]] is 2: the second row is twice the first."],
    faq: [
      [
        { q: "Что такое ранг матрицы?", a: "Максимальное число линейно независимых строк (или столбцов). Он равен числу ненулевых строк в ступенчатом виде." },
        { q: "Зачем нужен ранг?", a: "По теореме Кронекера — Капелли система уравнений совместна, если ранг матрицы равен рангу расширенной матрицы." },
      ],
      [
        { q: "What is the rank of a matrix?", a: "The maximum number of linearly independent rows (or columns), equal to the number of non-zero rows in echelon form." },
        { q: "Why does rank matter?", a: "By the Rouché–Capelli theorem a linear system is consistent when the rank of its matrix equals the rank of the augmented matrix." },
      ],
    ],
    blocks: (locale) => {
      const a = m([
        [1, 2, 3],
        [2, 4, 6],
        [1, 0, 1],
      ]);
      return [example(locale, [["A", mt(a)], [locale === "ru" ? "Ранг" : "Rank", String(rank(a))]])];
    },
  },
  "gaussian-elimination": {
    op: "rref",
    name: ["Метод Гаусса", "Gaussian elimination"],
    title: ["Метод Гаусса онлайн — ступенчатый вид матрицы", "Gaussian elimination calculator — reduced row echelon form"],
    h1: ["Приведение матрицы к ступенчатому виду (метод Гаусса)", "Reduced row echelon form calculator"],
    description: [
      "Приведите матрицу к упрощённому ступенчатому виду методом Гаусса — Жордана и посмотрите каждое преобразование строк: перестановки, деление и вычитание строк.",
      "Reduce a matrix to reduced row echelon form with Gauss–Jordan elimination and see every row operation: swaps, scaling and subtracting multiples of rows.",
    ],
    lead: ["Каждый шаг записывается как операция над строками, например R2 − 3·R1 → R2.", "Each step is written as a row operation such as R2 − 3·R1 → R2."],
    faq: [
      [
        { q: "Что такое ступенчатый вид матрицы?", a: "Вид, в котором под каждым ведущим элементом стоят нули. В упрощённом виде ведущие элементы равны 1, а над ними тоже нули." },
        { q: "Как решить систему методом Гаусса?", a: "Запишите расширенную матрицу системы (коэффициенты и свободные члены), приведите её к упрощённому ступенчатому виду — последний столбец даст решение." },
      ],
      [
        { q: "What is row echelon form?", a: "A form where every leading entry has zeros below it. In reduced form the leading entries are 1 with zeros above them too." },
        { q: "How do I solve a system by Gaussian elimination?", a: "Write the augmented matrix (coefficients and constants), reduce it to RREF, and read the solution from the last column." },
      ],
    ],
    blocks: (locale) => {
      const a = m([
        [2, 4, -2],
        [1, 3, 1],
        [3, 7, 1],
      ]);
      const r = rref(a);
      return [example(locale, [["A", mt(a)], ["RREF", mt(r.R)], [locale === "ru" ? "Шагов" : "Steps", String(r.ops.length)]])];
    },
  },
  eigenvalues: {
    op: "eigen",
    name: ["Собственные значения", "Eigenvalues"],
    title: ["Собственные значения матрицы онлайн — 2×2 и 3×3", "Eigenvalue calculator for 2×2 and 3×3 matrices"],
    h1: ["Собственные значения матрицы", "Eigenvalues of a matrix"],
    description: [
      "Найдите собственные значения матрицы 2×2 или 3×3 как корни характеристического многочлена det(A − λE) = 0, включая комплексные — например ±i для матрицы поворота.",
      "Find the eigenvalues of a 2×2 or 3×3 matrix as roots of the characteristic polynomial det(A − λI) = 0, including complex ones such as ±i for a rotation matrix.",
    ],
    lead: ["Для [[2, 0, 0], [0, 3, 4], [0, 4, 9]] собственные значения — 1, 2 и 11.", "For [[2, 0, 0], [0, 3, 4], [0, 4, 9]] the eigenvalues are 1, 2 and 11."],
    faq: [
      [
        { q: "Как найти собственные значения матрицы 2×2?", a: "Решите уравнение λ² − (a + d)·λ + (ad − bc) = 0, где a + d — след, ad − bc — определитель." },
        { q: "Бывают ли собственные значения комплексными?", a: "Да, у вещественной матрицы они могут быть комплексно-сопряжёнными: у матрицы поворота на 90° [[0, −1], [1, 0]] это ±i." },
      ],
      [
        { q: "How do I find the eigenvalues of a 2×2 matrix?", a: "Solve λ² − (a + d)·λ + (ad − bc) = 0, where a + d is the trace and ad − bc the determinant." },
        { q: "Can eigenvalues be complex?", a: "Yes, a real matrix can have complex conjugate eigenvalues: the 90° rotation matrix [[0, −1], [1, 0]] has ±i." },
      ],
    ],
    blocks: (locale) => {
      const a = m([
        [2, 0, 0],
        [0, 3, 4],
        [0, 4, 9],
      ]);
      const rot = m([
        [0, -1],
        [1, 0],
      ]);
      return [
        example(locale, [
          ["A", mt(a)],
          ["λ", eigenvalues(a)!.roots.map((z) => complexText(locale, z)).join("; ")],
          [mt(rot), eigenvalues(rot)!.roots.map((z) => complexText(locale, z)).join("; ")],
        ]),
      ];
    },
  },
};

function variants(): VariantDef[] {
  return Object.entries(VS).map(([slug, v]) => ({
    slug,
    name: { ru: v.name[0], en: v.name[1] },
    title: { ru: v.title[0], en: v.title[1] },
    h1: { ru: v.h1[0], en: v.h1[1] },
    description: { ru: v.description[0], en: v.description[1] },
    lead: { ru: v.lead[0], en: v.lead[1] },
    props: { op: v.op },
    faq: { ru: v.faq[0], en: v.faq[1] },
    blocks: v.blocks,
  }));
}

export const matrixTool: ToolDef = {
  slug: "matrix-calculator",
  component: "calc/matrix",
  icon: "Grid3x3",
  name: { ru: "Калькулятор матриц", en: "Matrix calculator" },
  title: { ru: "Калькулятор матриц онлайн — определитель, обратная, ранг", en: "Matrix calculator — determinant, inverse, rank, RREF" },
  h1: { ru: "Калькулятор матриц", en: "Matrix calculator" },
  description: {
    ru: "Операции с матрицами до 6×6: определитель, обратная матрица, умножение, сложение, транспонирование, ранг, метод Гаусса и собственные значения. Точно, в дробях.",
    en: "Matrix operations up to 6×6: determinant, inverse, multiplication, addition, transpose, rank, Gaussian elimination and eigenvalues — exact, with fractions.",
  },
  lead: {
    ru: "Выберите операцию и заполните ячейки — результат появится сразу, в точных обыкновенных дробях.",
    en: "Pick an operation and fill in the cells — the result appears instantly, in exact fractions.",
  },
  keywords: {
    ru: ["калькулятор матриц", "определитель матрицы", "обратная матрица", "умножение матриц", "ранг матрицы", "метод Гаусса"],
    en: ["matrix calculator", "determinant", "inverse matrix", "matrix multiplication", "rank", "rref"],
  },
  props: { op: "det" },
  howTo: {
    ru: [
      "Выберите операцию: определитель, обратная матрица, умножение и другие.",
      "Задайте размер матриц и заполните ячейки — можно вставить матрицу из текста.",
      "Результат появляется сразу; переключатель показывает его в дробях или десятичных.",
      "Для метода Гаусса ниже выводится каждое преобразование строк.",
    ],
    en: [
      "Choose the operation: determinant, inverse, multiplication and more.",
      "Set the matrix size and fill in the cells — or paste a matrix as text.",
      "The result appears instantly; the toggle switches between fractions and decimals.",
      "For Gaussian elimination every row operation is listed below.",
    ],
  },
  about: {
    ru: [
      "Калькулятор работает с обыкновенными дробями без округлений, поэтому обратная матрица и определитель получаются точными: вместо 0,333333 вы увидите 1/3. Для удобства результат можно показать и десятичными дробями.",
      "Поддерживаются матрицы до 6×6. Собственные значения вычисляются для матриц 2×2 и 3×3 через характеристический многочлен, в том числе комплексные.",
    ],
    en: [
      "The calculator works with exact fractions, so inverses and determinants come out exact: 1/3 instead of 0.333333. You can switch the display to decimals.",
      "Matrices up to 6×6 are supported. Eigenvalues are computed for 2×2 and 3×3 matrices via the characteristic polynomial, complex ones included.",
    ],
  },
  faq: {
    ru: [
      { q: "Как найти определитель матрицы?", a: "Для 2×2 — ad − bc: det [[1, 2], [3, 4]] = −2. Для больших матриц калькулятор приводит матрицу к треугольному виду и перемножает диагональ." },
      { q: "Когда существует обратная матрица?", a: "Только у квадратной матрицы с ненулевым определителем." },
      { q: "Можно ли вводить дроби?", a: "Да: 1/2, −3/4, 0,25. Пустые ячейки считаются нулями." },
    ],
    en: [
      { q: "How do I find a determinant?", a: "For 2×2 it is ad − bc: det [[1, 2], [3, 4]] = −2. For larger matrices the calculator reduces to triangular form and multiplies the diagonal." },
      { q: "When does an inverse exist?", a: "Only for a square matrix with a non-zero determinant." },
      { q: "Can I enter fractions?", a: "Yes: 1/2, −3/4, 0.25. Empty cells count as zero." },
    ],
  },
  related: ["equation-solver", "fraction-calculator", "scientific-calculator", "statistics-calculator"],
  variants: { title: { ru: "Операции с матрицами", en: "Matrix operations" }, list: variants },
  wide: true,
};
