import type { ComponentMap } from "../../types";

// Only dynamic imports here: this map is part of the client bundle of every page.
export const components: ComponentMap = {
  "calc/3d-print": () => import("../3d-print/Print3dCalc"),
  "calc/percent": () => import("./percent/Percent"),
  "calc/fractions": () => import("./fractions/Fractions"),
  "calc/equation": () => import("./equation/Equation"),
  "calc/matrix": () => import("./matrix/MatrixCalc"),
  "calc/statistics": () => import("./statistics/Statistics"),
  "calc/scientific": () => import("./scientific/Scientific"),
  "calc/graph": () => import("./graph/Graph"),
  "calc/multiplication": () => import("./multiplication/MultiplicationTable"),
  "calc/gcd-lcm": () => import("./gcd-lcm/GcdLcm"),
  "calc/prime": () => import("./prime/Prime"),
  "calc/proportion": () => import("./proportion/Proportion"),
  "calc/average": () => import("./average/Average"),
  "calc/rounding": () => import("./rounding/Rounding"),
  "calc/ratio": () => import("./ratio/Ratio"),
  "calc/rpl": () => import("./rpl/Rpl"),
  "calc/factorial": () => import("./factorial/Factorial"),
  "calc/combinatorics": () => import("./combinatorics/Combinatorics"),
};
