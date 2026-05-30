import { useState, useEffect, useRef, useMemo } from 'react';
import { Ingredient } from './types';
import {
  calculateUmapCenterOffset,
  calculateTasteMeans,
  generateCosmicDust,
  generatePointCloud
} from './math';
import { HeaderHUD } from './components/HeaderHUD';
import { LegendHUD } from './components/LegendHUD';
import { SensoryCardHUD } from './components/SensoryCardHUD';
import { ControlsHUD } from './components/ControlsHUD';
import { drawScene } from './canvas';
import { useMapInteraction } from './hooks/useMapInteraction';

export default function VectorMath() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  
  const [selectedIdx, setSelectedIdx] = useState<number | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('selected');
    return s ? parseInt(s, 10) : null;
  });
  
  const isComparing = selectedIdx !== null && hoveredIdx !== null && selectedIdx !== hoveredIdx;
  const primaryIdx = isComparing ? selectedIdx : (hoveredIdx !== null ? hoveredIdx : selectedIdx);
  const compareIdx = isComparing ? hoveredIdx : null;
  
  const [showAxes, setShowAxes] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const a = params.get('axes');
    return a ? a === 'true' : true;
  });
  const [showTethers, setShowTethers] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('tethers');
    return t ? t === 'true' : true;
  });
  const [userWantsAutoRotate, setUserWantsAutoRotate] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get('rotate');
    return r ? r === 'true' : true;
  });
  const [autoRotate, setAutoRotate] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get('rotate');
    return r ? r === 'true' : true;
  });
  const [hoveredNeighbors, setHoveredNeighbors] = useState<{ name: string; score: number }[]>([]);
  
  const [zoom, setZoom] = useState<number>(() => {
    const params = new URLSearchParams(window.location.search);
    const z = params.get('zoom');
    return z ? parseFloat(z) : 7.0;
  });
  
  const [axisTasteX, setAxisTasteX] = useState<number>(() => {
    const params = new URLSearchParams(window.location.search);
    const x = params.get('x');
    return x ? parseInt(x, 10) : -1;
  });
  const [axisTasteY, setAxisTasteY] = useState<number>(() => {
    const params = new URLSearchParams(window.location.search);
    const y = params.get('y');
    return y ? parseInt(y, 10) : -1;
  });
  const [axisTasteZ, setAxisTasteZ] = useState<number>(() => {
    const params = new URLSearchParams(window.location.search);
    const z = params.get('z');
    return z ? parseInt(z, 10) : -1;
  });

  const currentCoordsRef = useRef<{ x: number; y: number; z: number }[]>([]);
  const animationRef = useRef<number | null>(null);
  const cosmicDust = useMemo(() => generateCosmicDust(60), []);
  const umapCenterOffset = useMemo(() => calculateUmapCenterOffset(ingredients), [ingredients]);
  const tasteMeans = useMemo(() => calculateTasteMeans(ingredients), [ingredients]);

  const pointCloud = useMemo(() => generatePointCloud(ingredients, umapCenterOffset), [ingredients, umapCenterOffset]);
  const [randomHighlights, setRandomHighlights] = useState<number[]>([]);

  // Synchronize URL parameters with visualizer state
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('x', axisTasteX.toString());
    params.set('y', axisTasteY.toString());
    params.set('z', axisTasteZ.toString());
    params.set('zoom', zoom.toFixed(2));
    params.set('axes', showAxes.toString());
    params.set('tethers', showTethers.toString());
    params.set('rotate', userWantsAutoRotate.toString());
    if (selectedIdx !== null) {
      params.set('selected', selectedIdx.toString());
    } else {
      params.delete('selected');
    }
    const newRelativePathQuery = window.location.pathname + '?' + params.toString();
    window.history.replaceState(null, '', newRelativePathQuery);
  }, [axisTasteX, axisTasteY, axisTasteZ, zoom, selectedIdx, showAxes, showTethers, userWantsAutoRotate]);

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

  useEffect(() => {
    fetch('./ingredients.json')
      .then((res) => res.json())
      .then((data: Ingredient[]) => setIngredients(data))
      .catch(() => setError('Failed to load ingredient metadata'));
  }, []);

  useEffect(() => {
    if (!autoRotate || pointCloud.length === 0) {
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
  }, [autoRotate, pointCloud.length]);

  useEffect(() => {
    if (primaryIdx === null || pointCloud.length === 0) {
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
  }, [primaryIdx, pointCloud]);

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
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      frame++;
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
        projectionParams, zoom, showAxes, axisTasteX, axisTasteY, axisTasteZ,
        showTethers, primaryIdx, isComparing, selectedIdx, hoveredIdx, frame,
        randomHighlights
      });
      animationRef.current = requestAnimationFrame(render);
    };
    render();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [pointCloud, hoveredIdx, selectedIdx, showAxes, showTethers, autoRotate, zoom, axisTasteX, axisTasteY, axisTasteZ, tasteMeans, cosmicDust, randomHighlights]);

  // Calculate match percentage between primaryIdx and compareIdx using pointCloud
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

  return (
    <main className="visualizer-container">
      <HeaderHUD />
      {error && (
        <div className="glass-panel" style={{ position: 'absolute', top: '32px', left: '50%', transform: 'translateX(-50%)', zIndex: 100, padding: '16px 24px', color: 'var(--color-sweet)', border: '1px solid rgba(224, 122, 95, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.9)', fontSize: '11px', fontWeight: 600 }}>
          <strong>System Error:</strong> {error}
        </div>
      )}
      <div className="viewport-container">
        <canvas ref={canvasRef} className="viewport-canvas" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} />
      </div>
      {primaryIdx !== null && ingredients[primaryIdx] && (
        <SensoryCardHUD
          ingredient={ingredients[primaryIdx]}
          compareIngredient={compareIdx !== null ? ingredients[compareIdx] : undefined}
          hoveredNeighbors={hoveredNeighbors}
          matchPercentage={matchPercentage}
          clickHasHappened={selectedIdx !== null}
        />
      )}
      <LegendHUD />
      <ControlsHUD axisTasteX={axisTasteX} setAxisTasteX={setAxisTasteX} axisTasteY={axisTasteY} setAxisTasteY={setAxisTasteY} axisTasteZ={axisTasteZ} setAxisTasteZ={setAxisTasteZ} showAxes={showAxes} setShowAxes={setShowAxes} showTethers={showTethers} setShowTethers={setShowTethers} userWantsAutoRotate={userWantsAutoRotate} setUserWantsAutoRotate={setUserWantsAutoRotate} setAutoRotate={setAutoRotate} inactivityTimerRef={inactivityTimerRef} zoom={zoom} setZoom={setZoom} handleResetAngles={handleResetAngles} resetInactivityTimer={resetInactivityTimer} />
    </main>
  );
}
