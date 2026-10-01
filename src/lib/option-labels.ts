import { Children, isValidElement, type ReactNode } from "react";

/** Plain text of a React node: strings, numbers, arrays and fragments (icons and other elements give nothing). */
export function nodeText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return nodeText(node.props.children);
  return "";
}

/**
 * The options of a <select> written as React children — `<option>`, `<optgroup>`, arrays from `.map`, fragments and
 * conditionals — as `{ value, label }`. Lets Select size itself to the chosen option without asking callers for data.
 */
export function optionLabels(children: ReactNode): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  const walk = (nodes: ReactNode) =>
    Children.forEach(nodes, (n) => {
      if (!isValidElement<{ value?: unknown; children?: ReactNode; label?: string }>(n)) return;
      if (n.type === "option") {
        const label = nodeText(n.props.children);
        out.push({ value: n.props.value === undefined ? label : String(n.props.value), label });
      } else walk(n.props.children);
    });
  walk(children);
  return out;
}
