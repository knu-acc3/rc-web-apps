export type Suit = "S" | "H" | "D" | "C";
export type DeckSize = 36 | 52;

export interface Card {
  /** 2…14 (11 = jack, 12 = queen, 13 = king, 14 = ace). */
  rank: number;
  suit: Suit;
}

export const SUITS: readonly Suit[] = ["S", "H", "D", "C"];
export const SUIT_SYMBOL: Record<Suit, string> = { S: "♠", H: "♥", D: "♦", C: "♣" };
export const isRed = (s: Suit) => s === "H" || s === "D";

export function buildDeck(size: DeckSize): Card[] {
  const low = size === 36 ? 6 : 2;
  const out: Card[] = [];
  for (const suit of SUITS) for (let rank = low; rank <= 14; rank++) out.push({ rank, suit });
  return out;
}

const RANK_RU: Record<number, string> = { 11: "В", 12: "Д", 13: "К", 14: "Т" };
const RANK_EN: Record<number, string> = { 11: "J", 12: "Q", 13: "K", 14: "A" };

/** Corner label: "10", "Д" / "Q", "Т" / "A". */
export function rankLabel(rank: number, locale: "ru" | "en"): string {
  return (locale === "ru" ? RANK_RU : RANK_EN)[rank] ?? String(rank);
}

const RANK_NAME_RU: Record<number, string> = {
  2: "Двойка", 3: "Тройка", 4: "Четвёрка", 5: "Пятёрка", 6: "Шестёрка", 7: "Семёрка", 8: "Восьмёрка", 9: "Девятка", 10: "Десятка",
  11: "Валет", 12: "Дама", 13: "Король", 14: "Туз",
};
const RANK_NAME_EN: Record<number, string> = {
  2: "Two", 3: "Three", 4: "Four", 5: "Five", 6: "Six", 7: "Seven", 8: "Eight", 9: "Nine", 10: "Ten",
  11: "Jack", 12: "Queen", 13: "King", 14: "Ace",
};
/** Genitive plural of the suit name: «туз пик», «дама червей», «король бубен», «валет треф». */
const SUIT_RU_GEN: Record<Suit, string> = { S: "пик", H: "червей", D: "бубен", C: "треф" };
const SUIT_EN: Record<Suit, string> = { S: "Spades", H: "Hearts", D: "Diamonds", C: "Clubs" };

export function cardName(c: Card, locale: "ru" | "en"): string {
  return locale === "ru" ? `${RANK_NAME_RU[c.rank]} ${SUIT_RU_GEN[c.suit]}` : `${RANK_NAME_EN[c.rank]} of ${SUIT_EN[c.suit]}`;
}
