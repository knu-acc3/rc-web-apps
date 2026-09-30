import type { ToolDef } from "@/registry/types";

export const statisticsTool: ToolDef = {
  slug: "statistics-calculator",
  component: "calc/statistics",
  icon: "ChartColumn",
  name: { ru: "Статистический калькулятор", en: "Statistics calculator" },
  title: { ru: "Статистический калькулятор — среднее, медиана, мода, СКО", en: "Statistics calculator — mean, median, mode, standard deviation" },
  h1: { ru: "Статистический калькулятор онлайн", en: "Descriptive statistics calculator" },
  description: {
    ru: "Среднее, медиана, мода, размах, дисперсия и стандартное отклонение для выборки и совокупности, квартили, IQR и выбросы. Диаграмма размаха и гистограмма.",
    en: "Mean, median, mode, range, variance and standard deviation for samples and populations, quartiles, IQR and outliers, with a box plot and a histogram.",
  },
  lead: {
    ru: "Для 2, 4, 4, 4, 5, 5, 7, 9: среднее 5, медиана 4,5, мода 4, стандартное отклонение совокупности 2.",
    en: "For 2, 4, 4, 4, 5, 5, 7, 9: mean 5, median 4.5, mode 4, population standard deviation 2.",
  },
  keywords: {
    ru: ["статистический калькулятор", "среднее значение", "медиана", "мода", "стандартное отклонение", "дисперсия", "квартили"],
    en: ["statistics calculator", "mean median mode", "standard deviation calculator", "variance", "quartiles", "outliers"],
  },
  props: {},
  howTo: {
    ru: [
      "Вставьте или введите числа — через пробел, с новой строки или через точку с запятой.",
      "Десятичные дроби пишите с запятой: 1,5 — это одно число.",
      "Сразу появятся среднее, медиана, мода и стандартное отклонение.",
      "Ниже — квартили, выбросы, диаграмма размаха и гистограмма.",
    ],
    en: [
      "Paste or type your numbers — separated by spaces, new lines or semicolons.",
      "The mean, median, mode and standard deviation appear instantly.",
      "Below are the quartiles, outliers, a box plot and a histogram.",
    ],
  },
  about: {
    ru: [
      "Калькулятор считает основные показатели описательной статистики. Стандартное отклонение и дисперсия приводятся в двух вариантах: для выборки (делитель n − 1) и для генеральной совокупности (делитель n) — это частая причина расхождений между разными программами.",
      "Квартили вычисляются линейной интерполяцией, как функция QUARTILE.INC в Excel и LibreOffice. Выбросами считаются значения за пределами Q1 − 1,5·IQR и Q3 + 1,5·IQR (правило Тьюки).",
      "Данные можно вставить прямо из таблицы: столбец из Excel разделён переносами строк, и запятая в «1,5» не разбивает число на два.",
    ],
    en: [
      "The calculator covers the core descriptive statistics. Standard deviation and variance are shown for both a sample (divisor n − 1) and a population (divisor n) — a common reason why different programs disagree.",
      "Quartiles use linear interpolation, like QUARTILE.INC in Excel and LibreOffice. Outliers are values beyond Q1 − 1.5·IQR and Q3 + 1.5·IQR (Tukey's rule).",
      "You can paste a column straight from a spreadsheet: values on separate lines are read as separate numbers.",
    ],
  },
  faq: {
    ru: [
      { q: "Чем выборочное стандартное отклонение отличается от генерального?", a: "Выборочное делит сумму квадратов отклонений на n − 1, генеральное — на n. Для 2, 4, 4, 4, 5, 5, 7, 9 это 2,138 и 2." },
      { q: "Как найти медиану?", a: "Упорядочьте числа и возьмите среднее значение; при чётном количестве — среднее двух центральных. Для 2, 4, 4, 4, 5, 5, 7, 9 медиана (4 + 5) / 2 = 4,5." },
      { q: "Что такое выбросы?", a: "Значения, далеко выходящие за основной разброс данных. По правилу Тьюки это числа меньше Q1 − 1,5·IQR или больше Q3 + 1,5·IQR." },
      { q: "Почему запятая не разделяет числа?", a: "Потому что в русском языке это десятичный разделитель: «1,5» — полтора. Разделяйте числа пробелом, переносом строки или точкой с запятой." },
    ],
    en: [
      { q: "What is the difference between sample and population standard deviation?", a: "The sample version divides the sum of squared deviations by n − 1, the population version by n. For 2, 4, 4, 4, 5, 5, 7, 9 they are 2.138 and 2." },
      { q: "How do I find the median?", a: "Sort the numbers and take the middle one; with an even count, average the two middle values. For 2, 4, 4, 4, 5, 5, 7, 9 the median is (4 + 5) / 2 = 4.5." },
      { q: "What are outliers?", a: "Values far outside the bulk of the data. By Tukey's rule they are below Q1 − 1.5·IQR or above Q3 + 1.5·IQR." },
    ],
  },
  related: ["average-calculator", "percentage-calculator", "matrix-calculator", "rounding-calculator"],
};
