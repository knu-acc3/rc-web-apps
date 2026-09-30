import FocusedUnitConverter, {
  type LinearUnit,
} from "./FocusedUnitConverter";

const UNITS: LinearUnit[] = [
  {
    id: "milliwatt",
    labelRu: "Милливатты",
    labelEn: "Milliwatts",
    symbol: "mW",
    factor: 0.001,
  },
  { id: "watt", labelRu: "Ватты", labelEn: "Watts", symbol: "W", factor: 1 },
  {
    id: "kilowatt",
    labelRu: "Киловатты",
    labelEn: "Kilowatts",
    symbol: "kW",
    factor: 1_000,
  },
  {
    id: "megawatt",
    labelRu: "Мегаватты",
    labelEn: "Megawatts",
    symbol: "MW",
    factor: 1_000_000,
  },
  {
    id: "gigawatt",
    labelRu: "Гигаватты",
    labelEn: "Gigawatts",
    symbol: "GW",
    factor: 1_000_000_000,
  },
  {
    id: "hp-mechanical",
    labelRu: "Механические лошадиные силы",
    labelEn: "Mechanical horsepower",
    symbol: "hp",
    factor: 745.6998715822702,
  },
  {
    id: "hp-metric",
    labelRu: "Метрические лошадиные силы",
    labelEn: "Metric horsepower",
    symbol: "PS",
    factor: 735.49875,
  },
  {
    id: "btu-hour",
    labelRu: "BTU в час",
    labelEn: "BTU per hour",
    symbol: "BTU/h",
    factor: 0.2930710701722222,
  },
  {
    id: "kilocalorie-hour",
    labelRu: "Килокалории в час",
    labelEn: "Kilocalories per hour",
    symbol: "kcal/h",
    factor: 1.1622222222222,
  },
  {
    id: "foot-pound-second",
    labelRu: "Фут-фунт-силы в секунду",
    labelEn: "Foot-pound force per second",
    symbol: "ft·lbf/s",
    factor: 1.3558179483314,
  },
  {
    id: "refrigeration-ton",
    labelRu: "Тонны охлаждения",
    labelEn: "Tons of refrigeration",
    symbol: "TR",
    factor: 3_516.8528420667,
  },
];

export default function PowerConverter() {
  return (
    <FocusedUnitConverter
      units={UNITS}
      defaultFrom="kilowatt"
      defaultTo="hp-mechanical"
      valueLabelRu="Мощность"
      valueLabelEn="Power"
      baseNoteRu="Базовая единица — ватт. Механическая hp и метрическая PS — разные единицы; они показаны отдельно."
      baseNoteEn="The base unit is the watt. Mechanical hp and metric PS are different units and are listed separately."
    />
  );
}
