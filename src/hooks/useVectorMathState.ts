import { useState, useEffect, useRef, useMemo } from 'react';
import { useMapInteraction } from './useMapInteraction';
import { useVectorSearchWorker } from './useVectorSearchWorker';
import { useCanvasAnimation } from './useCanvasAnimation';
import { useMapSearchParams } from './useMapSearchParams';
import {
  useAlchemicalCalculations,
  determineDefaultRecipeName
} from './useAlchemicalCalculations';
import { useAlchemicalURLSync } from './useAlchemicalURLSync';
import { useIngredientLoader } from './useIngredientLoader';
import { useMapHighlights } from './useMapHighlights';
import { INACTIVITY_TIMEOUT_MS } from '../constants';

export function useVectorMathState(alchemyActive: boolean) {
  const {
    ingredients,
    error,
    cosmicDust,
    tasteMeans,
    pointCloud,
    clusters
  } = useIngredientLoader();

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

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

  const { randomHighlights, hoveredNeighbors } = useMapHighlights(
    autoRotate,
    pointCloud,
    alchemyActive,
    primaryIdx
  );

  const [positives, setPositives] = useState<number[]>([]);
  const [negatives, setNegatives] = useState<number[]>([]);
  const [customName, setCustomName] = useState('Synthesized Compound');
  const [urlName, setUrlName] = useState('Synthesized Compound');
  const [isNameEdited, setIsNameEdited] = useState(false);

  useEffect(() => {
    if (!alchemyActive || isNameEdited || ingredients.length === 0) return;
    const name = determineDefaultRecipeName(positives, negatives, ingredients);
    setCustomName(name);
    setUrlName(name);
  }, [positives, negatives, ingredients, isNameEdited, alchemyActive]);

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
    setAxisTasteZ,
    alchemyActive
  });

  const hasAutofocusedRef = useRef(false);
  const hasOrientedRef = useRef(false);

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

  useEffect(() => {
    if (alchemyActive && dynamicZoom !== undefined) {
      setZoom(dynamicZoom);
    }
  }, [alchemyActive, dynamicZoom, setZoom]);

  useEffect(() => {
    if (!alchemyActive) return;
    let timer: number | null = null;
    const resetTimer = () => {
      setAutoRotate(false);
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        setAutoRotate(true);
      }, INACTIVITY_TIMEOUT_MS);
    };
    resetTimer();
    const activityEvents = ['pointerdown', 'keydown', 'wheel'];
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimer, { passive: true });
    });
    return () => {
      if (timer) window.clearTimeout(timer);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [alchemyActive]);

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
    autoRotate,
    clusters
  });

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
