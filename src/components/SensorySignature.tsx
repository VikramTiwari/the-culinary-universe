import React from 'react';
import { TASTE_NAMES, TASTE_COLORS } from '../constants';

interface SensorySignatureProps {
  sensory: number[];
  isEmpty: boolean;
}

export const SensorySignature: React.FC<SensorySignatureProps> = ({ sensory, isEmpty }) => {
  return (
    <div style={{
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: '42px',
      background: 'rgba(237, 233, 223, 0.72)', // Richer translucent linen plaster to maintain absolute text contrast
      backdropFilter: 'blur(16px) saturate(140%)',
      borderTop: '1px solid rgba(96, 108, 56, 0.15)', // Soft Sage Olive hairline
      display: 'grid',
      gridTemplateColumns: 'repeat(10, 1fr)',
      alignItems: 'center',
      padding: '0 32px',
      boxSizing: 'border-box',
      zIndex: 10, // Sits proudly on top of the viewport canvas for flawless interaction
      pointerEvents: 'auto',
      userSelect: 'none'
    }}>
      {TASTE_NAMES.map((name, i) => {
        const rawVal = isEmpty ? 0 : (sensory[i] || 0);
        const val = Math.max(0, Math.min(1, rawVal));
        const color = TASTE_COLORS[i] || '#6366f1';
        const percent = (val * 100).toFixed(0);

        return (
          <div 
            key={`label-${name}`} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '6px',
              opacity: val > 0 ? 1 : 0.4,
              transition: 'opacity 0.4s ease'
            }}
          >
            {/* Glowing Taste Accent Indicator Dot */}
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: color,
              opacity: val > 0 ? 0.9 : 0.2,
              transition: 'opacity 0.4s ease',
              boxShadow: val > 0 ? `0 0 6px ${color}` : 'none'
            }} />
            
            <span style={{
              fontSize: '9.5px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: val > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
              fontFamily: '"Outfit", sans-serif',
              transition: 'color 0.4s ease'
            }}>
              {name.replace('/Rich', '')}
            </span>
            
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              color: val > 0 ? color : 'var(--text-muted)',
              fontFamily: '"Outfit", sans-serif',
              transition: 'color 0.4s ease'
            }}>
              {percent}%
            </span>
          </div>
        );
      })}
    </div>
  );
};
