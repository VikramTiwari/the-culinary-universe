import { project3DTo2D, ProjectionParams } from './math';
import { TASTE_COLORS, TASTE_RGBS } from './constants';
import { AlchemicalNode, Cluster } from './types';
import { CanvasProjectedPoint } from './canvasHelpers';

// Helper to convert hex taste colors to rgba with transparency
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function drawAlchemicalTethers(
  ctx: CanvasRenderingContext2D,
  alchemicalNode: any,
  projected: CanvasProjectedPoint[],
  projectionParams: ProjectionParams,
  zoom: number,
  _singleElementIdx: number | null,
  frame: number
) {
  if (!alchemicalNode) return;
  const { px, py, scale } = project3DTo2D({ x: 0, y: 0, z: 0 }, { ...projectionParams, zoom });

  if (alchemicalNode.positives.length + alchemicalNode.negatives.length >= 1) {
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = 'rgba(53, 95, 55, 0.45)';
    alchemicalNode.positives.forEach((idx: number, posIdx: number) => {
      const p = projected.find((item) => item.index === idx);
      if (p) {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(p.px, p.py);
        ctx.stroke();

        const t = ((frame * 0.02) + posIdx * 0.3) % 1.0;
        const sparkX = p.px * (1.0 - t) + px * t;
        const sparkY = p.py * (1.0 - t) + py * t;
        ctx.beginPath();
        ctx.arc(sparkX, sparkY, 3.8 * scale, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(72, 127, 101, 0.9)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sparkX, sparkY, 1.8 * scale, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
    });

    ctx.strokeStyle = 'rgba(190, 75, 52, 0.45)';
    alchemicalNode.negatives.forEach((idx: number, negIdx: number) => {
      const p = projected.find((item) => item.index === idx);
      if (p) {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(p.px, p.py);
        ctx.stroke();

        const t = ((frame * 0.02) + negIdx * 0.3) % 1.0;
        const sparkX = p.px * (1.0 - t) + px * t;
        const sparkY = p.py * (1.0 - t) + py * t;
        ctx.beginPath();
        ctx.arc(sparkX, sparkY, 3.8 * scale, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(190, 75, 52, 0.9)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sparkX, sparkY, 1.8 * scale, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
    });
  }
}

export function drawAlchemicalNebulae(
  ctx: CanvasRenderingContext2D,
  clusters: Cluster[],
  alchemicalNode: AlchemicalNode | null,
  projectionParams: ProjectionParams,
  zoom: number,
  centerOfSpace: { x: number; y: number; z: number }
) {
  if (!clusters || clusters.length === 0) return;
  const selectedActiveIndices = new Set([...(alchemicalNode?.positives || []), ...(alchemicalNode?.negatives || [])]);
  const isAnySelected = selectedActiveIndices.size > 0;

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
    const translatedCentroid = {
      x: cluster.centroid.x - centerOfSpace.x,
      y: cluster.centroid.y - centerOfSpace.y,
      z: cluster.centroid.z - centerOfSpace.z
    };

    const { px, py, scale } = project3DTo2D(translatedCentroid, { ...projectionParams, zoom });

    const isHighlighted = isAnySelected && activeClusterIds.has(cIdx);
    const isMuted = isAnySelected && !activeClusterIds.has(cIdx);

    const opacity = isHighlighted ? 0.65 : (isMuted ? 0.06 : 0.36);
    
    const baseRadius = isHighlighted ? 480 : (isMuted ? 320 : 400);
    const radius = Math.max(10, baseRadius * scale);

    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    const glowGrad = ctx.createRadialGradient(px, py, 2, px, py, radius);
    
    const rgbStr = TASTE_RGBS[cluster.color] || '99, 102, 241';
    
    const stops = [
      { offset: 0.0, mult: 1.00 },
      { offset: 0.1, mult: 0.98 },
      { offset: 0.2, mult: 0.90 },
      { offset: 0.3, mult: 0.79 },
      { offset: 0.4, mult: 0.65 },
      { offset: 0.5, mult: 0.50 },
      { offset: 0.6, mult: 0.35 },
      { offset: 0.7, mult: 0.21 },
      { offset: 0.8, mult: 0.10 },
      { offset: 0.9, mult: 0.02 },
      { offset: 1.0, mult: 0.00 }
    ];

    stops.forEach(stop => {
      glowGrad.addColorStop(stop.offset, `rgba(${rgbStr}, ${opacity * stop.mult})`);
    });
    
    ctx.fillStyle = glowGrad;
    ctx.fill();
  });
}

export function drawAlchemicalCore(
  ctx: CanvasRenderingContext2D,
  alchemicalNode: AlchemicalNode,
  projectionParams: ProjectionParams,
  zoom: number,
  centerOfSpace: { x: number; y: number; z: number },
  frame: number
) {
  const translatedAlchemicalNode = {
    x: alchemicalNode.x - centerOfSpace.x,
    y: alchemicalNode.y - centerOfSpace.y,
    z: alchemicalNode.z - centerOfSpace.z
  };
  const { px, py, scale } = project3DTo2D(translatedAlchemicalNode, { ...projectionParams, zoom });
  const baseRadius = 14.0; // Larger core diameter for dominant focal presence
  const radius = Math.max(1.0, baseRadius * scale);
  
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

  // Smooth sine-based breathing cycles for natural, premium alchemist animations
  const breath = Math.sin(frame * 0.035); // Smooth wave between -1 and 1
  const pulse1 = breath * 0.5 + 0.5; // [0, 1]
  const pulse2 = (-breath) * 0.5 + 0.5; // [0, 1], perfectly out-of-phase!

  
  // Glowing shell 1 (Primary - Weighted Blended Taste Reactive Color)
  ctx.globalAlpha = 0.15 + pulse1 * 0.35; // Gentle transition [0.15, 0.50]
  ctx.beginPath();
  ctx.arc(px, py, radius * (1.0 + pulse1 * 0.4), 0, Math.PI * 2);
  ctx.strokeStyle = mixedColor;
  ctx.lineWidth = 2.0;
  ctx.stroke();

  // Glowing shell 2 (Secondary - Out-of-phase Honey Gold corona)
  ctx.globalAlpha = 0.08 + pulse2 * 0.20; // Subtle transition [0.08, 0.28]
  ctx.beginPath();
  ctx.arc(px, py, radius * (1.0 + pulse2 * 0.6), 0, Math.PI * 2);
  ctx.strokeStyle = '#bf9525';
  ctx.lineWidth = 1.0;
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
  ctx.font = 'bold italic 24px "Cormorant Garamond", Georgia, serif';
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
