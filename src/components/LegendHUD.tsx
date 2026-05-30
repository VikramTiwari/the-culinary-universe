import React from 'react';
import { TASTE_NAMES, TASTE_COLORS } from '../constants';

export const LegendHUD: React.FC = () => {
  return (
    <div className="hud-legend glass-panel backdrop-blur-md">
      <span className="hud-legend-title">Taste Notes</span>
      <div className="hud-legend-list">
        {TASTE_NAMES.map((name, i) => (
          <div key={name} className="hud-legend-item">
            <div
              className="hud-legend-dot"
              style={{ backgroundColor: TASTE_COLORS[i] }}
            />
            <span className="hud-legend-label">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
