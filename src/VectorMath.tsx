import { HeaderHUD } from './components/HeaderHUD';
import { LegendHUD } from './components/LegendHUD';
import { SensoryCardHUD } from './components/SensoryCardHUD';
import { ControlsHUD } from './components/ControlsHUD';
import { FormulationBoard } from './components/FormulationBoard';
import { SensorySignature } from './components/SensorySignature';
import { useVectorMathState } from './hooks/useVectorMathState';

interface VectorMathProps {
  alchemyActive?: boolean;
}

export default function VectorMath({ alchemyActive = false }: VectorMathProps) {
  const {
    ingredients,
    error,
    primaryIdx,
    compareIdx,
    showAxes,
    setShowAxes,
    showTethers,
    setShowTethers,
    userWantsAutoRotate,
    setUserWantsAutoRotate,
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
    synthesizedSensory,
    matchPercentage,
    canvasRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleResetAngles,
    resetInactivityTimer,
    inactivityTimerRef
  } = useVectorMathState(alchemyActive);

  return (
    <main className="visualizer-container" id="alchemy-lab-container">
      {!alchemyActive && <HeaderHUD />}
      {error && (
        <div className="glass-panel animate-fade-in" style={{ position: 'absolute', top: '32px', left: '50%', transform: 'translateX(-50%)', zIndex: 100, padding: '16px 24px', color: 'var(--color-sweet)', border: '1px solid rgba(224, 122, 95, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.9)', fontSize: '11px', fontWeight: 600 }}>
          <strong>System Error:</strong> {error}
        </div>
      )}
      
      {/* Background Alchemical Color Nebulae & Horizon Data Console Shelf */}
      {alchemyActive && (
        <SensorySignature
          sensory={synthesizedSensory}
          isEmpty={positives.length === 0 && negatives.length === 0}
        />
      )}
      
      <div className="viewport-container" style={{ zIndex: 1 }}>
        <canvas
          ref={canvasRef}
          className="viewport-canvas"
          id="viewport-canvas-element"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          aria-label="3D Culinary Constellation Map"
        />
      </div>

      {/* Standard Map HUD overlays (Only when alchemy workbench is inactive) */}
      {!alchemyActive && primaryIdx !== null && ingredients[primaryIdx] && (
        <SensoryCardHUD
          ingredient={ingredients[primaryIdx]}
          compareIngredient={compareIdx !== null ? ingredients[compareIdx] : undefined}
          hoveredNeighbors={hoveredNeighbors}
          matchPercentage={matchPercentage}
          clickHasHappened={primaryIdx !== null}
        />
      )}
      {!alchemyActive && <LegendHUD />}
      {!alchemyActive && (
        <ControlsHUD
          axisTasteX={axisTasteX}
          setAxisTasteX={setAxisTasteX}
          axisTasteY={axisTasteY}
          setAxisTasteY={setAxisTasteY}
          axisTasteZ={axisTasteZ}
          setAxisTasteZ={setAxisTasteZ}
          showAxes={showAxes}
          setShowAxes={setShowAxes}
          showTethers={showTethers}
          setShowTethers={setShowTethers}
          userWantsAutoRotate={userWantsAutoRotate}
          setUserWantsAutoRotate={setUserWantsAutoRotate}
          setAutoRotate={setAutoRotate}
          inactivityTimerRef={inactivityTimerRef}
          zoom={zoom}
          setZoom={setZoom}
          handleResetAngles={handleResetAngles}
          resetInactivityTimer={resetInactivityTimer}
        />
      )}

      {/* Immersive Alchemy Workstation overlays */}
      {alchemyActive && (
        <>
          {/* Top Floating Alchemical Equation Header Banner */}
          <div style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            zIndex: 10,
            pointerEvents: 'auto'
          }} id="alchemy-header-hud">
            <FormulationBoard
              positives={positives}
              negatives={negatives}
              ingredients={ingredients}
              onAddPositive={(idx) => setPositives((prev) => [...prev, idx])}
              onRemovePositive={(idx) => setPositives((prev) => prev.filter((p) => p !== idx))}
              onAddNegative={(idx) => setNegatives((prev) => [...prev, idx])}
              onRemoveNegative={(idx) => setNegatives((prev) => prev.filter((n) => n !== idx))}
              workerState={workerState}
              workerError={workerError}
              customName={customName}
              setCustomName={setCustomName}
              setIsNameEdited={setIsNameEdited}
              onNameBlur={() => setUrlName(customName)}
            />
          </div>

        </>
      )}
    </main>
  );
}
