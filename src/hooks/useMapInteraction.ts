import React, { useRef, useEffect } from 'react';

interface UseMapInteractionProps {
  pointCloud: any[];
  hoveredIdx: number | null;
  setHoveredIdx: (idx: number | null) => void;
  setSelectedIdx: (idx: number | null) => void;
  setAutoRotate: (val: boolean) => void;
  userWantsAutoRotate: boolean;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  setAxisTasteX: (val: number) => void;
  setAxisTasteY: (val: number) => void;
  setAxisTasteZ: (val: number) => void;
}

export function useMapInteraction({
  pointCloud,
  hoveredIdx,
  setHoveredIdx,
  setSelectedIdx,
  setAutoRotate,
  userWantsAutoRotate,
  setZoom,
  setAxisTasteX,
  setAxisTasteY,
  setAxisTasteZ
}: UseMapInteractionProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const projectedPointsRef = useRef<{ index: number; px: number; py: number }[]>([]);
  const angleXRef = useRef<number>(-0.4);
  const angleYRef = useRef<number>(0.5);
  const targetAngleXRef = useRef<number | null>(null);
  const targetAngleYRef = useRef<number | null>(null);
  const isDragging = useRef<boolean>(false);
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);
  const clickStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const clickStartTimeRef = useRef<number>(0);
  const inactivityTimerRef = useRef<number | null>(null);
  const userWantsAutoRotateRef = useRef<boolean>(true);

  useEffect(() => {
    userWantsAutoRotateRef.current = userWantsAutoRotate;
  }, [userWantsAutoRotate]);

  const resetInactivityTimer = () => {
    setAutoRotate(false);
    if (inactivityTimerRef.current) window.clearTimeout(inactivityTimerRef.current);
    if (userWantsAutoRotateRef.current) {
      inactivityTimerRef.current = window.setTimeout(() => setAutoRotate(true), 5000);
    }
  };

  const cancelTargetTransition = () => {
    targetAngleXRef.current = null;
    targetAngleYRef.current = null;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleCanvasWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => Math.min(Math.max(z - e.deltaY * 0.0018, 0.4), 20.0));
      cancelTargetTransition();
      resetInactivityTimer();
    };
    canvas.addEventListener('wheel', handleCanvasWheel, { passive: false });
    return () => {
      if (inactivityTimerRef.current) window.clearTimeout(inactivityTimerRef.current);
      canvas.removeEventListener('wheel', handleCanvasWheel);
    };
  }, [setZoom]);

  const handleNodeClick = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || pointCloud.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const mx = clientX - rect.left, my = clientY - rect.top;
    let closestIdx: number | null = null, closestDist = 18;
    projectedPointsRef.current.forEach((pt) => {
      const dist = Math.sqrt((pt.px - mx) ** 2 + (pt.py - my) ** 2);
      if (dist < closestDist) { closestDist = dist; closestIdx = pt.index; }
    });
    if (closestIdx === null) {
      setSelectedIdx(null);
      setHoveredIdx(null);
      return;
    }
    setHoveredIdx(closestIdx);
    setSelectedIdx(closestIdx);
    const p = pointCloud[closestIdx];
    if (!p) return;
    setAutoRotate(false);
    resetInactivityTimer();
    targetAngleYRef.current = -Math.atan2(p.x, p.z);
    targetAngleXRef.current = Math.atan2(p.y, Math.sqrt(p.x * p.x + p.z * p.z));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startY.current = e.clientY;
    clickStartPosRef.current = { x: e.clientX, y: e.clientY };
    clickStartTimeRef.current = Date.now();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    cancelTargetTransition();
    resetInactivityTimer();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging.current) {
      resetInactivityTimer();
      angleYRef.current += (e.clientX - startX.current) * 0.004;
      angleXRef.current += (e.clientY - startY.current) * 0.004;
      startX.current = e.clientX;
      startY.current = e.clientY;
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    let closestIdx: number | null = null, closestDist = 14;
    projectedPointsRef.current.forEach((pt) => {
      const dist = Math.sqrt((pt.px - mx) ** 2 + (pt.py - my) ** 2);
      if (dist < closestDist) { closestDist = dist; closestIdx = pt.index; }
    });
    if (closestIdx !== hoveredIdx) setHoveredIdx(closestIdx);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    if (clickStartPosRef.current) {
      const dist = Math.sqrt((e.clientX - clickStartPosRef.current.x) ** 2 + (e.clientY - clickStartPosRef.current.y) ** 2);
      if (dist < 6 && Date.now() - clickStartTimeRef.current < 250) {
        handleNodeClick(e.clientX, e.clientY);
      }
    }
  };

  const handleResetAngles = () => {
    angleXRef.current = -0.4;
    angleYRef.current = 0.5;
    setZoom(7.0);
    setHoveredIdx(null);
    setSelectedIdx(null);
    setAxisTasteX(-1);
    setAxisTasteY(-1);
    setAxisTasteZ(-1);
    cancelTargetTransition();
    resetInactivityTimer();
  };

  return {
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
  };
}
