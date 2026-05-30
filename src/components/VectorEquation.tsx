import React from 'react';
import { Ingredient } from '../types';

interface VectorEquationProps {
  positives: number[];
  negatives: number[];
  ingredients: Ingredient[];
}

export const VectorEquation: React.FC<VectorEquationProps> = ({ positives, negatives, ingredients }) => {
  return (
    <div className="vector-equation-panel">
      <span className="vector-equation-label">🧮 Equation:</span>
      {positives.length === 0 && negatives.length === 0 ? (
        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '13px' }}>
          [Empty Flavor Space]
        </span>
      ) : (
        <div className="vector-equation-wrapper">
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
          <span className="equation-symbol" style={{ fontSize: '11px' }}>＝</span>
          <span className="vector-equation-result">
            Custom Profile Vector
          </span>
        </div>
      )}
    </div>
  );
};
