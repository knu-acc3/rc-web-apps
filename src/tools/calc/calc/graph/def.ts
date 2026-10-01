import type { ToolDef } from "@/registry/types";

export const graphTool: ToolDef = {
  slug: "graphing-calculator",
  component: "calc/graph",
  icon: "ChartSpline",
  name: { ru: "Построение графиков функций", en: "Graphing calculator" },
  title: { ru: "Построение графиков функций онлайн — несколько функций", en: "Graphing calculator online — plot several functions" },
  h1: { ru: "Построение графиков функций онлайн", en: "Online graphing calculator" },
  description: {
    ru: "Постройте графики до 6 функций от x: синусы, параболы, логарифмы, корни. Масштаб колесом или щипком, перемещение мышью, значения функций в точке под курсором.",
    en: "Plot up to 6 functions of x: sines, parabolas, logarithms, roots. Zoom with the wheel or a pinch, drag to pan, and read the function values under the cursor.",
  },
  lead: {
    ru: "Введите функцию, например sin(x) или x^2/4 − 2, — график строится сразу, без кнопок.",
    en: "Type a function such as sin(x) or x^2/4 − 2 — the graph is drawn instantly, no buttons needed.",
  },
  keywords: {
    ru: ["построить график функции", "график онлайн", "построение графиков", "график параболы", "график синуса"],
    en: ["graphing calculator", "plot function", "function grapher", "graph online"],
  },
  props: {},
  howTo: {
    ru: [
      "Введите функцию от x в поле «y =», например 2x + 1, x^2 или sin(x).",
      "Добавьте ещё функции — каждая рисуется своим цветом, до шести сразу.",
      "Масштабируйте колесом мыши, щипком или кнопками, двигайте график мышью или стрелками.",
      "Наведите курсор, чтобы увидеть значения всех функций в этой точке.",
    ],
    en: [
      "Type a function of x in the y = field, such as 2x + 1, x^2 or sin(x).",
      "Add more functions — each gets its own colour, up to six at once.",
      "Zoom with the mouse wheel, a pinch or the buttons; drag or use the arrow keys to pan.",
      "Hover to see the values of all functions at that point.",
    ],
  },
  about: {
    ru: [
      "Построитель понимает привычную запись: степень через ^, умножение можно не писать (2x, 3sin(x)), доступны тригонометрические функции, корни, модуль и логарифмы. log — десятичный логарифм, ln — натуральный: это важно, чтобы график log x не совпал по ошибке с ln x.",
      "Вертикальные асимптоты (tan x, 1/x) и области, где функция не определена, отображаются разрывами, а не ложными вертикальными линиями. Функции и область просмотра сохраняются в ссылке — ею можно поделиться.",
    ],
    en: [
      "The plotter uses familiar notation: ^ for powers, implicit multiplication (2x, 3sin(x)), trig functions, roots, absolute value and logarithms. log is base 10 and ln is natural, so a plot of log x is not confused with ln x.",
      "Vertical asymptotes (tan x, 1/x) and regions where a function is undefined show as gaps rather than false vertical lines. The functions and the view are stored in the link, so you can share them.",
    ],
  },
  faq: {
    ru: [
      { q: "Как построить график параболы?", a: "Введите, например, x^2 − 4x + 3. Вершина будет в точке (2; −1), а корни — x = 1 и x = 3 — видны как пересечения с осью x." },
      { q: "Почему график log x отличается от ln x?", a: "log — логарифм по основанию 10, ln — по основанию e ≈ 2,718. Оба проходят через точку (1; 0), но ln растёт быстрее: ln 10 ≈ 2,3, а log 10 = 1." },
      { q: "Как приблизить часть графика?", a: "Прокрутите колесо мыши над нужной точкой или сведите/разведите пальцы на телефоне. Кнопка с рамкой возвращает исходный вид." },
      { q: "В каких единицах углы?", a: "В радианах: sin(x) имеет период 2π ≈ 6,28." },
    ],
    en: [
      { q: "How do I graph a parabola?", a: "Type, for example, x^2 − 4x + 3. The vertex is at (2, −1) and the roots x = 1 and x = 3 are where it crosses the x-axis." },
      { q: "Why does log x look different from ln x?", a: "log is base 10 and ln is base e ≈ 2.718. Both pass through (1, 0), but ln grows faster: ln 10 ≈ 2.3 while log 10 = 1." },
      { q: "How do I zoom into part of the graph?", a: "Scroll the mouse wheel over that point or pinch on a phone. The frame button resets the view." },
      { q: "Are angles in degrees or radians?", a: "Radians: sin(x) has a period of 2π ≈ 6.28." },
    ],
  },
  related: ["scientific-calculator", "equation-solver", "percentage-calculator", "logarithm-calculator"],
  wide: true,
};
