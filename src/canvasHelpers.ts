import { project3DTo2D, ProjectionParams, ProjectedPoint } from './math';
import { TASTE_NAMES, TASTE_RGBS } from './constants';

export interface Star {
  x: number;
  y: number;
  z: number;
  opacity: number;
  radius: number;
}

export interface CanvasProjectedPoint extends ProjectedPoint {
  index: number;
  name: string;
  color: string;
  color2?: string;
  x: number;
  y: number;
  z: number;
}

export function drawCosmicDust(ctx: CanvasRenderingContext2D, cosmicDust: Star[], params: ProjectionParams) {
  ctx.fillStyle = 'rgba(96, 108, 56, 0.38)';
  cosmicDust.forEach((star) => {
    const { px, py, scale } = project3DTo2D(star, params);
    ctx.globalAlpha = star.opacity * scale;
    ctx.beginPath();
    ctx.arc(px, py, star.radius * scale * 2, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1.0;
}

export function drawAxes(
  ctx: CanvasRenderingContext2D,
  params: ProjectionParams,
  axisTasteX: number,
  axisTasteY: number,
  axisTasteZ: number,
  zoom: number
) {
  ctx.lineWidth = 2.0;

  const labelX = axisTasteX === -1
    ? 'SWEET (+X)'
    : `${TASTE_NAMES[axisTasteX].toUpperCase()} (+X)`;

  const labelY = axisTasteY === -1
    ? 'SPICY (+Y)'
    : `${TASTE_NAMES[axisTasteY].toUpperCase()} (+Y)`;

  const labelZ = axisTasteZ === -1
    ? 'SALTY (+Z)'
    : `${TASTE_NAMES[axisTasteZ].toUpperCase()} (+Z)`;

  const axes = [
    { x: 220, y: 0, z: 0, color: '#212529', label: labelX },
    { x: 0, y: -220, z: 0, color: '#212529', label: labelY },
    { x: 0, y: 0, z: 220, color: '#212529', label: labelZ }
  ];

  ctx.font = 'italic 700 16px "Cormorant Garamond", Georgia, serif';
  ctx.fillStyle = '#212529';
  ctx.strokeStyle = '#212529';

  axes.forEach((axis) => {
    const { px, py } = project3DTo2D(axis, { ...params, zoom });
    ctx.beginPath();
    ctx.moveTo(params.centerX, params.centerY);
    ctx.lineTo(px, py);
    ctx.stroke();

    ctx.fillText(axis.label, px + 6, py + 4);
  });
}

export function drawNeighborsTethers(ctx: CanvasRenderingContext2D, projected: CanvasProjectedPoint[], primaryIdx: number) {
  const hp = projected.find((p) => p.index === primaryIdx);
  if (!hp) return;

  const tethers = projected
    .filter((p) => p.index !== primaryIdx)
    .map((p) => {
      const dx = p.x - hp.x, dy = p.y - hp.y, dz = p.z - hp.z;
      return { node: p, dist: Math.sqrt(dx * dx + dy * dy + dz * dz) };
    });

  tethers.sort((a, b) => a.dist - b.dist);
  ctx.lineWidth = 1.0;
  ctx.strokeStyle = 'rgba(96, 108, 56, 0.35)';
  ctx.fillStyle = 'rgba(33, 37, 41, 0.75)';
  ctx.font = 'italic 500 15px "Cormorant Garamond", Georgia, serif';

  tethers.slice(0, 3).forEach((t) => {
    ctx.globalAlpha = 0.55 * t.node.scale;
    ctx.setLineDash([3, 4]);

    ctx.beginPath();
    ctx.moveTo(hp.px, hp.py);
    ctx.lineTo(t.node.px, t.node.py);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillText(t.node.name, t.node.px + 7, t.node.py + 4);
  });
  ctx.globalAlpha = 1.0;
}

export function drawComparisonTether(ctx: CanvasRenderingContext2D, pX: CanvasProjectedPoint, pY: CanvasProjectedPoint) {
  ctx.globalAlpha = 0.95;
  ctx.lineWidth = 2.0;
  ctx.strokeStyle = '#be4b34';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(pX.px, pX.py);
  ctx.lineTo(pY.px, pY.py);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1.0;
}

export function drawStandardParticles(
  ctx: CanvasRenderingContext2D,
  projected: CanvasProjectedPoint[],
  selectedIdx: number | null,
  hoveredIdx: number | null,
  randomHighlights: number[] = []
) {
  projected.forEach((p) => {
    const isActive = p.index === selectedIdx || p.index === hoveredIdx || randomHighlights.includes(p.index);
    if (isActive) return;

    const radius = Math.max(0.5, 2.8 * p.scale);
    const opacity = Math.min(Math.max((p.scale - 0.25) * 1.5, 0.04), 0.85);

    ctx.beginPath();
    ctx.arc(p.px, p.py, radius, 0, Math.PI * 2);

    const rgb = TASTE_RGBS[p.color] || '99, 102, 241';
    ctx.fillStyle = `rgba(${rgb}, ${opacity.toFixed(3)})`;
    ctx.fill();
  });
}

export function drawActiveNode(
  ctx: CanvasRenderingContext2D,
  p: CanvasProjectedPoint,
  frame: number,
  isHoveredCompare: boolean,
  isRandomHighlight: boolean = false
) {
  ctx.globalAlpha = isRandomHighlight ? 0.65 : 1.0;
  const baseRadius = 8.5;
  const radius = Math.max(1.0, baseRadius * p.scale);
  const pulse = (frame % 60) / 60;

  ctx.beginPath();
  ctx.arc(p.px, p.py, radius * (1.0 + pulse * 2.2), 0, Math.PI * 2);
  ctx.strokeStyle = isHoveredCompare ? `rgba(190, 75, 52, ${0.8 - pulse})` : `rgba(96, 108, 56, ${0.8 - pulse})`;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(p.px, p.py, radius * 3.5, 0, Math.PI * 2);
  ctx.fillStyle = isHoveredCompare ? 'rgba(190, 75, 52, 0.09)' : 'rgba(96, 108, 56, 0.09)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(p.px, p.py, radius, 0, Math.PI * 2);
  if (p.color2) {
    const grad = ctx.createLinearGradient(p.px - radius, p.py - radius, p.px + radius, p.py + radius);
    grad.addColorStop(0, p.color);
    grad.addColorStop(0.5, p.color);
    grad.addColorStop(0.5, p.color2);
    grad.addColorStop(1, p.color2);
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = p.color;
  }
  ctx.fill();

  ctx.beginPath();
  ctx.arc(p.px, p.py, radius, 0, Math.PI * 2);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.0;
  ctx.stroke();

  const labelX = p.px + radius + 10;
  const labelY = p.py + 4;
  ctx.font = 'italic 700 17px "Cormorant Garamond", Georgia, serif';
  ctx.textAlign = 'left';

  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillText(p.name, labelX - 1, labelY - 1);
  ctx.fillText(p.name, labelX + 1, labelY - 1);
  ctx.fillText(p.name, labelX - 1, labelY + 1);
  ctx.fillText(p.name, labelX + 1, labelY + 1);
  ctx.fillText(p.name, labelX, labelY - 1);
  ctx.fillText(p.name, labelX, labelY + 1);
  ctx.fillText(p.name, labelX - 1, labelY);
  ctx.fillText(p.name, labelX + 1, labelY);

  ctx.fillStyle = '#212529';
  ctx.fillText(p.name, labelX, labelY);
  ctx.globalAlpha = 1.0;
}

export function drawAlchemicalTethers(
  ctx: CanvasRenderingContext2D,
  alchemicalNode: any,
  projected: CanvasProjectedPoint[],
  projectionParams: ProjectionParams,
  zoom: number,
  singleElementIdx: number | null,
  frame: number
) {
  if (!alchemicalNode) return;
  const { px, py, scale } = project3DTo2D(alchemicalNode, { ...projectionParams, zoom });

  // 1. Draw glowing green lines to positive nodes with flowing fusion sparks
  if (alchemicalNode.positives.length + alchemicalNode.negatives.length >= 2) {
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = 'rgba(53, 95, 55, 0.45)'; // positive tethers (Rosemary Forest Green)
    ctx.setLineDash([3, 3]);
    alchemicalNode.positives.forEach((idx: number, posIdx: number) => {
      const p = projected.find((item) => item.index === idx);
      if (p) {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(p.px, p.py);
        ctx.stroke();

        // Energy spark flowing from ingredient star into the supernova compound core
        const t = ((frame * 0.02) + posIdx * 0.3) % 1.0;
        const sparkX = p.px * (1.0 - t) + px * t;
        const sparkY = p.py * (1.0 - t) + py * t;
        ctx.beginPath();
        ctx.arc(sparkX, sparkY, 3.8 * scale, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(72, 127, 101, 0.9)'; // Sweet emerald glow
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sparkX, sparkY, 1.8 * scale, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
    });

    // 2. Draw glowing red lines to negative nodes with flowing fusion sparks
    ctx.strokeStyle = 'rgba(190, 75, 52, 0.45)'; // negative tethers (Ripe Strawberry Red)
    alchemicalNode.negatives.forEach((idx: number, negIdx: number) => {
      const p = projected.find((item) => item.index === idx);
      if (p) {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(p.px, p.py);
        ctx.stroke();

        // Energy spark flowing from excluded node into the supernova core
        const t = ((frame * 0.02) + negIdx * 0.3) % 1.0;
        const sparkX = p.px * (1.0 - t) + px * t;
        const sparkY = p.py * (1.0 - t) + py * t;
        ctx.beginPath();
        ctx.arc(sparkX, sparkY, 3.8 * scale, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(190, 75, 52, 0.9)'; // Spicy ruby glow
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sparkX, sparkY, 1.8 * scale, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
    });
    ctx.setLineDash([]);
  }

  // 3. Draw tethers connecting to the nearest matches (sage accent)
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(96, 108, 56, 0.45)'; // standard tethers (Aromatic Sage Accent)
  ctx.fillStyle = 'rgba(33, 37, 41, 0.95)';
  ctx.font = 'italic 700 15px "Cormorant Garamond", Georgia, serif';
  ctx.setLineDash([3, 3]);

  alchemicalNode.searchResults.slice(0, 10).forEach((res: { index: number; score: number }) => {
    const p = projected.find((item) => item.index === res.index);
    if (p) {
      // Don't draw a tether to the active element itself
      if (p.index === singleElementIdx) return;

      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(p.px, p.py);
      ctx.stroke();

      const text = `${p.name} (${Math.max(0, 100 - res.score * 0.15).toFixed(0)}%)`;
      ctx.fillText(text, p.px + 7, p.py + 4);
    }
  });
  ctx.setLineDash([]);
}
