import { project3DTo2D, ProjectionParams } from './math';
import {
  drawCosmicDust,
  drawAxes,
  drawNeighborsTethers,
  drawComparisonTether,
  drawStandardParticles,
  drawActiveNode,
  Star,
  CanvasProjectedPoint
} from './canvasHelpers';

export interface AlchemicalNode {
  x: number;
  y: number;
  z: number;
  positives: number[];
  negatives: number[];
  searchResults: { index: number; score: number }[];
}

export interface DrawSceneOptions {
  ctx: CanvasRenderingContext2D;
  pointCloud: any[];
  currentCoords: { x: number; y: number; z: number }[];
  cosmicDust: Star[];
  projectionParams: ProjectionParams;
  zoom: number;
  showAxes: boolean;
  axisTasteX: number;
  axisTasteY: number;
  axisTasteZ: number;
  showTethers: boolean;
  primaryIdx: number | null;
  isComparing: boolean;
  selectedIdx: number | null;
  hoveredIdx: number | null;
  frame: number;
  randomHighlights?: number[];
  alchemicalNode?: AlchemicalNode | null;
  alchemyActive?: boolean;
}

export function drawScene(options: DrawSceneOptions) {
  const {
    ctx, pointCloud, currentCoords, cosmicDust, projectionParams, zoom,
    showAxes, axisTasteX, axisTasteY, axisTasteZ,
    showTethers, primaryIdx, isComparing, selectedIdx, hoveredIdx, frame,
    randomHighlights = [],
    alchemicalNode = null,
    alchemyActive = false
  } = options;

  drawCosmicDust(ctx, cosmicDust, projectionParams);

  let projected: CanvasProjectedPoint[] = pointCloud.map((p, idx) => {
    const coords = currentCoords[idx] || { x: p.x, y: p.y, z: p.z };
    const { px, py, scale, rz } = project3DTo2D(coords, { ...projectionParams, zoom });
    return { ...p, px, py, scale, rz, x: coords.x, y: coords.y, z: coords.z };
  });

  // Filter UMAP stars in Alchemy Lab Mode (Focus Constellation)
  if (alchemyActive) {
    if (alchemicalNode) {
      const activeSet = new Set<number>();
      alchemicalNode.positives.forEach((idx) => activeSet.add(idx));
      alchemicalNode.negatives.forEach((idx) => activeSet.add(idx));
      alchemicalNode.searchResults.slice(0, 10).forEach((res) => activeSet.add(res.index));
      projected = projected.filter((p) => activeSet.has(p.index));
    } else {
      // Empty formulation board in alchemist lab mode: show zero stars!
      projected = [];
    }
  }

  projected.sort((a, b) => b.rz - a.rz);

  if (showAxes) drawAxes(ctx, projectionParams, axisTasteX, axisTasteY, axisTasteZ, zoom);
  if (showTethers && primaryIdx !== null) drawNeighborsTethers(ctx, projected, primaryIdx);

  // Draw Alchemical connection tethers
  if (alchemicalNode) {
    const { px, py } = project3DTo2D(alchemicalNode, { ...projectionParams, zoom });

    // 1. Draw glowing green lines to positive nodes
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(53, 95, 55, 0.55)'; // positive tethers (Rosemary Forest Green)
    ctx.setLineDash([2, 2]);
    alchemicalNode.positives.forEach((idx) => {
      const p = projected.find((item) => item.index === idx);
      if (p) {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(p.px, p.py);
        ctx.stroke();
      }
    });

    // 2. Draw glowing red lines to negative nodes
    ctx.strokeStyle = 'rgba(190, 75, 52, 0.55)'; // negative tethers (Ripe Strawberry Red)
    alchemicalNode.negatives.forEach((idx) => {
      const p = projected.find((item) => item.index === idx);
      if (p) {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(p.px, p.py);
        ctx.stroke();
      }
    });
    ctx.setLineDash([]);

    // 3. Draw tethers connecting to the nearest matches (sage accent)
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(96, 108, 56, 0.45)'; // standard tethers (Aromatic Sage Accent)
    ctx.fillStyle = 'rgba(33, 37, 41, 0.95)';
    ctx.font = 'italic 700 15px "Cormorant Garamond", Georgia, serif';
    ctx.setLineDash([3, 3]);

    alchemicalNode.searchResults.slice(0, 10).forEach((res) => {
      const p = projected.find((item) => item.index === res.index);
      if (p) {
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

  if (isComparing && selectedIdx !== null && hoveredIdx !== null) {
    const pX = projected.find((p) => p.index === selectedIdx);
    const pY = projected.find((p) => p.index === hoveredIdx);
    if (pX && pY) drawComparisonTether(ctx, pX, pY);
  }

  drawStandardParticles(ctx, projected, selectedIdx, hoveredIdx, randomHighlights);

  randomHighlights.forEach((idx) => {
    if (idx === selectedIdx || idx === hoveredIdx) return;
    const p = projected.find((item) => item.index === idx);
    if (p) drawActiveNode(ctx, p, frame, false, true);
  });

  if (selectedIdx !== null) {
    const p = projected.find((item) => item.index === selectedIdx);
    if (p) drawActiveNode(ctx, p, frame, false, false);
  }
  if (hoveredIdx !== null && hoveredIdx !== selectedIdx) {
    const p = projected.find((item) => item.index === hoveredIdx);
    if (p) drawActiveNode(ctx, p, frame, true, false);
  }

  // Draw Alchemical Supernova Node Core on top
  if (alchemicalNode) {
    const { px, py, scale } = project3DTo2D(alchemicalNode, { ...projectionParams, zoom });
    const baseRadius = 12.0;
    const radius = Math.max(1.0, baseRadius * scale);
    const pulse = (frame % 60) / 60;

    // Glowing shell
    ctx.beginPath();
    ctx.arc(px, py, radius * (1.0 + pulse * 1.8), 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(224, 122, 95, ${0.85 - pulse})`;
    ctx.lineWidth = 2.0;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(px, py, radius * 3.0, 0, Math.PI * 2);
    const glowGrad = ctx.createRadialGradient(px, py, 2, px, py, radius * 3.0);
    glowGrad.addColorStop(0, 'rgba(224, 122, 95, 0.25)');
    glowGrad.addColorStop(1, 'rgba(224, 122, 95, 0.0)');
    ctx.fillStyle = glowGrad;
    ctx.fill();

    // Solid core with linear alchemist gradient
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    const coreGrad = ctx.createLinearGradient(px - radius, py - radius, px + radius, py + radius);
    coreGrad.addColorStop(0, '#bf9525'); // Honey gold
    coreGrad.addColorStop(1, '#be4b34'); // Strawberry red
    ctx.fillStyle = coreGrad;
    ctx.fill();

    // Inner white glow
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Golden border
    ctx.beginPath();
    ctx.arc(px, py, radius + 1, 0, Math.PI * 2);
    ctx.strokeStyle = '#bf9525';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // Alchemical name tag
    const labelX = px + radius + 10;
    const labelY = py + 4;
    ctx.font = 'bold italic 18px "Cormorant Garamond", Georgia, serif';
    ctx.textAlign = 'left';

    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillText('🔮 Synthesized Compound', labelX - 1, labelY - 1);
    ctx.fillText('🔮 Synthesized Compound', labelX + 1, labelY - 1);
    ctx.fillText('🔮 Synthesized Compound', labelX - 1, labelY + 1);
    ctx.fillText('🔮 Synthesized Compound', labelX + 1, labelY + 1);

    ctx.fillStyle = '#be4b34'; // Glowing alchemist red
    ctx.fillText('🔮 Synthesized Compound', labelX, labelY);
  }

  return projected.map((p) => ({ index: p.index, px: p.px, py: p.py }));
}
