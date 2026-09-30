import { defineToolSection } from "@/registry/tool-section";

export const networkSection = defineToolSection({
  id: "network",
  name: { ru: "IP и сети", en: "IP & networks" },
  description: {
    ru: "IP-калькулятор: подсети и CIDR, маски, диапазоны адресов, разбор IPv4 и IPv6",
    en: "IP calculator: subnets and CIDR, masks, address ranges, IPv4 and IPv6 tools",
  },
  icon: "Router",
  hue: 200,
  category: "web",
  order: 4,
  tools: [],
});
