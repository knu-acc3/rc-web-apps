import type { ComponentMap } from "../../types";

export const components: ComponentMap = {
  "random/wheel": () => import("./Wheel"),
  "random/coin": () => import("./Coin"),
  "random/dice": () => import("./Dice"),
  "random/number": () => import("./NumberGen"),
  "random/lottery": () => import("./Lottery"),
  "random/list": () => import("./ListPicker"),
  "random/teams": () => import("./Teams"),
  "random/name": () => import("./NameGen"),
  "random/letter": () => import("./LetterGen"),
  "random/card": () => import("./CardDraw"),
  "random/yes-no": () => import("./YesNo"),
  "random/rps": () => import("./Rps"),
  "random/secret-santa": () => import("./SecretSanta"),
  "random/date": () => import("./DateGen"),
  "random/lots": () => import("./DrawLots"),
};
