import React from 'react';
import { TASTE_NAMES, TASTE_COLORS } from '../constants';

interface SensorySignatureProps {
  sensory: number[];
  isEmpty: boolean;
}

export const SensorySignature: React.FC<SensorySignatureProps> = ({ sensory, isEmpty }) => {
  return (
    <div className="search-card glass-panel sensory-signature-panel">
      <h2 className="search-card-title sensory-signature-title">
        Projected Sensory Signature
      </h2>
      {isEmpty ? (
        <p className="sensory-signature-placeholder">
          Synthesize a custom vector equation above to view projected sensory metrics.
        </p>
      ) : (
        <div className="sensory-grid" style={{ gridTemplateColumns: '1fr', gap: '10px' }}>
          {TASTE_NAMES.map((name, i) => {
            const val = sensory[i] || 0;
            return (
              <div key={name} className="sensory-item" style={{ gap: '2px' }}>
                <div className="sensory-label-row">
                  <span style={{ fontSize: '11.5px' }}>{name}</span>
                  <span style={{ fontSize: '11.5px', fontWeight: 700 }}>{(val * 100).toFixed(0)}%</span>
                </div>
                <div className="sensory-bar-track" style={{ height: '4px' }}>
                  <div
                    className="sensory-bar-fill"
                    style={{
                      width: `${val * 100}%`,
                      backgroundColor: TASTE_COLORS[i] || '#6366f1',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
