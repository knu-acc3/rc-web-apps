import { randomInt, sampleIndices, shuffle } from "./rng";

/**
 * Team sizes for `people` split into `teams`: sizes differ by at most one and the
 * teams that get the extra member are chosen at random (no bias towards team 1).
 */
export function teamSizes(people: number, teams: number): number[] {
  if (!Number.isInteger(people) || !Number.isInteger(teams) || teams < 1 || people < 0) throw new RangeError("teamSizes: bad input");
  const base = Math.floor(people / teams);
  const extra = people % teams;
  const sizes = new Array<number>(teams).fill(base);
  for (const i of sampleIndices(teams, extra)) sizes[i]++;
  return sizes;
}

export interface Team<T> {
  members: T[];
  /** Index into `members` of the captain, or -1 when captains are off. */
  captain: number;
}

/** Shuffle participants and deal them into balanced teams. */
export function splitIntoTeams<T>(participants: readonly T[], teams: number, captains = false): Team<T>[] {
  const order = shuffle(participants);
  const sizes = teamSizes(order.length, teams);
  const out: Team<T>[] = [];
  let pos = 0;
  for (const size of sizes) {
    const members = order.slice(pos, pos + size);
    pos += size;
    out.push({ members, captain: captains && members.length ? randomInt(members.length) : -1 });
  }
  return out;
}
