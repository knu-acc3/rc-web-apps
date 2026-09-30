import type { ComponentMap } from "../types";
import { generatorComponents } from "./generators.components";
import { mediaComponents } from "./media.components";

export const components: ComponentMap = { ...mediaComponents, ...generatorComponents };
