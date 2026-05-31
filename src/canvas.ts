import { project3DTo2D } from './math';
import {
  drawCosmicDust,
  drawAxes,
  drawNeighborsTethers,
  drawComparisonTether,
  drawStandardParticles,
  drawActiveNode,
  CanvasProjectedPoint
} from './canvasHelpers';
import {
  drawAlchemicalTethers,
  drawAlchemicalNebulae,
  drawAlchemicalCore
} from './alchemyCanvasHelpers';
import { DrawSceneOptions } from './types';

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
    drawAlchemicalNebulae(ctx, clusters, alchemicalNode, projectionParams, zoom, centerOfSpace);
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

  // Draw all positive and negative nodes as highlighted active nodes with their original home colors
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
    drawAlchemicalCore(ctx, alchemicalNode, projectionParams, zoom, centerOfSpace, frame);
  }

  return projected.map((p) => ({ index: p.index, px: p.px, py: p.py }));
}

