import FocusedUnitConverter, {
  type LinearUnit,
} from "./FocusedUnitConverter";

const UNITS: LinearUnit[] = [
  { id: "bit", labelRu: "Биты", labelEn: "Bits", symbol: "bit", factor: 1 },
  { id: "byte", labelRu: "Байты", labelEn: "Bytes", symbol: "B", factor: 8 },
  {
    id: "kilobit",
    labelRu: "Килобиты",
    labelEn: "Kilobits",
    symbol: "kbit",
    factor: 1_000,
  },
  {
    id: "megabit",
    labelRu: "Мегабиты",
    labelEn: "Megabits",
    symbol: "Mbit",
    factor: 1_000_000,
  },
  {
    id: "gigabit",
    labelRu: "Гигабиты",
    labelEn: "Gigabits",
    symbol: "Gbit",
    factor: 1_000_000_000,
  },
  {
    id: "terabit",
    labelRu: "Терабиты",
    labelEn: "Terabits",
    symbol: "Tbit",
    factor: 1_000_000_000_000,
  },
  {
    id: "kilobyte",
    labelRu: "Килобайты",
    labelEn: "Kilobytes",
    symbol: "kB",
    factor: 8_000,
  },
  {
    id: "megabyte",
    labelRu: "Мегабайты",
    labelEn: "Megabytes",
    symbol: "MB",
    factor: 8_000_000,
  },
  {
    id: "gigabyte",
    labelRu: "Гигабайты",
    labelEn: "Gigabytes",
    symbol: "GB",
    factor: 8_000_000_000,
  },
  {
    id: "terabyte",
    labelRu: "Терабайты",
    labelEn: "Terabytes",
    symbol: "TB",
    factor: 8_000_000_000_000,
  },
  {
    id: "kibibyte",
    labelRu: "Кибибайты",
    labelEn: "Kibibytes",
    symbol: "KiB",
    factor: 8 * 1_024,
  },
  {
    id: "mebibyte",
    labelRu: "Мебибайты",
    labelEn: "Mebibytes",
    symbol: "MiB",
    factor: 8 * 1_024 ** 2,
  },
  {
    id: "gibibyte",
    labelRu: "Гибибайты",
    labelEn: "Gibibytes",
    symbol: "GiB",
    factor: 8 * 1_024 ** 3,
  },
  {
    id: "tebibyte",
    labelRu: "Тебибайты",
    labelEn: "Tebibytes",
    symbol: "TiB",
    factor: 8 * 1_024 ** 4,
  },
];

export default function DataConverter() {
  return (
    <FocusedUnitConverter
      units={UNITS}
      defaultFrom="megabyte"
      defaultTo="mebibyte"
      valueLabelRu="Объём данных"
      valueLabelEn="Data amount"
      baseNoteRu="Десятичные единицы используют степени 1000, двоичные IEC-единицы KiB, MiB, GiB и TiB — степени 1024. Один байт равен 8 битам."
      baseNoteEn="Decimal units use powers of 1000; binary IEC units KiB, MiB, GiB and TiB use powers of 1024. One byte equals 8 bits."
    />
  );
}
