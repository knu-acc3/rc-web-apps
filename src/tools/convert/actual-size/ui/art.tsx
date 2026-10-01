import type { ReactNode } from "react";
import type { ClientObj } from "../lib/types";

/*
 * SVG art for objects, drawn in millimetres inside the box [0, w] × [0, h].
 * The outline (bounding box, corner radius, diameter) is exact; inner details are decorative.
 * Colours come from design tokens so the art works in light and dark themes.
 */

const NS = { vectorEffect: "non-scaling-stroke" } as const;
const BODY = "fill-surface-2 stroke-fg";
const FACE = "fill-surface stroke-fg-3";
const LINE = "fill-none stroke-fg-3";
const MUTED = "fill-line stroke-none";
const GOLD = "fill-warn-soft stroke-warn";
const ACCENT = "fill-accent-soft stroke-accent";
const TEXT = "fill-fg-2";

function Rect({ x = 0, y = 0, w, h, r = 0, cls = BODY, sw = 1.25 }: { x?: number; y?: number; w: number; h: number; r?: number; cls?: string; sw?: number }) {
  return <rect x={x} y={y} width={w} height={h} rx={Math.min(r, w / 2, h / 2)} className={cls} strokeWidth={sw} style={NS} />;
}

function Circle({ cx, cy, r, cls = BODY, sw = 1.25 }: { cx: number; cy: number; r: number; cls?: string; sw?: number }) {
  return <circle cx={cx} cy={cy} r={r} className={cls} strokeWidth={sw} style={NS} />;
}

function Label({ x, y, size, children, rotate, cls = TEXT }: { x: number; y: number; size: number; children: ReactNode; rotate?: number; cls?: string }) {
  if (size < 0.8) return null;
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      fontWeight={600}
      textAnchor="middle"
      dominantBaseline="central"
      className={cls}
      transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}
    >
      {children}
    </text>
  );
}

/** Font size that fits `text` into `maxW` × `maxH` millimetres. */
function fit(text: string, maxW: number, maxH: number, cap = 14): number {
  const byW = maxW / Math.max(1, text.length * 0.62);
  return Math.max(0, Math.min(cap, byW, maxH * 0.7));
}

function CenterLabel({ o, cap }: { o: ClientObj; cap?: number }) {
  if (!o.label) return null;
  return (
    <Label x={o.w / 2} y={o.h / 2} size={fit(o.label, o.w * 0.8, o.h * 0.5, cap)}>
      {o.label}
    </Label>
  );
}

function Device({ o }: { o: ClientObj }) {
  const { w, h } = o;
  const tablet = o.shape === "tablet";
  const r = o.r ?? (tablet ? 10 : o.home ? 9 : w * 0.15);
  const side = tablet ? (o.home ? 9.5 : 8.5) : o.home ? 4.6 : 2.3;
  const top = tablet ? (o.home ? 21.5 : 8.5) : o.home ? 17 : 2.3;
  const sw = w - side * 2;
  const sh = h - top * 2;
  const sr = o.home ? 0.6 : Math.max(0.5, r - side);
  return (
    <g>
      <Rect w={w} h={h} r={r} />
      <Rect x={side} y={top} w={sw} h={sh} r={sr} cls={FACE} sw={1} />
      {o.home && <Circle cx={w / 2} cy={h - top / 2} r={Math.min(5.5, top * 0.3)} cls={LINE} sw={1} />}
      {o.home && !tablet && <Rect x={w / 2 - 5} y={top / 2 - 0.6} w={10} h={1.2} r={0.6} cls={MUTED} sw={0} />}
      {o.notch === "notch" && <Rect x={w / 2 - sw * 0.22} y={top - 1} w={sw * 0.44} h={5.8} r={2.5} cls={BODY} sw={0} />}
      {o.notch === "island" && <Rect x={w / 2 - sw * 0.14} y={top + 1.6} w={sw * 0.28} h={5.4} r={2.7} cls="fill-fg stroke-none" sw={0} />}
      {o.notch === "hole" && <Circle cx={w / 2} cy={top + 3.2} r={1.5} cls="fill-fg stroke-none" sw={0} />}
      {tablet && !o.home && <Circle cx={w / 2} cy={top / 2} r={0.9} cls="fill-fg-3 stroke-none" sw={0} />}
    </g>
  );
}

function Coin({ o }: { o: ClientObj }) {
  const r = o.w / 2;
  return (
    <g>
      <Circle cx={r} cy={r} r={r} />
      {o.shape === "bimetal" ? <Circle cx={r} cy={r} r={r * 0.68} cls={MUTED} sw={0} /> : <Circle cx={r} cy={r} r={r * 0.86} cls={LINE} sw={1} />}
      {o.label && (
        <Label x={r} y={r} size={fit(o.label, r * 1.3, r, r * 0.55)}>
          {o.label}
        </Label>
      )}
    </g>
  );
}

function Battery({ o }: { o: ClientObj }) {
  const { w, h } = o;
  const nub = Math.min(1.6, h * 0.035);
  const nw = w * 0.38;
  return (
    <g>
      <Rect x={(w - nw) / 2} y={0} w={nw} h={nub + 0.6} r={0.4} cls={FACE} sw={1} />
      <Rect y={nub} w={w} h={h - nub} r={Math.min(1.5, w * 0.08)} />
      <line x1={0} x2={w} y1={nub + (h - nub) * 0.14} y2={nub + (h - nub) * 0.14} className="stroke-fg-3" strokeWidth={1} style={NS} />
      <Label x={w / 2} y={nub + (h - nub) * 0.07} size={Math.min(3.5, w * 0.3)}>
        +
      </Label>
      {o.label && (
        <Label x={w / 2} y={nub + (h - nub) * 0.57} size={fit(o.label, (h - nub) * 0.6, w * 0.9, 8)} rotate={-90}>
          {o.label}
        </Label>
      )}
    </g>
  );
}

function NineVolt({ o }: { o: ClientObj }) {
  const { w, h } = o;
  const th = 3.5;
  const cx = w / 2;
  return (
    <g>
      <Rect x={cx - 6.35 - 3.3} y={0} w={6.6} h={th + 0.5} r={0.6} cls={FACE} sw={1} />
      <Rect x={cx + 6.35 - 4} y={0} w={8} h={th + 0.5} r={0.4} cls={FACE} sw={1} />
      <Rect y={th} w={w} h={h - th} r={1.5} />
      <Label x={w / 2} y={th + (h - th) / 2} size={fit(o.label ?? "9V", w * 0.8, h * 0.3, 9)}>
        {o.label ?? "9V"}
      </Label>
    </g>
  );
}

function Plug({ o }: { o: ClientObj }) {
  const { w, h } = o;
  switch (o.shape) {
    case "plug-usb-c":
      return (
        <g>
          <Rect w={w} h={h} r={h / 2} />
          <Rect x={w * 0.14} y={h * 0.28} w={w * 0.72} h={h * 0.44} r={h * 0.22} cls={FACE} sw={1} />
        </g>
      );
    case "plug-usb-a":
      return (
        <g>
          <Rect w={w} h={h} r={0.3} />
          <Rect x={w * 0.07} y={h * 0.5} w={w * 0.86} h={h * 0.4} r={0.2} cls={FACE} sw={1} />
          {[0.2, 0.4, 0.6, 0.8].map((f) => (
            <Rect key={f} x={w * f - 0.6} y={h * 0.5} w={1.2} h={h * 0.12} cls={GOLD} sw={0} />
          ))}
        </g>
      );
    case "plug-lightning":
      return (
        <g>
          <Rect w={w} h={h} r={h / 2} />
          {Array.from({ length: 8 }, (_, i) => (
            <Rect key={i} x={w * 0.12 + i * w * 0.1 + 0.05} y={h * 0.2} w={w * 0.06} h={h * 0.6} r={0.1} cls={GOLD} sw={0} />
          ))}
        </g>
      );
    case "plug-micro-usb":
    case "plug-hdmi": {
      const c = o.shape === "plug-hdmi" ? w * 0.1 : w * 0.13;
      const k = o.shape === "plug-hdmi" ? 0.5 : 0.45;
      const d = `M0 0 H${w} V${h * k} L${w - c} ${h} H${c} L0 ${h * k} Z`;
      return (
        <g>
          <path d={d} className={BODY} strokeWidth={1.25} style={NS} />
          <Rect x={w * 0.2} y={h * 0.3} w={w * 0.6} h={h * 0.3} r={0.1} cls={FACE} sw={1} />
        </g>
      );
    }
    default:
      return null;
  }
}

function Console({ o }: { o: ClientObj }) {
  const { w, h } = o;
  const s = o.side ?? h * 0.35;
  const r = o.r ?? h * 0.12;
  const scrW = w - 2 * s - 6;
  const scrH = Math.min(h - 10, (scrW * 9) / 16);
  return (
    <g>
      <Rect w={w} h={h} r={r} />
      <line x1={s} x2={s} y1={0} y2={h} className="stroke-fg-3" strokeWidth={1} style={NS} />
      <line x1={w - s} x2={w - s} y1={0} y2={h} className="stroke-fg-3" strokeWidth={1} style={NS} />
      <Rect x={s + 3} y={(h - scrH) / 2} w={scrW} h={scrH} r={1} cls={FACE} sw={1} />
      <Circle cx={s / 2} cy={h * 0.32} r={Math.min(8, s * 0.24)} cls={LINE} sw={1} />
      <Circle cx={w - s / 2} cy={h * 0.62} r={Math.min(8, s * 0.24)} cls={LINE} sw={1} />
      {[
        [0, -1],
        [1, 0],
        [0, 1],
        [-1, 0],
      ].map(([dx, dy], i) => (
        <g key={i}>
          <Circle cx={w - s / 2 + dx * 6} cy={h * 0.3 + dy * 6} r={2.6} cls={LINE} sw={1} />
          <Circle cx={s / 2 + dx * 6} cy={h * 0.64 + dy * 6} r={2.4} cls={LINE} sw={1} />
        </g>
      ))}
    </g>
  );
}

function Floppy({ o }: { o: ClientObj }) {
  const { w, h } = o;
  return (
    <g>
      <path d={`M0 0 H${w - 3} L${w} 3 V${h} H0 Z`} className={BODY} strokeWidth={1.25} style={NS} />
      <Rect x={w * 0.25} y={0} w={w * 0.52} h={h * 0.3} r={0.5} cls={FACE} sw={1} />
      <Rect x={w * 0.55} y={h * 0.04} w={w * 0.12} h={h * 0.2} cls={MUTED} sw={0} />
      <Rect x={w * 0.1} y={h * 0.4} w={w * 0.8} h={h * 0.56} r={0.8} cls={FACE} sw={1} />
    </g>
  );
}

function Cassette({ o }: { o: ClientObj }) {
  const { w, h } = o;
  return (
    <g>
      <Rect w={w} h={h} r={2} />
      <Rect x={w * 0.06} y={h * 0.08} w={w * 0.88} h={h * 0.62} r={1.5} cls={FACE} sw={1} />
      <Rect x={w * 0.24} y={h * 0.3} w={w * 0.52} h={h * 0.26} r={3} cls={MUTED} sw={0} />
      <Circle cx={w * 0.33} cy={h * 0.43} r={h * 0.09} cls={BODY} sw={1} />
      <Circle cx={w * 0.67} cy={h * 0.43} r={h * 0.09} cls={BODY} sw={1} />
      <path d={`M${w * 0.2} ${h} L${w * 0.26} ${h * 0.78} H${w * 0.74} L${w * 0.8} ${h}`} className={LINE} strokeWidth={1} style={NS} />
    </g>
  );
}

function Photo({ o }: { o: ClientObj }) {
  const { w, h } = o;
  const s = Math.min(w, h);
  return (
    <g>
      <Rect w={w} h={h} cls={FACE} />
      <Circle cx={w / 2} cy={h * 0.4} r={s * 0.21} cls={MUTED} sw={0} />
      <path d={`M${w * 0.14} ${h} C${w * 0.16} ${h * 0.68}, ${w * 0.84} ${h * 0.68}, ${w * 0.86} ${h} Z`} className={MUTED} />
    </g>
  );
}

function Print({ o, inset = 0, frameBottom = 0 }: { o: ClientObj; inset?: number; frameBottom?: number }) {
  const { w, h } = o;
  const x = inset;
  const y = inset;
  const iw = w - 2 * inset;
  const ih = h - inset - Math.max(inset, frameBottom);
  return (
    <g>
      <Rect w={w} h={h} r={inset ? 1 : 0} cls={FACE} />
      {inset > 0 && <Rect x={x} y={y} w={iw} h={ih} cls={MUTED} sw={0} />}
      <path
        d={`M${x} ${y + ih} L${x + iw * 0.35} ${y + ih * 0.5} L${x + iw * 0.55} ${y + ih * 0.72} L${x + iw * 0.75} ${y + ih * 0.45} L${x + iw} ${y + ih * 0.8} V${y + ih} Z`}
        className={inset ? "fill-fg-3 opacity-40" : MUTED}
      />
      <Circle cx={x + iw * 0.78} cy={y + ih * 0.22} r={Math.min(iw, ih) * 0.08} cls={inset ? "fill-fg-3 opacity-40" : MUTED} sw={0} />
    </g>
  );
}

/** Draw the object with its top-left corner at (0, 0). */
export function ObjectArt({ o }: { o: ClientObj }) {
  const { w, h } = o;
  switch (o.shape) {
    case "card":
      return (
        <g>
          <Rect w={w} h={h} r={o.r ?? 3.18} cls={ACCENT} />
          <Rect x={w * 0.117} y={h * 0.34} w={w * 0.134} h={h * 0.167} r={1.2} cls={GOLD} sw={1} />
          <path d={`M${w * 0.117} ${h * 0.42} H${w * 0.251} M${w * 0.184} ${h * 0.34} V${h * 0.507}`} className="fill-none stroke-warn" strokeWidth={1} style={NS} />
          <Rect x={w * 0.117} y={h * 0.64} w={w * 0.6} h={h * 0.06} r={0.5} cls={MUTED} sw={0} />
        </g>
      );
    case "rect":
      return (
        <g>
          <Rect w={w} h={h} r={o.r ?? 0} />
          <CenterLabel o={o} />
        </g>
      );
    case "paper":
      return (
        <g>
          <Rect w={w} h={h} cls={FACE} />
          {o.label && (
            <Label x={w / 2} y={h / 2} size={fit(o.label, w * 0.6, h * 0.3, Math.min(w, h) * 0.22)}>
              {o.label}
            </Label>
          )}
        </g>
      );
    case "envelope":
      return (
        <g>
          <Rect w={w} h={h} cls={FACE} />
          <path d={`M0 0 L${w / 2} ${h * 0.55} L${w} 0`} className={LINE} strokeWidth={1} style={NS} />
          {o.label && (
            <Label x={w / 2} y={h * 0.78} size={fit(o.label, w * 0.5, h * 0.3, 24)}>
              {o.label}
            </Label>
          )}
        </g>
      );
    case "photo":
      return <Photo o={o} />;
    case "print":
      return <Print o={o} />;
    case "instant":
      return <Print o={o} inset={Math.min(w, h) * 0.075} frameBottom={o.hole ?? 0} />;
    case "banknote":
      return (
        <g>
          <Rect w={w} h={h} r={1} cls={ACCENT} />
          <Rect x={4} y={4} w={w - 8} h={h - 8} r={1} cls="fill-none stroke-accent" sw={1} />
          <Circle cx={w * 0.8} cy={h / 2} r={h * 0.26} cls={MUTED} sw={0} />
          {o.label && (
            <Label x={w * 0.36} y={h / 2} size={fit(o.label, w * 0.5, h * 0.5, 22)} cls="fill-accent">
              {o.label}
            </Label>
          )}
        </g>
      );
    case "sim": {
      const c = Math.min(w, h) * 0.2;
      return (
        <g>
          <path d={`M0 0 H${w - c} L${w} ${c} V${h} H0 Z`} className={BODY} strokeWidth={1.25} style={NS} />
          <Rect x={w / 2 - Math.min(w * 0.6, 10) / 2} y={h / 2 - Math.min(h * 0.72, 8.2) / 2} w={Math.min(w * 0.6, 10)} h={Math.min(h * 0.72, 8.2)} r={1} cls={GOLD} sw={1} />
        </g>
      );
    }
    case "sd": {
      const c = w * 0.18;
      return (
        <g>
          <path d={`M0 0 H${w - c} L${w} ${c} V${h} H0 Z`} className={BODY} strokeWidth={1.25} style={NS} />
          {Array.from({ length: 8 }, (_, i) => (
            <Rect key={i} x={1.2 + i * 2.4} y={1} w={1.6} h={4} r={0.2} cls={GOLD} sw={0} />
          ))}
          <CenterLabel o={o} cap={7} />
        </g>
      );
    }
    case "microsd":
      return (
        <g>
          <path d={`M0 0 H${w} V${h} H${w * 0.12} V${h * 0.5} L0 ${h * 0.44} Z`} className={BODY} strokeWidth={1.25} style={NS} />
          {Array.from({ length: 8 }, (_, i) => (
            <Rect key={i} x={0.9 + i * 1.19} y={0.8} w={0.8} h={2.6} r={0.1} cls={GOLD} sw={0} />
          ))}
        </g>
      );
    case "playing-card":
      return (
        <g>
          <Rect w={w} h={h} r={o.r ?? 3} cls={FACE} />
          <Label x={5} y={6} size={5}>
            A
          </Label>
          <Label x={5} y={11} size={4.5}>
            ♠
          </Label>
          <Label x={w / 2} y={h / 2} size={w * 0.35}>
            ♠
          </Label>
          <Label x={w - 5} y={h - 6} size={5} rotate={180}>
            A
          </Label>
        </g>
      );
    case "coin":
    case "bimetal":
      return <Coin o={o} />;
    case "cell": {
      const r = w / 2;
      return (
        <g>
          <Circle cx={r} cy={r} r={r} />
          <Circle cx={r} cy={r} r={r * 0.88} cls={LINE} sw={1} />
          <Label x={r} y={r * 0.55} size={r * 0.35}>
            +
          </Label>
          {o.label && (
            <Label x={r} y={r * 1.1} size={fit(o.label, r * 1.5, r * 0.6, r * 0.3)}>
              {o.label}
            </Label>
          )}
        </g>
      );
    }
    case "battery":
      return <Battery o={o} />;
    case "9v":
      return <NineVolt o={o} />;
    case "plug-usb-a":
    case "plug-usb-c":
    case "plug-micro-usb":
    case "plug-lightning":
    case "plug-hdmi":
      return <Plug o={o} />;
    case "jack": {
      const r = w / 2;
      return (
        <g>
          <Circle cx={r} cy={r} r={r} />
          <Circle cx={r} cy={r} r={r * 0.45} cls={FACE} sw={1} />
        </g>
      );
    }
    case "phone":
    case "tablet":
      return <Device o={o} />;
    case "watch": {
      const r = o.r ?? w * 0.27;
      return (
        <g>
          <Rect x={w} y={h * 0.26} w={1.4} h={h * 0.16} r={0.6} cls={FACE} sw={1} />
          <Rect w={w} h={h} r={r} />
          <Rect x={2.2} y={2.2} w={w - 4.4} h={h - 4.4} r={r - 2} cls={FACE} sw={1} />
        </g>
      );
    }
    case "watch-round":
      return (
        <g>
          <ellipse cx={w / 2} cy={h / 2} rx={w / 2} ry={h / 2} className={BODY} strokeWidth={1.25} style={NS} />
          <circle cx={w / 2} cy={h / 2} r={Math.min(w, h) / 2 - 3.5} className={FACE} strokeWidth={1} style={NS} />
        </g>
      );
    case "earbuds":
      return (
        <g>
          <Rect w={w} h={h} r={o.r ?? Math.min(w, h) * 0.3} cls={FACE} />
          <line x1={0} x2={w} y1={h * 0.32} y2={h * 0.32} className="stroke-fg-3" strokeWidth={1} style={NS} />
          <Circle cx={w / 2} cy={h * 0.62} r={1} cls="fill-fg-3 stroke-none" sw={0} />
        </g>
      );
    case "airtag": {
      const r = w / 2;
      return (
        <g>
          <Circle cx={r} cy={r} r={r} />
          <Circle cx={r} cy={r} r={r * 0.8} cls={FACE} sw={1} />
        </g>
      );
    }
    case "console":
      return <Console o={o} />;
    case "lego": {
      const cols = o.cols ?? 1;
      const rows = o.rows ?? 1;
      const pitch = w / cols;
      return (
        <g>
          <Rect w={w} h={h} r={0.4} cls={ACCENT} />
          {Array.from({ length: cols * rows }, (_, i) => {
            const cx = pitch / 2 + (i % cols) * pitch;
            const cy = h / rows / 2 + Math.floor(i / cols) * (h / rows);
            return (
              <g key={i}>
                <Circle cx={cx} cy={cy} r={2.4} cls={ACCENT} sw={1} />
                <Circle cx={cx} cy={cy} r={1.5} cls="fill-none stroke-accent opacity-50" sw={1} />
              </g>
            );
          })}
        </g>
      );
    }
    case "postit":
      return (
        <g>
          <Rect w={w} h={h} cls={GOLD} />
          <Rect w={w} h={Math.min(h * 0.22, 16)} cls="fill-warn opacity-15 stroke-none" sw={0} />
        </g>
      );
    case "disc": {
      const r = w / 2;
      const hole = (o.hole ?? 15) / 2;
      return (
        <g>
          <Circle cx={r} cy={r} r={r} cls={FACE} />
          <Circle cx={r} cy={r} r={Math.min(r * 0.96, hole * 3.1)} cls={LINE} sw={1} />
          <Circle cx={r} cy={r} r={Math.min(r * 0.9, hole * 2.2)} cls={MUTED} sw={0} />
          <Circle cx={r} cy={r} r={hole} cls="fill-bg stroke-fg-3" sw={1} />
        </g>
      );
    }
    case "floppy":
      return <Floppy o={o} />;
    case "cassette":
      return <Cassette o={o} />;
    case "cube": {
      const g = w / 3;
      return (
        <g>
          <Rect w={w} h={h} r={2.5} cls="fill-fg stroke-fg" />
          {Array.from({ length: 9 }, (_, i) => (
            <Rect key={i} x={(i % 3) * g + 1} y={Math.floor(i / 3) * g + 1} w={g - 2} h={g - 2} r={1.6} cls={ACCENT} sw={0} />
          ))}
        </g>
      );
    }
    case "ball": {
      const r = w / 2;
      return (
        <g>
          <Circle cx={r} cy={r} r={r} cls={o.label ? "fill-fg stroke-fg" : FACE} />
          {o.slug === "tennis-ball" && (
            <path
              d={`M${r * 0.18} ${r * 0.45} C${r * 0.75} ${r * 0.75}, ${r * 0.75} ${r * 1.25}, ${r * 0.18} ${r * 1.55} M${r * 1.82} ${r * 0.45} C${r * 1.25} ${r * 0.75}, ${r * 1.25} ${r * 1.25}, ${r * 1.82} ${r * 1.55}`}
              className={LINE}
              strokeWidth={1}
              style={NS}
            />
          )}
          {o.slug === "golf-ball" &&
            Array.from({ length: 19 }, (_, i) => {
              const ring = i === 0 ? 0 : i < 7 ? 1 : 2;
              const k = ring === 0 ? 0 : ring === 1 ? i - 1 : i - 7;
              const n = ring === 1 ? 6 : 12;
              const a = (k / n) * Math.PI * 2;
              const rr = ring * r * 0.34;
              return <Circle key={i} cx={Math.round((r + rr * Math.cos(a)) * 1000) / 1000} cy={Math.round((r + rr * Math.sin(a)) * 1000) / 1000} r={r * 0.07} cls={MUTED} sw={0} />;
            })}
          {o.label && (
            <>
              <Circle cx={r} cy={r} r={r * 0.42} cls="fill-surface stroke-fg-3" sw={1} />
              <Label x={r} y={r} size={r * 0.5}>
                {o.label}
              </Label>
            </>
          )}
        </g>
      );
    }
    case "puck": {
      const r = w / 2;
      return (
        <g>
          <Circle cx={r} cy={r} r={r} cls="fill-fg stroke-fg" />
          <Circle cx={r} cy={r} r={r * 0.9} cls="fill-none stroke-bg" sw={1} />
        </g>
      );
    }
  }
}

/** Plain outline used for the "compare with" overlay. */
export function ObjectOutline({ o, className }: { o: ClientObj; className: string }) {
  const round = o.shape === "coin" || o.shape === "bimetal" || o.shape === "cell" || o.shape === "jack" || o.shape === "airtag" || o.shape === "disc" || o.shape === "ball" || o.shape === "puck";
  if (round) return <circle cx={o.w / 2} cy={o.h / 2} r={o.w / 2} className={className} style={NS} strokeWidth={1.5} strokeDasharray="4 3" fill="none" />;
  if (o.shape === "watch-round") return <ellipse cx={o.w / 2} cy={o.h / 2} rx={o.w / 2} ry={o.h / 2} className={className} style={NS} strokeWidth={1.5} strokeDasharray="4 3" fill="none" />;
  const r =
    o.r ??
    (o.shape === "card" ? 3.18 : o.shape === "phone" ? (o.home ? 9 : o.w * 0.15) : o.shape === "tablet" ? 10 : o.shape === "watch" ? o.w * 0.27 : o.shape === "plug-usb-c" || o.shape === "plug-lightning" ? o.h / 2 : 0);
  return <rect width={o.w} height={o.h} rx={Math.min(r, o.w / 2, o.h / 2)} className={className} style={NS} strokeWidth={1.5} strokeDasharray="4 3" fill="none" />;
}
