import FocusedUnitConverter, {
  type LinearUnit,
} from "./FocusedUnitConverter";

const UNITS: LinearUnit[] = [
  {
    id: "degree",
    labelRu: "Градусы",
    labelEn: "Degrees",
    symbol: "°",
    factor: 1,
  },
  {
    id: "radian",
    labelRu: "Радианы",
    labelEn: "Radians",
    symbol: "rad",
    factor: 180 / Math.PI,
  },
  {
    id: "pi-radian",
    labelRu: "Радианы, кратные π",
    labelEn: "Pi radians",
    symbol: "π rad",
    factor: 180,
  },
  {
    id: "gradian",
    labelRu: "Грады",
    labelEn: "Gradians",
    symbol: "gon",
    factor: 0.9,
  },
  {
    id: "turn",
    labelRu: "Обороты",
    labelEn: "Turns",
    symbol: "turn",
    factor: 360,
  },
  {
    id: "mil-nato",
    labelRu: "Милы НАТО",
    labelEn: "NATO mils",
    symbol: "mil",
    factor: 360 / 6_400,
  },
  {
    id: "arcminute",
    labelRu: "Угловые минуты",
    labelEn: "Arcminutes",
    symbol: "′",
    factor: 1 / 60,
  },
  {
    id: "arcsecond",
    labelRu: "Угловые секунды",
    labelEn: "Arcseconds",
    symbol: "″",
    factor: 1 / 3_600,
  },
  {
    id: "hour-angle",
    labelRu: "Часовой угол",
    labelEn: "Hour angle",
    symbol: "h",
    factor: 15,
  },
];

export default function AngleConverter() {
  return (
    <FocusedUnitConverter
      units={UNITS}
      defaultFrom="degree"
      defaultTo="radian"
      valueLabelRu="Угол"
      valueLabelEn="Angle"
      baseNoteRu="Базовая единица расчёта — градус: полный оборот равен 360°, 2π радиан, 400 градам или 6400 мил НАТО."
      baseNoteEn="The calculation uses degrees as its base: one full turn equals 360°, 2π radians, 400 gradians or 6400 NATO mils."
    />
  );
}
