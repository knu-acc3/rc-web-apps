import type { ComponentMap } from "../../types";

export const components: ComponentMap = {
  "network/ip-calculator": () => import("./IpCalculator"),
  "network/subnet-mask": () => import("./SubnetMask"),
  "network/cidr-range": () => import("./CidrRange"),
  "network/ip-converter": () => import("./IpConverter"),
  "network/ipv6": () => import("./Ipv6Tool"),
  "network/mac": () => import("./MacTool"),
  "network/subnet-divider": () => import("./SubnetDivider"),
};
