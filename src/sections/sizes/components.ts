import type { ComponentMap } from "../types";

export const components: ComponentMap = {
  "sizes/paper": () => import("./paper/PaperSize"),
  "sizes/shoes": () => import("./shoes/ShoeSize"),
  "sizes/clothing": () => import("./clothing/ClothingSize"),
  "sizes/rings": () => import("./rings/RingSize"),
  "sizes/bra": () => import("./bra/BraSize"),
  "sizes/screen": () => import("./screen/ScreenResolution"),
  "sizes/ratio": () => import("./ratio/AspectRatio"),
  "sizes/ppi": () => import("./ppi/PpiCalc"),
  "sizes/tv": () => import("./tv/TvSize"),
};
