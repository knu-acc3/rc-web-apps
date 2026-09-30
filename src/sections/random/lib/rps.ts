/** 0 = rock, 1 = paper, 2 = scissors */
export type Move = 0 | 1 | 2;
export type Outcome = "win" | "lose" | "draw";

/** Rock beats scissors, paper beats rock, scissors beat paper (from the first player's view). */
export function rpsOutcome(you: Move, cpu: Move): Outcome {
  if (you === cpu) return "draw";
  return (you - cpu + 3) % 3 === 1 ? "win" : "lose";
}
