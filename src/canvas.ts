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
import { TASTE_COLORS, TASTE_RGBS } from './constants';

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
    alchemyActive = false,
    clusters = []
  } = options;

  // The 3D center point of camera viewing space (translated to compound in alchemy mode)
  const centerOfSpace = (alchemyActive && alchemicalNode) ? alchemicalNode : { x: 0, y: 0, z: 0 };

  // 0. Draw Alchemical Color Nebulae Cluster Background Clouds
  if (alchemyActive && clusters && clusters.length > 0) {
    const selectedActiveIndices = new Set([...(alchemicalNode?.positives || []), ...(alchemicalNode?.negatives || [])]);
    const isAnySelected = selectedActiveIndices.size > 0;

    // Check which clusters contain at least one selected ingredient
    const activeClusterIds = new Set<number>();
    if (isAnySelected) {
      clusters.forEach((cluster, cIdx) => {
        const hasSelected = cluster.memberIndices.some(idx => selectedActiveIndices.has(idx));
        if (hasSelected) {
          activeClusterIds.add(cIdx);
        }
      });
    }

    clusters.forEach((cluster, cIdx) => {
      // Translate centroid coordinates relative to alchemical centerpiece (consistent with pointCloud translation!)
      const translatedCentroid = {
        x: cluster.centroid.x - centerOfSpace.x,
        y: cluster.centroid.y - centerOfSpace.y,
        z: cluster.centroid.z - centerOfSpace.z
      };

      const { px, py, scale } = project3DTo2D(translatedCentroid, { ...projectionParams, zoom });

      // Determine size and opacity based on selection state
      const isHighlighted = isAnySelected && activeClusterIds.has(cIdx);
      const isMuted = isAnySelected && !activeClusterIds.has(cIdx);

      // Default (no selections): soft 36% wash for beautiful, rich baseline saturation
      // Highlighted: expands to 65% wash for highly vibrant, saturated centers
      // Muted: fades to a quiet 6% shadow
      const opacity = isHighlighted ? 0.65 : (isMuted ? 0.06 : 0.36);
      
      // Radius: scaled up (up to 480px) to allow a wide, ultra-diffused edge transition
      const baseRadius = isHighlighted ? 480 : (isMuted ? 320 : 400);
      const radius = Math.max(10, baseRadius * scale);

      // Create an ultra-soft, highly feathered radial gradient on the 2D canvas context!
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      const glowGrad = ctx.createRadialGradient(px, py, 2, px, py, radius);
      
      const rgbStr = TASTE_RGBS[cluster.color] || '99, 102, 241';
      
      // Symmetric cosine-decay curve stops: hits exactly 0.50 (half intensity) at the 0.5 midpoint!
      const stops = [
        { offset: 0.0, mult: 1.00 },
        { offset: 0.1, mult: 0.98 }, // Beautifully rich core hold
        { offset: 0.2, mult: 0.90 },
        { offset: 0.3, mult: 0.79 },
        { offset: 0.4, mult: 0.65 },
        { offset: 0.5, mult: 0.50 }, // Exactly half intensity at the midpoint
        { offset: 0.6, mult: 0.35 },
        { offset: 0.7, mult: 0.21 },
        { offset: 0.8, mult: 0.10 },
        { offset: 0.9, mult: 0.02 }, // Soft feathery fade out
        { offset: 1.0, mult: 0.00 }  // Seamless boundary melt
      ];

      stops.forEach(stop => {
        glowGrad.addColorStop(stop.offset, `rgba(${rgbStr}, ${opacity * stop.mult})`);
      });
      
      ctx.fillStyle = glowGrad;
      ctx.fill();
    });
  }

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

  // Identify all active alchemical elements to highlight as active nodes in space
  const alchemicalActiveSet = new Set<number>();
  if (alchemyActive && alchemicalNode) {
    alchemicalNode.positives.forEach((idx) => alchemicalActiveSet.add(idx));
    alchemicalNode.negatives.forEach((idx) => alchemicalActiveSet.add(idx));
    alchemicalNode.searchResults.slice(0, 10).forEach((res) => alchemicalActiveSet.add(res.index));
  }

  projected.sort((a, b) => b.rz - a.rz);

  // Identify single alchemical element to highlight as the centerpiece
  const singleElementIdx = (alchemyActive && alchemicalNode && alchemicalNode.positives.length + alchemicalNode.negatives.length === 1)
    ? (alchemicalNode.positives.length === 1 ? alchemicalNode.positives[0] : alchemicalNode.negatives[0])
    : null;

  const currentSelectedIdx = selectedIdx !== null ? selectedIdx : singleElementIdx;

  if (showAxes && !alchemyActive) drawAxes(ctx, projectionParams, axisTasteX, axisTasteY, axisTasteZ, zoom);
  if (showTethers && primaryIdx !== null && !alchemyActive) drawNeighborsTethers(ctx, projected, primaryIdx);

  // Draw Alchemical connection and neighbor matches tethers dynamically via helpers module
  if (alchemicalNode) {
    drawAlchemicalTethers(
      ctx,
      alchemicalNode,
      projected,
      projectionParams,
      zoom,
      singleElementIdx,
      frame
    );
  }

  if (isComparing && currentSelectedIdx !== null && hoveredIdx !== null) {
    const pX = projected.find((p) => p.index === currentSelectedIdx);
    const pY = projected.find((p) => p.index === hoveredIdx);
    if (pX && pY) drawComparisonTether(ctx, pX, pY);
  }

  drawStandardParticles(
    ctx,
    projected,
    currentSelectedIdx,
    hoveredIdx,
    randomHighlights,
    alchemyActive,
    alchemicalActiveSet
  );

  // Draw all positive, negative, and search result matching nodes as highlighted active nodes with their original home colors
  if (alchemyActive && alchemicalNode) {
    alchemicalNode.positives.forEach((idx) => {
      if (idx === currentSelectedIdx || idx === hoveredIdx) return;
      const p = projected.find((item) => item.index === idx);
      if (p) drawActiveNode(ctx, p, frame, false, false, true);
    });

    alchemicalNode.negatives.forEach((idx) => {
      if (idx === currentSelectedIdx || idx === hoveredIdx) return;
      const p = projected.find((item) => item.index === idx);
      if (p) drawActiveNode(ctx, p, frame, true, false, true);
    });

    alchemicalNode.searchResults.slice(0, 10).forEach((res) => {
      if (res.index === currentSelectedIdx || res.index === hoveredIdx) return;
      const p = projected.find((item) => item.index === res.index);
      if (p) drawActiveNode(ctx, p, frame, false, false, false);
    });
  }

  randomHighlights.forEach((idx) => {
    if (idx === currentSelectedIdx || idx === hoveredIdx) return;
    const p = projected.find((item) => item.index === idx);
    if (p) drawActiveNode(ctx, p, frame, false, true);
  });

  if (currentSelectedIdx !== null) {
    if (!(alchemyActive && currentSelectedIdx === singleElementIdx)) {
      const p = projected.find((item) => item.index === currentSelectedIdx);
      if (p) drawActiveNode(ctx, p, frame, false, false);
    }
  }
  if (hoveredIdx !== null && hoveredIdx !== currentSelectedIdx) {
    const p = projected.find((item) => item.index === hoveredIdx);
    if (p) drawActiveNode(ctx, p, frame, true, false);
  }

  // Draw Alchemical Supernova Node Core on top (Only if there is 1 or more elements)
  if (alchemicalNode && alchemicalNode.positives.length + alchemicalNode.negatives.length >= 1) {
    const translatedAlchemicalNode = {
      x: alchemicalNode.x - centerOfSpace.x,
      y: alchemicalNode.y - centerOfSpace.y,
      z: alchemicalNode.z - centerOfSpace.z
    };
    const { px, py, scale } = project3DTo2D(translatedAlchemicalNode, { ...projectionParams, zoom });
    const baseRadius = 14.0; // Larger core diameter for dominant focal presence
    const radius = Math.max(1.0, baseRadius * scale);
    const pulse = (frame % 60) / 60;
    
    // Mathematically blend constituent flavor colors based on their active weights in the synthesized sensory profile
    const activeFlavors: { color: string; weight: number }[] = [];
    if (alchemicalNode.sensory) {
      alchemicalNode.sensory.forEach((val, idx) => {
        if (val > 0.02) {
          const color = TASTE_COLORS[idx] || '#bf9525';
          activeFlavors.push({ color, weight: val });
        }
      });
    }

    let blendedR = 0, blendedG = 0, blendedB = 0, totalWeight = 0;
    activeFlavors.forEach(({ color, weight }) => {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      blendedR += r * weight;
      blendedG += g * weight;
      blendedB += b * weight;
      totalWeight += weight;
    });

    let mixedColor = '#bf9525';
    if (totalWeight > 0) {
      const finalR = Math.round(blendedR / totalWeight);
      const finalG = Math.round(blendedG / totalWeight);
      const finalB = Math.round(blendedB / totalWeight);
      mixedColor = '#' + [finalR, finalG, finalB].map(v => {
        const hex = v.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('');
    }

    // Sort constituent active flavors by strength descending to build a beautiful multi-flavor gradient in the core
    const sortedFlavors = [...activeFlavors].sort((a, b) => b.weight - a.weight);
    const constituentFlavorColors = sortedFlavors.slice(0, 3).map(f => f.color);
    if (constituentFlavorColors.length === 0) {
      constituentFlavorColors.push('#bf9525');
    }

    // Glowing shell 1 (Primary - Weighted Blended Taste Reactive Color)
    ctx.globalAlpha = 0.85 - pulse;
    ctx.beginPath();
    ctx.arc(px, py, radius * (1.0 + pulse * 1.8), 0, Math.PI * 2);
    ctx.strokeStyle = mixedColor;
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

    // Inner deep radial glow (Weighted Blended Taste Reactive Color)
    ctx.beginPath();
    ctx.arc(px, py, radius * 3.5, 0, Math.PI * 2);
    const glowGrad = ctx.createRadialGradient(px, py, 2, px, py, radius * 3.5);
    glowGrad.addColorStop(0, hexToRgba(mixedColor, 0.35));
    glowGrad.addColorStop(0.5, hexToRgba(mixedColor, 0.1));
    glowGrad.addColorStop(1, hexToRgba(mixedColor, 0.0));
    ctx.fillStyle = glowGrad;
    ctx.fill();

    // Solid core with linear alchemist gradient blending dominant active flavor colors!
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    const coreGrad = ctx.createLinearGradient(px - radius, py - radius, px + radius, py + radius);
    if (constituentFlavorColors.length === 1) {
      coreGrad.addColorStop(0, '#bf9525'); 
      coreGrad.addColorStop(1, constituentFlavorColors[0]); 
    } else {
      constituentFlavorColors.forEach((color, idx) => {
        const stop = idx / (constituentFlavorColors.length - 1);
        coreGrad.addColorStop(stop, color);
      });
    }
    ctx.fillStyle = coreGrad;
    ctx.fill();

    // Orbiting orbital cosmic sparks matching constituent flavor colors for beautiful interactive depth
    for (let i = 0; i < 5; i++) {
      const angle = (frame * 0.035) + (i * (Math.PI * 2 / 5));
      const rx = Math.cos(angle) * (radius * 2.4);
      const ry = Math.sin(angle) * (radius * 1.4); // Elliptical distortion
      ctx.beginPath();
      ctx.arc(px + rx, py + ry, 2.8 * scale, 0, Math.PI * 2);
      ctx.fillStyle = constituentFlavorColors[i % constituentFlavorColors.length];
      ctx.shadowColor = mixedColor;
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

    const labelText = alchemicalNode.customName || 'Synthesized Compound';

    // Render clean text label positioned next to the alchemical node core
    const labelX = px + radius + 15;
    const labelY = py + 5;
    ctx.font = 'bold italic 20px "Cormorant Garamond", Georgia, serif';
    ctx.textAlign = 'left';

    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    [-1.5, 1.5].forEach((dx) => {
      [-1.5, 1.5].forEach((dy) => {
        ctx.fillText(labelText, labelX + dx, labelY + dy);
      });
    });

    ctx.fillStyle = mixedColor; // Glowing dominant alchemist taste color
    ctx.fillText(labelText, labelX, labelY);
  }

  return projected.map((p) => ({ index: p.index, px: p.px, py: p.py }));
}
