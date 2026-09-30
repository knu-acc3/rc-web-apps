import type { ComponentMap } from "../types";

export const components: ComponentMap = {
  "time/now": () => import("./Now"),
  "time/city": () => import("./CityTime"),
  "time/country": () => import("./CountryTime"),
  "time/zone": () => import("./ZoneTime"),
  "time/zones": () => import("./ZonesTable"),
  "time/world": () => import("./WorldClock"),
  "time/convert": () => import("./Converter"),
  "time/clock": () => import("./DigitalClock"),
  "time/flip": () => import("./FlipClock"),
  "time/analog": () => import("./AnalogClock"),
  "time/utc": () => import("./UtcNow"),
};
