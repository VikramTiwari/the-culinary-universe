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
import { useAlchemicalURLSync } from './useAlchemicalURLSync';

export function useVectorMathState(alchemyActive: boolean) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // URL State Synced Params Hook (Disables standard sync on lab page)
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
  } = useMapSearchParams(alchemyActive);

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
  const [customName, setCustomName] = useState('Synthesized Compound');
  const [urlName, setUrlName] = useState('Synthesized Compound');
  const [isNameEdited, setIsNameEdited] = useState(false);

  // Dynamically update the default name if the user hasn't custom-named it yet
  useEffect(() => {
    if (!alchemyActive || isNameEdited || ingredients.length === 0) return;
    
    const totalCount = positives.length + negatives.length;
    let name = 'Synthesized Compound';
    if (totalCount === 0) {
      name = 'Empty Formulation';
    } else if (totalCount === 1) {
      const idx = positives.length === 1 ? positives[0] : negatives[0];
      name = ingredients[idx]?.name || 'Synthesized Compound';
    }
    setCustomName(name);
    setUrlName(name);
  }, [positives, negatives, ingredients, isNameEdited, alchemyActive]);

  // Synchronize additions and subtractions to URL query params for easy link sharing
  useAlchemicalURLSync({
    alchemyActive,
    ingredients,
    positives,
    setPositives,
    negatives,
    setNegatives,
    customName: urlName,
    setCustomName: (name) => {
      const val = typeof name === 'function' ? name(urlName) : name;
      setCustomName(val);
      setUrlName(val);
    },
    setIsNameEdited
  });

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

  // Real-time sensory, zoom, and coordinate projections for alchemist workbench
  const { alchemicalNode, synthesizedSensory, dynamicZoom } = useAlchemicalCalculations({
    alchemyActive,
    positives,
    negatives,
    pointCloud,
    searchResults,
    ingredients,
    customName
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
  const hasOrientedRef = useRef(false);

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

  // Keep alchemical compound front and center in alchemist lab mode (only once on initial compound formation)
  useEffect(() => {
    if (alchemyActive && alchemicalNode) {
      if (!hasOrientedRef.current) {
        hasOrientedRef.current = true;
        setAutoRotate(false);
        resetInactivityTimer();
        targetAngleYRef.current = -Math.atan2(alchemicalNode.x, alchemicalNode.z);
        targetAngleXRef.current = Math.atan2(alchemicalNode.y, Math.sqrt(alchemicalNode.x * alchemicalNode.x + alchemicalNode.z * alchemicalNode.z));
      }
    } else if (!alchemicalNode) {
      hasOrientedRef.current = false;
    }
  }, [alchemyActive, alchemicalNode]);

  // Synchronize dynamic alchemical zoom to the zoom state when ingredients change
  useEffect(() => {
    if (alchemyActive && dynamicZoom !== undefined) {
      setZoom(dynamicZoom);
    }
  }, [alchemyActive, dynamicZoom, setZoom]);

  // Force disable autoRotate when alchemist lab mode becomes active
  useEffect(() => {
    if (alchemyActive) setAutoRotate(false);
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
    if (primaryIdx === null || pointCloud.length === 0 || alchemyActive) return setHoveredNeighbors([]);
    const target = pointCloud[primaryIdx];
    if (!target) return;
    const candidates = pointCloud
      .filter((p) => p.index !== primaryIdx)
      .map((p) => ({ name: p.name, score: Math.sqrt((p.x - target.x) ** 2 + (p.y - target.y) ** 2 + (p.z - target.z) ** 2) }))
      .sort((a, b) => a.score - b.score);
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
  const matchPercentage = useMemo(() => {
    if (primaryIdx === null || compareIdx === null) return undefined;
    const p1 = pointCloud[primaryIdx], p2 = pointCloud[compareIdx];
    if (!p1 || !p2) return undefined;
    const dist = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2 + (p1.z - p2.z) ** 2);
    return Math.max(0, 100 - dist * 0.15);
  }, [primaryIdx, compareIdx, pointCloud]);

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
    customName,
    setCustomName,
    setUrlName,
    setIsNameEdited,
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
