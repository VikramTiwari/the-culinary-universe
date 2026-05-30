import React from 'react';
import { Ingredient } from '../types';
import { TASTE_NAMES, TASTE_COLORS } from '../constants';

interface SensoryCardHUDProps {
  ingredient: Ingredient;
  compareIngredient?: Ingredient;
  hoveredNeighbors: { name: string; score: number }[];
  matchPercentage?: number;
  clickHasHappened: boolean;
}

export const SensoryCardHUD: React.FC<SensoryCardHUDProps> = ({
  ingredient,
  compareIngredient,
  hoveredNeighbors,
  matchPercentage,
  clickHasHappened
}) => {
  return (
    <div className="hud-card glass-panel animate-fade-in">
      <div className="hud-card-title-row">
        <div>
          {clickHasHappened ? (
            compareIngredient ? (
              <>
                <span className="hud-card-title-label" style={{ color: '#be4b34', fontWeight: 700 }}>
                  Pairing Matcher
                </span>
                <h2
                  className="hud-card-title"
                  style={{
                    fontSize: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '4px',
                    lineHeight: '1.4',
                    marginTop: '4px'
                  }}
                >
                  <span
                    style={{
                      borderBottom: '2px solid var(--text-primary)',
                      paddingBottom: '2px',
                      fontWeight: 700
                    }}
                  >
                    {ingredient.name}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      fontWeight: 400,
                      margin: '0 2px'
                    }}
                  >
                    vs
                  </span>
                  <span
                    style={{
                      color: '#be4b34',
                      borderBottom: '2px dashed #be4b34',
                      paddingBottom: '2px',
                      fontWeight: 700
                    }}
                  >
                    {compareIngredient.name}
                  </span>
                </h2>
              </>
            ) : (
              <>
                <span className="hud-card-title-label" style={{ color: 'var(--color-herbal)', fontWeight: 700 }}>
                  Pairing Panel
                </span>
                <h2 className="hud-card-title">{ingredient.name}</h2>
              </>
            )
          ) : (
            <>
              <span className="hud-card-title-label">Ingredient Profile</span>
              <h2 className="hud-card-title">{ingredient.name}</h2>
            </>
          )}
        </div>
      </div>

      <div className="hud-card-section">
        <div className="sensory-grid">
          {TASTE_NAMES.map((name, i) => {
            const valX = ingredient.sensory[i] || 0;
            const valY = compareIngredient ? compareIngredient.sensory[i] || 0 : 0;

            return (
              <div key={name} className="sensory-item">
                <div className="sensory-label-row">
                  <span>{name}</span>
                  {compareIngredient ? (
                    <span style={{ fontSize: '11.5px', fontWeight: 500 }}>
                      <span style={{ color: 'var(--text-primary)' }}>
                        {(valX * 100).toFixed(0)}%
                      </span>
                      <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>
                        vs
                      </span>
                      <span style={{ color: '#be4b34', fontWeight: 600 }}>
                        {(valY * 100).toFixed(0)}%
                      </span>
                    </span>
                  ) : (
                    <span>{(valX * 100).toFixed(0)}%</span>
                  )}
                </div>

                {compareIngredient ? (
                  <div
                    className="sensory-bar-track"
                    style={{
                      height: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      justifyContent: 'center',
                      padding: '2px'
                    }}
                  >
                    {/* Selected Ingredient Bar */}
                    <div
                      style={{
                        height: '3px',
                        width: `${valX * 100}%`,
                        backgroundColor: TASTE_COLORS[i] || '#6366f1',
                        borderRadius: '1.5px',
                        transition: 'width 0.2s ease-out'
                      }}
                    />
                    {/* Hovered Compare Ingredient Bar */}
                    <div
                      style={{
                        height: '3px',
                        width: `${valY * 100}%`,
                        backgroundColor: '#be4b34',
                        opacity: 0.65,
                        borderRadius: '1.5px',
                        transition: 'width 0.2s ease-out'
                      }}
                    />
                  </div>
                ) : (
                  <div className="sensory-bar-track">
                    <div
                      className="sensory-bar-fill"
                      style={{
                        width: `${valX * 100}%`,
                        backgroundColor: TASTE_COLORS[i],
                        transition: 'width 0.2s ease-out'
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {compareIngredient && matchPercentage !== undefined ? (
        <div className="hud-neighbors-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '6px 0 2px 0' }}>
          <span className="hud-neighbors-title" style={{ textAlign: 'center', width: '100%', marginBottom: '4px' }}>
            Culinary similarity score
          </span>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-glass)',
            borderRadius: '8px',
            padding: '12px 14px',
            width: '100%',
            textAlign: 'center',
            gap: '4px',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '34px',
              fontWeight: 800,
              color: matchPercentage >= 75 ? 'var(--color-herbal)' : (matchPercentage >= 55 ? 'var(--color-sour)' : '#be4b34'),
              lineHeight: '1',
              display: 'flex',
              alignItems: 'baseline',
              gap: '1px'
            }}>
              {matchPercentage.toFixed(0)}<span style={{ fontSize: '16px', fontWeight: 600 }}>%</span>
            </div>
            <div style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontStyle: 'italic',
              fontSize: '14.5px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginTop: '2px'
            }}>
              {matchPercentage >= 85 ? 'Sublime Pair (Highly Recommended)' :
                matchPercentage >= 70 ? 'Harmonious Match (Great Fit)' :
                  matchPercentage >= 50 ? 'Complementary (Interesting Nuances)' :
                    'Contrast Pairing (Challenging Blend)'}
            </div>
            <div style={{
              fontSize: '11px',
              color: 'var(--text-secondary)',
              marginTop: '4px',
              lineHeight: '1.4'
            }}>
              Blending notes of <strong>{ingredient.name}</strong> and <strong>{compareIngredient.name}</strong>.
            </div>
          </div>
        </div>
      ) : (
        hoveredNeighbors.length > 0 && (
          <div className="hud-neighbors-section">
            <span className="hud-neighbors-title">
              Culinary similarity
            </span>
            <div className="hud-neighbors-list">
              {hoveredNeighbors.map((n, idx) => (
                <div key={idx} className="hud-neighbors-item">
                  <span>
                    {idx + 1}. {n.name}
                  </span>
                  <span>{Math.max(0, 100 - n.score * 0.15).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
};
