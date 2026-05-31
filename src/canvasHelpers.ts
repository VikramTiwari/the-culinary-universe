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
  const getLabel = (tasteIdx: number, fallback: string) =>
    tasteIdx === -1 ? fallback : `${TASTE_NAMES[tasteIdx].toUpperCase()} (+${fallback.slice(-1)})`;

  const axes = [
    { x: 220, y: 0, z: 0, color: '#212529', label: getLabel(axisTasteX, 'SWEET (+X)') },
    { x: 0, y: -220, z: 0, color: '#212529', label: getLabel(axisTasteY, 'SPICY (+Y)') },
    { x: 0, y: 0, z: 220, color: '#212529', label: getLabel(axisTasteZ, 'SALTY (+Z)') }
  ];

  ctx.font = 'italic 700 20px "Cormorant Garamond", Georgia, serif';
  ctx.fillStyle = ctx.strokeStyle = '#212529';

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
  ctx.font = 'italic 500 18px "Cormorant Garamond", Georgia, serif';

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
  randomHighlights: number[] = [],
  alchemyActive: boolean = false,
  alchemicalActiveSet?: Set<number>
) {
  projected.forEach((p) => {
    const isActive =
      p.index === selectedIdx ||
      p.index === hoveredIdx ||
      randomHighlights.includes(p.index) ||
      (alchemicalActiveSet && alchemicalActiveSet.has(p.index));
    if (isActive) return;

    const radius = Math.max(0.5, 2.8 * p.scale);
    let opacity = Math.min(Math.max((p.scale - 0.25) * 1.5, 0.04), 0.85);

    ctx.beginPath();
    ctx.arc(p.px, p.py, radius, 0, Math.PI * 2);

    let rgb = TASTE_RGBS[p.color] || '99, 102, 241';
    if (alchemyActive) {
      const parts = rgb.split(',').map((v) => parseInt(v.trim(), 10));
      if (parts.length === 3) {
        // Blend 40% original flavor color and 60% premium neutral sage gray for a beautiful desaturated pastel galaxy
        const r = Math.round(parts[0] * 0.4 + 120 * 0.6);
        const g = Math.round(parts[1] * 0.4 + 125 * 0.6);
        const b = Math.round(parts[2] * 0.4 + 120 * 0.6);
        rgb = `${r}, ${g}, ${b}`;
      }
      opacity = opacity * 0.35; // Faint, subtle presence
    }
    ctx.fillStyle = `rgba(${rgb}, ${opacity})`;
    ctx.fill();
  });
}

export function drawActiveNode(
  ctx: CanvasRenderingContext2D,
  p: CanvasProjectedPoint,
  frame: number,
  isHoveredCompare: boolean,
  isRandomHighlight: boolean = false,
  shouldPulse: boolean = true
) {
  ctx.globalAlpha = isRandomHighlight ? 0.65 : 1.0;
  const baseRadius = 8.5;
  const radius = Math.max(1.0, baseRadius * p.scale);

  if (shouldPulse) {
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
  }

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
  ctx.font = 'italic 700 21px "Cormorant Garamond", Georgia, serif';
  ctx.textAlign = 'left';

  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx !== 0 || dy !== 0) {
        ctx.fillText(p.name, labelX + dx, labelY + dy);
      }
    }
  }

  ctx.fillStyle = '#212529';
  ctx.fillText(p.name, labelX, labelY);
  ctx.globalAlpha = 1.0;
}


