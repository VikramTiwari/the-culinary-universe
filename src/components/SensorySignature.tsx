import React from 'react';
import { TASTE_NAMES, TASTE_COLORS } from '../constants';

interface SensorySignatureProps {
  sensory: number[];
  isEmpty: boolean;
}

// Organic screen positions for each of the 10 taste dimensions in the background
const NEBULA_COORDS = [
  { left: '5%', top: '25%' },       // 0: Sweet
  { right: '8%', top: '15%' },      // 1: Sour
  { right: '12%', bottom: '25%' },   // 2: Salty
  { left: '42%', top: '40%' },      // 3: Bitter
  { left: '10%', bottom: '20%' },    // 4: Umami
  { right: '5%', bottom: '15%' },    // 5: Spicy
  { left: '15%', top: '12%' },      // 6: Herbal
  { left: '45%', top: '15%' },      // 7: Citrusy
  { left: '40%', bottom: '15%' },    // 8: Smoky
  { right: '25%', top: '35%' }       // 9: Fatty/Rich
];

export const SensorySignature: React.FC<SensorySignatureProps> = ({ sensory, isEmpty }) => {
  return (
    <>
      {/* 1. Giant Background Alchemical Color Nebulae Container */}
      <div style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        zIndex: 0,
        pointerEvents: 'none', // Not interactable, purely visual background washes
        overflow: 'hidden',
        width: '100vw',
        height: '100vh',
        userSelect: 'none'
      }}>
        {TASTE_NAMES.map((name, i) => {
          // Dynamic watercolor wash: 0 when empty or inactive, blooming elegantly when active flavor notes are present!
          const rawVal = isEmpty ? 0 : (sensory[i] || 0);
          const val = Math.max(0, Math.min(1, rawVal));
          const color = TASTE_COLORS[i] || '#6366f1';
          const coords = NEBULA_COORDS[i] || { left: '50%', top: '50%' };
          
          // Calculate size: 0 when inactive, scales from 35vw up to 80vw when active to cover the page beautifully
          const size = val === 0 ? 0 : (35 + val * 45); 
          // Calculate opacity: 0 when inactive, scales from 0.12 up to a rich 0.50 when active for stunning contrast
          const opacity = val === 0 ? 0 : (0.12 + val * 0.38);
          
          // Assign dynamic slow-drifting animations based on index for organic liquid blending
          const driftClass = `nebula-drift-${(i % 3) + 1}`;

          return (
            <div
              key={`nebula-${name}`}
              className={driftClass}
              style={{
                position: 'absolute',
                width: `${size}vw`,
                height: `${size}vw`,
                borderRadius: '50%',
                background: color,
                filter: 'blur(90px)',
                opacity: opacity,
                transition: 'width 1.4s cubic-bezier(0.16, 1, 0.3, 1), height 1.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 1.4s ease',
                pointerEvents: 'none',
                ...coords
              }}
            />
          );
        })}
      </div>

      {/* 2. Sleek, Minimal Horizon Data Console Shelf (At the absolute bottom of the screen) */}
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
    </>
  );
};
