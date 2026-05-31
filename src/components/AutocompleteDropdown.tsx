import React from 'react';
import { TASTE_NAMES, TASTE_COLORS } from '../constants';

interface SuggestionItem {
  originalIndex: number;
  name: string;
  sensory: number[];
}

interface AutocompleteDropdownProps {
  suggestions: SuggestionItem[];
  activeIndex: number;
  onSelect: (originalIndex: number) => void;
  onHoverItem: (index: number) => void;
}

const getDominantTastes = (sensory: number[]) => {
  return sensory
    .map((val, idx) => ({ name: TASTE_NAMES[idx], color: TASTE_COLORS[idx], val }))
    .filter((t) => t.val > 0.3)
    .sort((a, b) => b.val - a.val)
    .slice(0, 2);
};

export const AutocompleteDropdown: React.FC<AutocompleteDropdownProps> = ({
  suggestions,
  activeIndex,
  onSelect,
  onHoverItem,
}) => {
  return (
    <div
      className="autocomplete-dropdown"
      style={{
        borderRadius: '8px',
        width: '220px',
        position: 'absolute',
        top: '100%',
        left: 0,
        zIndex: 100,
        marginTop: '4px',
      }}
    >
      {suggestions.map((item, index) => {
        const dominant = getDominantTastes(item.sensory)[0];
        return (
          <div
            key={item.originalIndex}
            className={`autocomplete-item ${index === activeIndex ? 'active' : ''}`}
            style={{
              padding: '7px 10px',
              fontSize: '15px',
              background: index === activeIndex ? 'rgba(96, 108, 56, 0.08)' : 'transparent',
            }}
            onClick={() => onSelect(item.originalIndex)}
            onMouseEnter={() => onHoverItem(index)}
          >
            <span>{item.name}</span>
            {dominant && <span className="autocomplete-item-taste">{dominant.name}</span>}
          </div>
        );
      })}
    </div>
  );
};
