import React from 'react';
import { TASTE_NAMES } from '../constants';

const AXIS_X_OPTIONS = [
  { value: -1, label: 'Sweet' },
  ...TASTE_NAMES.map((name, i) => ({ value: i, label: name })).filter(opt => opt.value !== 0)
];

const AXIS_Y_OPTIONS = [
  { value: -1, label: 'Spicy' },
  ...TASTE_NAMES.map((name, i) => ({ value: i, label: name })).filter(opt => opt.value !== 5)
];

const AXIS_Z_OPTIONS = [
  { value: -1, label: 'Salty' },
  ...TASTE_NAMES.map((name, i) => ({ value: i, label: name })).filter(opt => opt.value !== 2)
];

interface AxisSelectorProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  resetInactivityTimer: () => void;
  options: { value: number; label: string }[];
}

const AxisSelector: React.FC<AxisSelectorProps> = ({
  label,
  value,
  onChange,
  resetInactivityTimer,
  options
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        fontSize: '14.5px',
        color: 'var(--text-secondary)'
      }}
    >
      <span>{label}</span>
      <select
        value={value}
        onChange={(e) => {
          onChange(Number(e.target.value));
          resetInactivityTimer();
        }}
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-glass)',
          borderRadius: '4px',
          padding: '3px 6px',
          fontSize: '14px',
          fontFamily: 'Outfit',
          color: 'var(--text-primary)',
          outline: 'none'
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

interface ControlsHUDProps {
  axisTasteX: number;
  setAxisTasteX: (val: number) => void;
  axisTasteY: number;
  setAxisTasteY: (val: number) => void;
  axisTasteZ: number;
  setAxisTasteZ: (val: number) => void;

  showAxes: boolean;
  setShowAxes: (val: boolean) => void;
  showTethers: boolean;
  setShowTethers: (val: boolean) => void;

  userWantsAutoRotate: boolean;
  setUserWantsAutoRotate: (val: boolean) => void;
  setAutoRotate: (val: boolean) => void;
  inactivityTimerRef: React.MutableRefObject<number | null>;

  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;

  handleResetAngles: () => void;
  resetInactivityTimer: () => void;
}

export const ControlsHUD: React.FC<ControlsHUDProps> = ({
  axisTasteX,
  setAxisTasteX,
  axisTasteY,
  setAxisTasteY,
  axisTasteZ,
  setAxisTasteZ,
  showAxes,
  setShowAxes,
  showTethers,
  setShowTethers,
  userWantsAutoRotate,
  setUserWantsAutoRotate,
  setAutoRotate,
  inactivityTimerRef,
  zoom,
  setZoom,
  handleResetAngles,
  resetInactivityTimer
}) => {
  return (
    <div className="hud-deck select-none">
      {/* Floating Settings Tool panel */}
      <div
        className="hud-controls-panel glass-panel backdrop-blur-md shadow-2xl"
        style={{ minWidth: '240px' }}
      >
        <div className="hud-controls-title">Flavor Map Modes</div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            marginBottom: '8px'
          }}
        >
          <AxisSelector
            label="Left/Right"
            value={axisTasteX}
            onChange={setAxisTasteX}
            resetInactivityTimer={resetInactivityTimer}
            options={AXIS_X_OPTIONS}
          />
          <AxisSelector
            label="Up/Down"
            value={axisTasteY}
            onChange={setAxisTasteY}
            resetInactivityTimer={resetInactivityTimer}
            options={AXIS_Y_OPTIONS}
          />
          <AxisSelector
            label="Forward/Backward"
            value={axisTasteZ}
            onChange={setAxisTasteZ}
            resetInactivityTimer={resetInactivityTimer}
            options={AXIS_Z_OPTIONS}
          />
        </div>

        <div
          className="hud-controls-title"
          style={{
            borderTop: '1px solid rgba(96, 108, 56, 0.08)',
            paddingTop: '6px',
            marginTop: '4px'
          }}
        >
          Display Controls
        </div>

        <button
          onClick={() => {
            setShowAxes(!showAxes);
            resetInactivityTimer();
          }}
          className={`hud-btn ${showAxes ? 'hud-btn-active' : ''}`}
        >
          <span className="hud-btn-label">
            Show Grid Lines
          </span>
          <span className="hud-btn-state">{showAxes ? 'ON' : 'OFF'}</span>
        </button>

        <button
          onClick={() => {
            setShowTethers(!showTethers);
            resetInactivityTimer();
          }}
          className={`hud-btn ${showTethers ? 'hud-btn-active' : ''}`}
        >
          <span className="hud-btn-label">
            Show Pairing Connectors
          </span>
          <span className="hud-btn-state">{showTethers ? 'ON' : 'OFF'}</span>
        </button>

        <button
          onClick={() => {
            const nextVal = !userWantsAutoRotate;
            setUserWantsAutoRotate(nextVal);
            setAutoRotate(nextVal);
            if (!nextVal && inactivityTimerRef.current) {
              window.clearTimeout(inactivityTimerRef.current);
            }
          }}
          className={`hud-btn ${userWantsAutoRotate ? 'hud-btn-active' : ''}`}
        >
          <span className="hud-btn-label">
            Slow Rotation Effect
          </span>
          <span className="hud-btn-state">{userWantsAutoRotate ? 'ON' : 'OFF'}</span>
        </button>

        <div
          className="hud-controls-title"
          style={{
            borderTop: '1px solid rgba(96, 108, 56, 0.08)',
            paddingTop: '6px',
            marginTop: '4px'
          }}
        >
          Map View Scale (Zoom: {zoom.toFixed(1)}x)
        </div>

        <div
          style={{
            display: 'flex',
            gap: '6px',
            width: '100%',
            marginBottom: '4px'
          }}
        >
          <button
            onClick={() => {
              setZoom((z) => Math.min(z + 0.15, 20.0));
              resetInactivityTimer();
            }}
            className="hud-btn"
            style={{ flex: 1, justifyContent: 'center', padding: '6px' }}
          >
            Zoom In
          </button>
          <button
            onClick={() => {
              setZoom((z) => Math.max(z - 0.15, 0.4));
              resetInactivityTimer();
            }}
            className="hud-btn"
            style={{ flex: 1, justifyContent: 'center', padding: '6px' }}
          >
            Zoom Out
          </button>
        </div>

        <button onClick={handleResetAngles} className="hud-btn hud-btn-action">
          Reset Map Perspective
        </button>
      </div>
    </div>
  );
};
