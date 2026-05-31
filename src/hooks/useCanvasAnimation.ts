import React, { useEffect } from 'react';
import { drawScene } from '../canvas';

interface CanvasAnimationProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  pointCloud: any[];
  currentCoordsRef: React.MutableRefObject<{ x: number; y: number; z: number }[]>;
  animationRef: React.MutableRefObject<number | null>;
  cosmicDust: any[];
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
  randomHighlights: number[];
  alchemicalNode: any;
  alchemyActive: boolean;
  tasteMeans: number[];
  angleXRef: React.MutableRefObject<number>;
  angleYRef: React.MutableRefObject<number>;
  targetAngleXRef: React.MutableRefObject<number | null>;
  targetAngleYRef: React.MutableRefObject<number | null>;
  isDragging: React.MutableRefObject<boolean>;
  projectedPointsRef: React.MutableRefObject<{ index: number; px: number; py: number }[]>;
  cancelTargetTransition: () => void;
  autoRotate: boolean;
  clusters: any[];
}

export function useCanvasAnimation({
  canvasRef,
  pointCloud,
  currentCoordsRef,
  animationRef,
  cosmicDust,
  zoom,
  showAxes,
  axisTasteX,
  axisTasteY,
  axisTasteZ,
  showTethers,
  primaryIdx,
  isComparing,
  selectedIdx,
  hoveredIdx,
  randomHighlights,
  alchemicalNode,
  alchemyActive,
  tasteMeans,
  angleXRef,
  angleYRef,
  targetAngleXRef,
  targetAngleYRef,
  isDragging,
  projectedPointsRef,
  cancelTargetTransition,
  autoRotate,
  clusters
}: CanvasAnimationProps) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || pointCloud.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth, height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    let frame = 0;
    
    // Scoped closure variable to track current active zoom level smoothly
    let currentZoom = zoom;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      frame++;
      
      currentZoom += (zoom - currentZoom) * 0.05;

      if (currentCoordsRef.current.length !== pointCloud.length) {
        currentCoordsRef.current = pointCloud.map((p) => ({ x: p.x, y: p.y, z: p.z }));
      }
      pointCloud.forEach((p, idx) => {
        const tx = axisTasteX === -1 ? p.x : (p.sensory[axisTasteX] - tasteMeans[axisTasteX]) * 350;
        const ty = axisTasteY === -1 ? p.y : (p.sensory[axisTasteY] - tasteMeans[axisTasteY]) * -350;
        const tz = axisTasteZ === -1 ? p.z : (p.sensory[axisTasteZ] - tasteMeans[axisTasteZ]) * 350;
        if (!currentCoordsRef.current[idx]) currentCoordsRef.current[idx] = { x: tx, y: ty, z: tz };
        currentCoordsRef.current[idx].x += (tx - currentCoordsRef.current[idx].x) * 0.08;
        currentCoordsRef.current[idx].y += (ty - currentCoordsRef.current[idx].y) * 0.08;
        currentCoordsRef.current[idx].z += (tz - currentCoordsRef.current[idx].z) * 0.08;
      });
      if (targetAngleXRef.current !== null && targetAngleYRef.current !== null) {
        let dx = Math.atan2(Math.sin(targetAngleXRef.current - angleXRef.current), Math.cos(targetAngleXRef.current - angleXRef.current));
        let dy = Math.atan2(Math.sin(targetAngleYRef.current - angleYRef.current), Math.cos(targetAngleYRef.current - angleYRef.current));
        angleXRef.current += dx * 0.08;
        angleYRef.current += dy * 0.08;
        if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
          angleXRef.current = targetAngleXRef.current;
          angleYRef.current = targetAngleYRef.current;
          cancelTargetTransition();
        }
      } else if (!isDragging.current && autoRotate) {
        angleYRef.current += 0.0012;
        angleXRef.current += Math.sin(frame * 0.006) * 0.0006;
      }
      const cosX = Math.cos(angleXRef.current), sinX = Math.sin(angleXRef.current);
      const cosY = Math.cos(angleYRef.current), sinY = Math.sin(angleYRef.current);
      const centerX = width / 2, centerY = height / 2;
      const cameraFocalLength = 520, cameraDistance = 380;
      const projectionParams = { cosX, sinX, cosY, sinY, centerX, centerY, cameraFocalLength, cameraDistance };

      projectedPointsRef.current = drawScene({
        ctx, pointCloud, currentCoords: currentCoordsRef.current, cosmicDust,
        projectionParams, zoom: currentZoom, showAxes, axisTasteX, axisTasteY, axisTasteZ,
        showTethers, primaryIdx, isComparing, selectedIdx, hoveredIdx, frame,
        randomHighlights,
        alchemicalNode,
        alchemyActive,
        clusters
      });
      animationRef.current = requestAnimationFrame(render);
    };
    render();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [
    pointCloud, hoveredIdx, selectedIdx, showAxes, showTethers, autoRotate,
    zoom, axisTasteX, axisTasteY, axisTasteZ, tasteMeans, cosmicDust,
    randomHighlights, alchemyActive, alchemicalNode, isComparing, primaryIdx,
    clusters
  ]);
}
