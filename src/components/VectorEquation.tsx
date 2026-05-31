import React from 'react';
import { Ingredient } from '../types';

interface VectorEquationProps {
  positives: number[];
  negatives: number[];
  ingredients: Ingredient[];
  customName: string;
  onNameChange: (newName: string) => void;
  onNameBlur: () => void;
}

export const VectorEquation: React.FC<VectorEquationProps> = ({
  positives,
  negatives,
  ingredients,
  customName,
  onNameChange,
  onNameBlur
}) => {
  return (
    <div className="vector-equation-panel" style={{ marginTop: '4px' }}>
      <div className="vector-equation-wrapper" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', rowGap: '12px' }}>
        <input
          type="text"
          value={customName}
          onChange={(e) => onNameChange(e.target.value)}
          onBlur={onNameBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onNameBlur();
              e.currentTarget.blur();
            }
          }}
          className="vector-equation-name-input"
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: '1.5px dashed rgba(72, 127, 101, 0.4)',
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: '18.5px',
            fontWeight: 700,
            fontStyle: 'italic',
            color: 'var(--color-sweet)',
            padding: '2px 4px',
            width: '190px',
            outline: 'none',
            transition: 'all 0.2s ease',
          }}
          placeholder="Name your recipe..."
          title="Click to rename this alchemical synthesis"
        />

        <span className="equation-symbol" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-secondary)' }}>＝</span>

        {positives.length === 0 && negatives.length === 0 ? (
          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '13.5px' }}>
            [Empty Formulation Board]
          </span>
        ) : (
          <>
            {positives.map((idx, index) => {
              const ing = ingredients[idx];
              if (!ing) return null;
              return (
                <React.Fragment key={`pos-${idx}`}>
                  {index > 0 && <span className="equation-symbol" style={{ fontSize: '11px' }}>＋</span>}
                  <span className="vector-equation-chip pos">
                    {ing.name}
                  </span>
                </React.Fragment>
              );
            })}

            {negatives.map((idx) => {
              const ing = ingredients[idx];
              if (!ing) return null;
              return (
                <React.Fragment key={`neg-${idx}`}>
                  <span className="equation-symbol" style={{ fontSize: '11px' }}>－</span>
                  <span className="vector-equation-chip neg">
                    {ing.name}
                  </span>
                </React.Fragment>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};
