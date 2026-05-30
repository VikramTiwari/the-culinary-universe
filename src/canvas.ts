import { project3DTo2D } from './math';
import {
  drawCosmicDust,
  drawAxes,
  drawNeighborsTethers,
  drawComparisonTether,
  drawStandardParticles,
  drawActiveNode,
  drawAlchemicalTethers,
  CanvasProjectedPoint
} from './canvasHelpers';
import { DrawSceneOptions } from './types';

// Helper to convert hex taste colors to rgba with transparency
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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

  // The 3D center point of camera viewing space (translated to compound in alchemy mode)
  const centerOfSpace = (alchemyActive && alchemicalNode) ? alchemicalNode : { x: 0, y: 0, z: 0 };

  // Translate background cosmic dust relative to alchemical centerpiece
  const translatedCosmicDust = cosmicDust.map((star) => ({
    ...star,
    x: star.x - centerOfSpace.x,
    y: star.y - centerOfSpace.y,
    z: star.z - centerOfSpace.z
  }));

  drawCosmicDust(ctx, translatedCosmicDust, projectionParams);

  // Translate point cloud coordinates relative to alchemical centerpiece for perfect central orbital rotation
  let projected: CanvasProjectedPoint[] = pointCloud.map((p, idx) => {
    const coords = currentCoords[idx] || { x: p.x, y: p.y, z: p.z };
    const translatedCoords = {
      x: coords.x - centerOfSpace.x,
      y: coords.y - centerOfSpace.y,
      z: coords.z - centerOfSpace.z
    };
    const { px, py, scale, rz } = project3DTo2D(translatedCoords, { ...projectionParams, zoom });
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

  // Identify single alchemical element to highlight as the centerpiece
  const singleElementIdx = (alchemyActive && alchemicalNode && alchemicalNode.positives.length + alchemicalNode.negatives.length === 1)
    ? (alchemicalNode.positives.length === 1 ? alchemicalNode.positives[0] : alchemicalNode.negatives[0])
    : null;

  const currentSelectedIdx = selectedIdx !== null ? selectedIdx : singleElementIdx;

  if (showAxes) drawAxes(ctx, projectionParams, axisTasteX, axisTasteY, axisTasteZ, zoom);
  if (showTethers && primaryIdx !== null) drawNeighborsTethers(ctx, projected, primaryIdx);

  // Draw Alchemical connection and neighbor matches tethers dynamically via helpers module
  if (alchemicalNode) {
    drawAlchemicalTethers(ctx, alchemicalNode, projected, projectionParams, zoom, singleElementIdx, frame);
  }

  if (isComparing && currentSelectedIdx !== null && hoveredIdx !== null) {
    const pX = projected.find((p) => p.index === currentSelectedIdx);
    const pY = projected.find((p) => p.index === hoveredIdx);
    if (pX && pY) drawComparisonTether(ctx, pX, pY);
  }

  drawStandardParticles(ctx, projected, currentSelectedIdx, hoveredIdx, randomHighlights);

  // Draw all positive and negative workbench ingredient nodes as highlighted active nodes with original home colors
  if (alchemyActive && alchemicalNode) {
    alchemicalNode.positives.forEach((idx) => {
      if (idx === currentSelectedIdx || idx === hoveredIdx) return;
      const p = projected.find((item) => item.index === idx);
      if (p) drawActiveNode(ctx, p, frame, false, false);
    });

    alchemicalNode.negatives.forEach((idx) => {
      if (idx === currentSelectedIdx || idx === hoveredIdx) return;
      const p = projected.find((item) => item.index === idx);
      if (p) drawActiveNode(ctx, p, frame, true, false);
    });
  }

  randomHighlights.forEach((idx) => {
    if (idx === currentSelectedIdx || idx === hoveredIdx) return;
    const p = projected.find((item) => item.index === idx);
    if (p) drawActiveNode(ctx, p, frame, false, true);
  });

  if (currentSelectedIdx !== null) {
    const p = projected.find((item) => item.index === currentSelectedIdx);
    if (p) drawActiveNode(ctx, p, frame, false, false);
  }
  if (hoveredIdx !== null && hoveredIdx !== currentSelectedIdx) {
    const p = projected.find((item) => item.index === hoveredIdx);
    if (p) drawActiveNode(ctx, p, frame, true, false);
  }

  // Draw Alchemical Supernova Node Core on top (Only if there are 2 or more elements)
  if (alchemicalNode && alchemicalNode.positives.length + alchemicalNode.negatives.length >= 2) {
    const translatedAlchemicalNode = {
      x: alchemicalNode.x - centerOfSpace.x,
      y: alchemicalNode.y - centerOfSpace.y,
      z: alchemicalNode.z - centerOfSpace.z
    };
    const { px, py, scale } = project3DTo2D(translatedAlchemicalNode, { ...projectionParams, zoom });
    const baseRadius = 14.0; // Larger core diameter for dominant focal presence
    const radius = Math.max(1.0, baseRadius * scale);
    const pulse = (frame % 60) / 60;
    
    // Dynamically retrieve the sensory-reactive color signature
    const dominantColor = alchemicalNode.dominantColor || '#bf9525';

    // Glowing shell 1 (Primary - Dominant Taste Reactive Color)
    ctx.globalAlpha = 0.85 - pulse;
    ctx.beginPath();
    ctx.arc(px, py, radius * (1.0 + pulse * 1.8), 0, Math.PI * 2);
    ctx.strokeStyle = dominantColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Glowing shell 2 (Secondary, out-of-phase double pulsation Honey Gold corona)
    const pulse2 = ((frame + 30) % 60) / 60;
    ctx.globalAlpha = 0.5 - pulse2;
    ctx.beginPath();
    ctx.arc(px, py, radius * (1.0 + pulse2 * 2.5), 0, Math.PI * 2);
    ctx.strokeStyle = '#bf9525';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.globalAlpha = 1.0; // Reset global alpha

    // Inner deep radial glow (Dominant Taste Reactive)
    ctx.beginPath();
    ctx.arc(px, py, radius * 3.5, 0, Math.PI * 2);
    const glowGrad = ctx.createRadialGradient(px, py, 2, px, py, radius * 3.5);
    glowGrad.addColorStop(0, hexToRgba(dominantColor, 0.35));
    glowGrad.addColorStop(0.5, hexToRgba(dominantColor, 0.1));
    glowGrad.addColorStop(1, hexToRgba(dominantColor, 0.0));
    ctx.fillStyle = glowGrad;
    ctx.fill();

    // Solid core with linear alchemist gradient (Honey gold to dominant taste reactive color)
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    const coreGrad = ctx.createLinearGradient(px - radius, py - radius, px + radius, py + radius);
    coreGrad.addColorStop(0, '#bf9525'); 
    coreGrad.addColorStop(1, dominantColor); 
    ctx.fillStyle = coreGrad;
    ctx.fill();

    // Orbiting orbital cosmic sparks for stunning 3D depth and focal authority
    for (let i = 0; i < 5; i++) {
      const angle = (frame * 0.035) + (i * (Math.PI * 2 / 5));
      const rx = Math.cos(angle) * (radius * 2.4);
      const ry = Math.sin(angle) * (radius * 1.4); // Elliptical distortion
      ctx.beginPath();
      ctx.arc(px + rx, py + ry, 2.8 * scale, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? '#bf9525' : dominantColor;
      ctx.shadowColor = dominantColor;
      ctx.shadowBlur = 8;
      ctx.fill();
    }
    ctx.shadowBlur = 0; // Reset shadow blur

    // Inner bright white glow ring
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.0;
    ctx.stroke();

    // Golden border trim
    ctx.beginPath();
    ctx.arc(px, py, radius + 1, 0, Math.PI * 2);
    ctx.strokeStyle = '#bf9525';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // Alchemical name tag with heavy text outline
    const labelX = px + radius + 12;
    const labelY = py + 5;
    ctx.font = 'bold italic 20px "Cormorant Garamond", Georgia, serif';
    ctx.textAlign = 'left';

    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillText('🔮 Synthesized Compound', labelX - 1.5, labelY - 1.5);
    ctx.fillText('🔮 Synthesized Compound', labelX + 1.5, labelY - 1.5);
    ctx.fillText('🔮 Synthesized Compound', labelX - 1.5, labelY + 1.5);
    ctx.fillText('🔮 Synthesized Compound', labelX + 1.5, labelY + 1.5);

    ctx.fillStyle = dominantColor; // Glowing dominant alchemist taste color
    ctx.fillText('🔮 Synthesized Compound', labelX, labelY);
  }

  return projected.map((p) => ({ index: p.index, px: p.px, py: p.py }));
}
