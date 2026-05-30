import React from 'react';
import { Ingredient } from '../types';
import { TASTE_NAMES, TASTE_COLORS } from '../constants';

interface VectorMatchItemProps {
  rank: number;
  score: number;
  ingredient: Ingredient;
  index: number;
  onTeleport: (index: number) => void;
}

export const VectorMatchItem: React.FC<VectorMatchItemProps> = ({
  rank,
  score,
  ingredient,
  index,
  onTeleport
}) => {
  const synergyScore = Math.max(0, score * 100);
  
  // Find dominant taste labels for results
  const dominant = ingredient.sensory
    .map((val, idx) => ({ name: TASTE_NAMES[idx], color: TASTE_COLORS[idx], val }))
    .filter((t) => t.val > 0.3)
    .sort((a, b) => b.val - a.val)
    .slice(0, 2);

  return (
    <div className="vector-match-card">
      {/* Left: Rank, Name, Sensory tags */}
      <div className="vector-match-left">
        <span className="vector-match-rank">
          #{rank}
        </span>
        <div>
          <h3 className="vector-match-title">
            {ingredient.name}
          </h3>
          <div className="vector-match-tags">
            {dominant.map((d) => (
              <span
                key={d.name}
                className="taste-tag"
                style={{
                  background: `rgba(${parseInt(d.color.slice(1, 3), 16)}, ${parseInt(d.color.slice(3, 5), 16)}, ${parseInt(d.color.slice(5, 7), 16)}, 0.06)`,
                  color: d.color,
                  borderColor: `rgba(${parseInt(d.color.slice(1, 3), 16)}, ${parseInt(d.color.slice(3, 5), 16)}, ${parseInt(d.color.slice(5, 7), 16)}, 0.12)`,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                }}
              >
                {d.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Cosine similarity score & Telemetry navigation */}
      <div className="vector-match-right">
        <span
          className="similarity-badge"
          style={{
            color: synergyScore >= 80 ? 'var(--color-herbal)' : (synergyScore >= 55 ? 'var(--color-sour)' : '#be4b34'),
          }}
        >
          {synergyScore.toFixed(1)}<span style={{ fontSize: '11px', fontWeight: 500, marginLeft: '1px' }}>% match</span>
        </span>

        <button
          className="btn-teleport"
          onClick={() => onTeleport(index)}
        >
          🌌 Teleport Focus
        </button>
      </div>
    </div>
  );
};
