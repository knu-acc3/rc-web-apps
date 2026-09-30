import type { ToolDef } from "@/registry/types";

export const averageTool: ToolDef = {
  slug: "average-calculator",
  component: "calc/average",
  icon: "Equal",
  name: { ru: "Калькулятор среднего значения", en: "Average calculator" },
  title: { ru: "Среднее арифметическое онлайн — и взвешенное, и другие", en: "Average calculator — arithmetic, weighted, geometric" },
  h1: { ru: "Калькулятор среднего значения", en: "Average calculator" },
  description: {
    ru: "Найдите среднее арифметическое, взвешенное (средний балл с весами), геометрическое и гармоническое среднее, а также медиану для любого набора чисел.",
    en: "Find the arithmetic mean, the weighted mean (grades with weights), the geometric and harmonic means and the median for any list of numbers.",
  },
  lead: {
    ru: "Среднее арифметическое оценок 4, 5, 3, 5, 4,5 и 5 — 4,4167; с весами результат другой.",
    en: "The arithmetic mean of 4, 5, 3, 5, 4.5 and 5 is 4.4167; with weights the result changes.",
  },
  keywords: {
    ru: ["среднее арифметическое", "средний балл", "среднее взвешенное", "среднее геометрическое", "среднее значение"],
    en: ["average calculator", "mean calculator", "weighted average", "geometric mean", "harmonic mean"],
  },
  props: { kind: "arithmetic" },
  howTo: {
    ru: ["Выберите вид среднего.", "Введите числа через пробел или с новой строки; для взвешенного — пары «значение вес».", "Результат и другие виды среднего для сравнения появятся сразу."],
    en: ["Choose the kind of average.", "Enter the numbers separated by spaces or new lines; for the weighted mean, 'value weight' pairs.", "The result and the other averages for comparison appear instantly."],
  },
  about: {
    ru: [
      "Среднее арифметическое — сумма чисел, делённая на их количество. Если значения неравноценны, нужно взвешенное среднее: например, итоговая оценка, где контрольная весит втрое больше домашней работы.",
      "Для темпов роста правильнее геометрическое среднее, для средних скоростей на одинаковых отрезках — гармоническое. Калькулятор показывает все виды рядом, чтобы было видно, насколько они отличаются.",
    ],
    en: [
      "The arithmetic mean is the sum divided by the count. When values are not equally important, use a weighted mean — for example, a final grade where an exam counts three times as much as homework.",
      "Growth rates call for the geometric mean and average speeds over equal distances for the harmonic mean. The calculator shows them side by side so you can see how they differ.",
    ],
  },
  faq: {
    ru: [
      { q: "Как посчитать средний балл?", a: "Сложите оценки и разделите на их количество: (4 + 5 + 3 + 5) / 4 = 4,25. Если у оценок разный вес, используйте взвешенное среднее." },
      { q: "Как считается среднее взвешенное?", a: "Каждое значение умножают на его вес, складывают и делят на сумму весов: (5·3 + 4·2 + 3·1) / 6 ≈ 4,33." },
      { q: "Когда нужно среднее геометрическое?", a: "Для величин, которые перемножаются: темпов роста, доходности по годам, коэффициентов. Среднее геометрическое 2 и 8 равно 4." },
    ],
    en: [
      { q: "How do I calculate an average grade?", a: "Add the grades and divide by how many there are: (4 + 5 + 3 + 5) / 4 = 4.25. If grades have different weights, use the weighted mean." },
      { q: "How is a weighted mean calculated?", a: "Multiply each value by its weight, add them up and divide by the sum of weights: (5·3 + 4·2 + 3·1) / 6 ≈ 4.33." },
      { q: "When do I need the geometric mean?", a: "For quantities that multiply: growth rates, yearly returns, ratios. The geometric mean of 2 and 8 is 4." },
    ],
  },
  related: ["statistics-calculator", "percentage-calculator", "rounding-calculator", "ratio-calculator"],
};
