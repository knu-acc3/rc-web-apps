/* Monitor test patterns, drawn on a canvas at the device's real pixel size. */

export type PatternId = "gradient" | "black-level" | "white-level" | "gamma" | "sharpness" | "uniformity" | "backlight-bleed" | "color-bars";

export const PATTERNS: PatternId[] = ["gradient", "black-level", "white-level", "gamma", "sharpness", "uniformity", "backlight-bleed", "color-bars"];

export const PATTERN_TEXT: Record<PatternId, { ru: [string, string]; en: [string, string] }> = {
  gradient: {
    ru: ["Градиенты", "Переходы должны быть плавными. Ступеньки и полосы — признак 6-битной матрицы или агрессивной обработки цвета."],
    en: ["Gradients", "Transitions should be smooth. Steps and bands point to a 6-bit panel or heavy colour processing."],
  },
  "black-level": {
    ru: ["Уровень чёрного", "Хороший экран различает почти все квадраты, начиная со 2–3-го. Если первые сливаются с фоном — поднимите яркость или уровень чёрного."],
    en: ["Black level", "A good screen shows nearly every square from the 2nd–3rd on. If the first ones merge with the background, raise brightness or black level."],
  },
  "white-level": {
    ru: ["Уровень белого", "Должны различаться почти все квадраты до последнего. Если светлые сливаются с фоном — уменьшите контрастность."],
    en: ["White level", "Nearly every square up to the last should be visible. If the light ones merge with the background, lower the contrast."],
  },
  gamma: {
    ru: ["Гамма", "Отойдите на пару шагов и прищурьтесь: полоса, которая сливается с мелкой штриховкой фона, показывает гамму экрана. Норма — 2,2."],
    en: ["Gamma", "Step back and squint: the bar that blends with the fine-striped background shows the screen gamma. The standard is 2.2."],
  },
  sharpness: {
    ru: ["Чёткость", "Линии в 1 пиксель и шахматка должны быть ровными, без муара и цветной каймы. Мелкий текст — читаемым."],
    en: ["Sharpness", "1-pixel lines and the checkerboard should be even, with no moiré or colour fringes. Small text should be readable."],
  },
  uniformity: {
    ru: ["Равномерность", "Серый фон должен быть одинаковым по всему экрану. Пятна, тёмные углы и вертикальные полосы — неравномерная подсветка."],
    en: ["Uniformity", "The gray should look the same across the screen. Blotches, dark corners and vertical bands mean uneven backlight."],
  },
  "backlight-bleed": {
    ru: ["Засветы", "Выключите свет и смотрите прямо. Светлые пятна по краям — засветы подсветки; мягкое свечение, меняющееся с углом, — IPS glow."],
    en: ["Backlight bleed", "Turn the lights off and look straight on. Bright patches along the edges are backlight bleed; a glow that changes with the angle is IPS glow."],
  },
  "color-bars": {
    ru: ["Цветные полосы", "Все полосы — чистые насыщенные цвета без переходов в соседний. Белая полоса не должна отдавать синим или жёлтым."],
    en: ["Colour bars", "Every bar is a clean saturated colour with no tint of its neighbour. The white bar shouldn't look blue or yellow."],
  },
};

const fillGray = (_ctx: CanvasRenderingContext2D, v: number) => `rgb(${v},${v},${v})`;

/** A repeating fill from a tiny tile: `cells` is the tile as rows of 0 (white) / 1 (black). */
function tile(ctx: CanvasRenderingContext2D, cells: number[][], scale = 1): CanvasPattern | string {
  const c = document.createElement("canvas");
  c.width = cells[0].length * scale;
  c.height = cells.length * scale;
  const t = c.getContext("2d");
  if (!t) return "#808080";
  cells.forEach((row, y) =>
    row.forEach((v, x) => {
      t.fillStyle = v ? "#000" : "#fff";
      t.fillRect(x * scale, y * scale, scale, scale);
    }),
  );
  return ctx.createPattern(c, "repeat") ?? "#808080";
}

/** Draw `id` filling the whole canvas (its width/height are device pixels; `dpr` scales labels). */
export function drawPattern(ctx: CanvasRenderingContext2D, id: PatternId, w: number, h: number, dpr = 1): void {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const font = (px: number) => `${Math.round(px * dpr)}px system-ui, sans-serif`;
  switch (id) {
    case "gradient": {
      const rows: [string, string][] = [
        ["#000", "#fff"],
        ["#000", "#f00"],
        ["#000", "#0f0"],
        ["#000", "#00f"],
        ["#f00", "#00f"],
      ];
      const rh = h / rows.length;
      rows.forEach(([a, b], i) => {
        const g = ctx.createLinearGradient(0, 0, w, 0);
        g.addColorStop(0, a);
        g.addColorStop(1, b);
        ctx.fillStyle = g;
        ctx.fillRect(0, Math.floor(i * rh), w, Math.ceil(rh));
      });
      break;
    }
    case "black-level":
    case "white-level": {
      const black = id === "black-level";
      ctx.fillStyle = black ? "#000" : "#fff";
      ctx.fillRect(0, 0, w, h);
      const n = black ? 24 : 24;
      const cols = 8;
      const rows = n / cols;
      const cell = Math.min(w / (cols + 1), h / (rows + 1.5));
      const gap = cell * 0.15;
      const x0 = (w - cols * cell) / 2;
      const y0 = (h - rows * cell) / 2;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = font(Math.max(10, cell / dpr / 5));
      for (let i = 0; i < n; i++) {
        const v = black ? i + 1 : 254 - i;
        const x = x0 + (i % cols) * cell;
        const y = y0 + Math.floor(i / cols) * cell;
        ctx.fillStyle = fillGray(ctx, v);
        ctx.fillRect(x + gap / 2, y + gap / 2, cell - gap, cell - gap);
        ctx.fillStyle = black ? "#555" : "#aaa";
        ctx.fillText(String(v), x + cell / 2, y + cell / 2);
      }
      break;
    }
    case "gamma": {
      // Background: alternating black/white lines = 50 % light. A solid gray matches it at the screen's gamma.
      ctx.fillStyle = tile(ctx, [[1], [0]]);
      ctx.fillRect(0, 0, w, h);
      const gammas = [1.8, 2.0, 2.2, 2.4, 2.6];
      const bw = w / (gammas.length * 2 + 1);
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.font = font(18);
      gammas.forEach((g, i) => {
        const v = Math.round(255 * Math.pow(0.5, 1 / g));
        const x = bw * (i * 2 + 1);
        ctx.fillStyle = fillGray(ctx, v);
        ctx.fillRect(x, h * 0.2, bw, h * 0.6);
        ctx.fillStyle = "#000";
        ctx.fillRect(x, h * 0.82, bw, 30 * dpr);
        ctx.fillStyle = "#fff";
        ctx.fillText(g.toFixed(1), x + bw / 2, h * 0.82 + 6 * dpr);
      });
      break;
    }
    case "sharpness": {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, w, h);
      const q = Math.floor(w / 4);
      // 1-px vertical and horizontal line pairs, a 1-px checkerboard and a 2-px one.
      const parts: (CanvasPattern | string)[] = [tile(ctx, [[1, 0]]), tile(ctx, [[1], [0]]), tile(ctx, [[1, 0], [0, 1]]), tile(ctx, [[1, 0], [0, 1]], 2)];
      parts.forEach((p, i) => {
        ctx.fillStyle = p;
        ctx.fillRect(i * q, 0, i === 3 ? w - 3 * q : q, h / 2);
      });
      ctx.fillStyle = "#000";
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      let y = h / 2 + 16 * dpr;
      for (const px of [8, 9, 10, 11, 12, 14, 16, 20, 24]) {
        ctx.font = font(px);
        ctx.fillText(`${px}px — Съешь же ещё этих мягких французских булок. The quick brown fox jumps over the lazy dog 0123456789`, 16 * dpr, y);
        y += (px + 8) * dpr;
        if (y > h - 20 * dpr) break;
      }
      break;
    }
    case "uniformity":
      ctx.fillStyle = "#808080";
      ctx.fillRect(0, 0, w, h);
      break;
    case "backlight-bleed":
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);
      break;
    case "color-bars": {
      const bars = ["#ffffff", "#ffff00", "#00ffff", "#00ff00", "#ff00ff", "#ff0000", "#0000ff", "#000000"];
      const bw = w / bars.length;
      bars.forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.fillRect(Math.floor(i * bw), 0, Math.ceil(bw), h);
      });
      break;
    }
  }
  ctx.restore();
}
