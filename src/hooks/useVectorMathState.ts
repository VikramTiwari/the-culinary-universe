import { useState, useEffect, useRef, useMemo } from 'react';
import { Ingredient } from '../types';
import {
  calculateUmapCenterOffset,
  calculateTasteMeans,
  generateCosmicDust,
  generatePointCloud
} from '../math';
import { useMapInteraction } from './useMapInteraction';
import { useVectorSearchWorker } from './useVectorSearchWorker';
import { useCanvasAnimation } from './useCanvasAnimation';
import { useMapSearchParams } from './useMapSearchParams';
import { useAlchemicalCalculations } from './useAlchemicalCalculations';

export function useVectorMathState(alchemyActive: boolean) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // URL State Synced Params Hook
  const {
    selectedIdx,
    setSelectedIdx,
    showAxes,
    setShowAxes,
    showTethers,
    setShowTethers,
    userWantsAutoRotate,
    setUserWantsAutoRotate,
    zoom,
    setZoom,
    axisTasteX,
    setAxisTasteX,
    axisTasteY,
    setAxisTasteY,
    axisTasteZ,
    setAxisTasteZ
  } = useMapSearchParams();

  const isComparing = selectedIdx !== null && hoveredIdx !== null && selectedIdx !== hoveredIdx;
  const primaryIdx = isComparing ? selectedIdx : (hoveredIdx !== null ? hoveredIdx : selectedIdx);
  const compareIdx = isComparing ? hoveredIdx : null;

  const [autoRotate, setAutoRotate] = useState(() => {
    if (alchemyActive) return false;
    return userWantsAutoRotate;
  });
  const [hoveredNeighbors, setHoveredNeighbors] = useState<{ name: string; score: number }[]>([]);

  // Alchemist workspace state
  const [positives, setPositives] = useState<number[]>([]);
  const [negatives, setNegatives] = useState<number[]>([]);

  // Consume Web Worker logic from our custom hook
  const {
    workerState,
    workerError,
    searchResults,
    searchLatency,
    searchState,
    searchError,
  } = useVectorSearchWorker(positives, negatives);

  const currentCoordsRef = useRef<{ x: number; y: number; z: number }[]>([]);
  const animationRef = useRef<number | null>(null);
  const cosmicDust = useMemo(() => generateCosmicDust(60), []);
  const umapCenterOffset = useMemo(() => calculateUmapCenterOffset(ingredients), [ingredients]);
  const tasteMeans = useMemo(() => calculateTasteMeans(ingredients), [ingredients]);

  const pointCloud = useMemo(() => generatePointCloud(ingredients, umapCenterOffset), [ingredients, umapCenterOffset]);
  const [randomHighlights, setRandomHighlights] = useState<number[]>([]);

  // Real-time sensory and coordinate projections for alchemist workbench
  const { alchemicalNode, synthesizedSensory } = useAlchemicalCalculations({
    alchemyActive,
    positives,
    negatives,
    pointCloud,
    searchResults,
    ingredients
  });

  const {
    canvasRef,
    projectedPointsRef,
    angleXRef,
    angleYRef,
    targetAngleXRef,
    targetAngleYRef,
    isDragging,
    inactivityTimerRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleResetAngles,
    resetInactivityTimer,
    cancelTargetTransition
  } = useMapInteraction({
    pointCloud,
    hoveredIdx,
    setHoveredIdx,
    setSelectedIdx,
    setAutoRotate,
    userWantsAutoRotate,
    zoom,
    setZoom,
    setAxisTasteX,
    setAxisTasteY,
    setAxisTasteZ
  });

  const hasAutofocusedRef = useRef(false);

  // Autofocus camera on the selected node on load
  useEffect(() => {
    if (selectedIdx !== null && pointCloud.length > 0 && !hasAutofocusedRef.current) {
      const p = pointCloud[selectedIdx];
      if (p) {
        hasAutofocusedRef.current = true;
        setAutoRotate(false);
        resetInactivityTimer();
        targetAngleYRef.current = -Math.atan2(p.x, p.z);
        targetAngleXRef.current = Math.atan2(p.y, Math.sqrt(p.x * p.x + p.z * p.z));
      }
    }
  }, [pointCloud, selectedIdx]);

  // Keep alchemical compound front and center in alchemist lab mode
  useEffect(() => {
    if (alchemyActive && alchemicalNode) {
      setAutoRotate(false);
      resetInactivityTimer();
      targetAngleYRef.current = -Math.atan2(alchemicalNode.x, alchemicalNode.z);
      targetAngleXRef.current = Math.atan2(alchemicalNode.y, Math.sqrt(alchemicalNode.x * alchemicalNode.x + alchemicalNode.z * alchemicalNode.z));
    }
  }, [alchemyActive, alchemicalNode]);

  // Force disable autoRotate when alchemist lab mode becomes active
  useEffect(() => {
    if (alchemyActive) {
      setAutoRotate(false);
    }
  }, [alchemyActive]);

  useEffect(() => {
    fetch('./ingredients.json')
      .then((res) => res.json())
      .then((data: Ingredient[]) => setIngredients(data))
      .catch(() => setError('Failed to load ingredient metadata'));
  }, []);

  useEffect(() => {
    if (!autoRotate || pointCloud.length === 0 || alchemyActive) {
      setRandomHighlights([]);
      return;
    }
    const selectRandom = () => {
      const selected: number[] = [];
      const len = pointCloud.length;
      while (selected.length < Math.min(10, len)) {
        const rand = Math.floor(Math.random() * len);
        if (!selected.includes(rand)) selected.push(rand);
      }
      setRandomHighlights(selected);
    };
    selectRandom();
    const interval = setInterval(selectRandom, 4000);
    return () => clearInterval(interval);
  }, [autoRotate, pointCloud.length, alchemyActive]);

  useEffect(() => {
    if (primaryIdx === null || pointCloud.length === 0 || alchemyActive) {
      setHoveredNeighbors([]);
      return;
    }
    const target = pointCloud[primaryIdx];
    if (!target) return;
    const candidates = pointCloud
      .filter((p) => p.index !== primaryIdx)
      .map((p) => {
        const dx = p.x - target.x, dy = p.y - target.y, dz = p.z - target.z;
        return { name: p.name, score: Math.sqrt(dx * dx + dy * dy + dz * dz) };
      });
    candidates.sort((a, b) => a.score - b.score);
    setHoveredNeighbors(candidates.slice(0, 3));
  }, [primaryIdx, pointCloud, alchemyActive]);

  // Canvas animation loop handled via delegated custom hook
  useCanvasAnimation({
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
    autoRotate
  });

  // Calculate match percentage between primaryIdx and compareIdx using UMAP pointCloud distance
  let matchPercentage: number | undefined;
  if (primaryIdx !== null && compareIdx !== null && pointCloud[primaryIdx] && pointCloud[compareIdx]) {
    const p1 = pointCloud[primaryIdx];
    const p2 = pointCloud[compareIdx];
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = p1.z - p2.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    matchPercentage = Math.max(0, 100 - dist * 0.15);
  }

  return {
    ingredients,
    error,
    hoveredIdx,
    selectedIdx,
    setSelectedIdx,
    isComparing,
    primaryIdx,
    compareIdx,
    showAxes,
    setShowAxes,
    showTethers,
    setShowTethers,
    userWantsAutoRotate,
    setUserWantsAutoRotate,
    autoRotate,
    setAutoRotate,
    hoveredNeighbors,
    zoom,
    setZoom,
    axisTasteX,
    setAxisTasteX,
    axisTasteY,
    setAxisTasteY,
    axisTasteZ,
    setAxisTasteZ,
    positives,
    setPositives,
    negatives,
    setNegatives,
    workerState,
    workerError,
    searchResults,
    searchLatency,
    searchState,
    searchError,
    alchemicalNode,
    synthesizedSensory,
    matchPercentage,
    canvasRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleResetAngles,
    resetInactivityTimer,
    inactivityTimerRef,
    pointCloud,
    targetAngleXRef,
    targetAngleYRef
  };
}
