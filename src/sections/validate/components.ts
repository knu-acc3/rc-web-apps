import type { ComponentMap } from "../types";

export const components: ComponentMap = {
  "validate/iban": () => import("./IbanValidator"),
  "validate/card": () => import("./CardValidator"),
  "validate/phone": () => import("./PhoneValidator"),
  "validate/email": () => import("./EmailValidator"),
  "validate/iin": () => import("./IinValidator"),
  "validate/ru-id": () => import("./RuIdValidator"),
  "validate/isbn": () => import("./IsbnValidator"),
  "validate/vin": () => import("./VinValidator"),
};
