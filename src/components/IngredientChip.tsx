import React from 'react';

interface IngredientChipProps {
  name: string;
  onRemove: () => void;
  type: 'positive' | 'negative';
}

export const IngredientChip: React.FC<IngredientChipProps> = ({ name, onRemove, type }) => {
  return (
    <span
      className={`ingredient-chip ${type}`}
      style={{ padding: '3px 9px', fontSize: '12.5px', gap: '4px' }}
    >
      {name}
      <button className="chip-remove-btn" onClick={onRemove}>
        ×
      </button>
    </span>
  );
};
