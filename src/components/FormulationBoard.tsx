import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Ingredient } from '../types';
import { TASTE_NAMES, TASTE_COLORS } from '../constants';
import { VectorEquation } from './VectorEquation';

interface FormulationBoardProps {
  positives: number[];
  negatives: number[];
  ingredients: Ingredient[];
  onAddPositive: (idx: number) => void;
  onRemovePositive: (idx: number) => void;
  onAddNegative: (idx: number) => void;
  onRemoveNegative: (idx: number) => void;
  workerState: 'idle' | 'loading' | 'ready' | 'error';
  workerError: string | null;
}

export const FormulationBoard: React.FC<FormulationBoardProps> = ({
  positives, negatives, ingredients,
  onAddPositive, onRemovePositive, onAddNegative, onRemoveNegative,
  workerState, workerError,
}) => {
  const [posInput, setPosInput] = useState('');
  const [negInput, setNegInput] = useState('');
  const [showPosDropdown, setShowPosDropdown] = useState(false);
  const [showNegDropdown, setShowNegDropdown] = useState(false);
  const [posActiveIndex, setPosActiveIndex] = useState(0);
  const [negActiveIndex, setNegActiveIndex] = useState(0);

  const posInputRef = useRef<HTMLInputElement>(null);
  const negInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (posInputRef.current && !posInputRef.current.contains(e.target as Node)) setShowPosDropdown(false);
      if (negInputRef.current && !negInputRef.current.contains(e.target as Node)) setShowNegDropdown(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const getFilteredSuggestions = (input: string, excluded: number[]) => {
    if (!input.trim()) return [];
    const query = input.toLowerCase();
    return ingredients
      .map((ing, originalIndex) => ({ ...ing, originalIndex }))
      .filter((ing) => ing.name.toLowerCase().includes(query) && !excluded.includes(ing.originalIndex))
      .slice(0, 6);
  };

  const filteredPosSuggestions = useMemo(
    () => getFilteredSuggestions(posInput, [...positives, ...negatives]),
    [posInput, ingredients, positives, negatives]
  );

  const filteredNegSuggestions = useMemo(
    () => getFilteredSuggestions(negInput, [...positives, ...negatives]),
    [negInput, ingredients, positives, negatives]
  );

  const handleDropdownKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    suggestions: any[],
    activeIndex: number,
    setActiveIndex: React.Dispatch<React.SetStateAction<number>>,
    onAdd: (idx: number) => void,
    setInput: React.Dispatch<React.SetStateAction<string>>,
    setShowDropdown: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      onAdd(suggestions[activeIndex].originalIndex);
      setInput('');
      setShowDropdown(false);
      setActiveIndex(0);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const getDominantTastes = (sensory: number[]) => {
    return sensory
      .map((val, idx) => ({ name: TASTE_NAMES[idx], color: TASTE_COLORS[idx], val }))
      .filter((t) => t.val > 0.3)
      .sort((a, b) => b.val - a.val)
      .slice(0, 2);
  };

  return (
    <section className="search-sidebar" style={{ width: '100%', pointerEvents: 'auto' }}>
      <div className="search-card glass-panel" style={{ padding: '24px' }}>
        <h2 className="search-card-title" style={{ fontSize: '1.45rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>🧪</span> Flavor Formulation Board
        </h2>

        {workerState === 'loading' && (
          <div className="worker-loading-panel" style={{ padding: '30px 10px' }}>
            <div className="loading-spinner" />
            <p style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Loading 300-D vector database...
            </p>
          </div>
        )}

        {workerState === 'error' && (
          <div style={{ color: 'var(--color-sweet)', fontSize: '12px', padding: '12px 0' }}>
            <strong>WASM error:</strong> {workerError}
          </div>
        )}

        {workerState === 'ready' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Left Column: Add Positives */}
              <div className="search-input-group" ref={posInputRef}>
                <label className="search-input-label" style={{ color: 'var(--color-herbal)' }}>
                  <span>➕</span> Base Profiles
                </label>
                <div className="search-field-container">
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '12px' }}>🔍</span>
                  <input
                    ref={posInputRef}
                    type="text"
                    className="search-input-field"
                    style={{ padding: '10px 12px 10px 32px', fontSize: '13.5px', borderRadius: '8px' }}
                    placeholder="Type Tomato, Lemon, Basil..."
                    value={posInput}
                    onChange={(e) => {
                      setPosInput(e.target.value);
                      setShowPosDropdown(true);
                      setPosActiveIndex(0);
                    }}
                    onFocus={() => setShowPosDropdown(true)}
                    onKeyDown={(e) => handleDropdownKeyDown(
                      e, filteredPosSuggestions, posActiveIndex, setPosActiveIndex,
                      onAddPositive, setPosInput, setShowPosDropdown
                    )}
                  />

                  {showPosDropdown && filteredPosSuggestions.length > 0 && (
                    <div className="autocomplete-dropdown" style={{ borderRadius: '8px' }}>
                      {filteredPosSuggestions.map((item, index) => {
                        const dominant = getDominantTastes(item.sensory)[0];
                        return (
                          <div
                            key={item.originalIndex}
                            className={`autocomplete-item ${index === posActiveIndex ? 'active' : ''}`}
                            style={{
                              padding: '9px 12px',
                              background: index === posActiveIndex ? 'rgba(96, 108, 56, 0.08)' : 'transparent',
                            }}
                            onClick={() => {
                              onAddPositive(item.originalIndex);
                              setPosInput('');
                              setShowPosDropdown(false);
                            }}
                            onMouseEnter={() => setPosActiveIndex(index)}
                          >
                            <span>{item.name}</span>
                            {dominant && <span className="autocomplete-item-taste">{dominant.name}</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="chip-container" style={{ minHeight: '38px', padding: '6px' }}>
                  {positives.length === 0 && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 'auto 4px' }}>
                      No ingredients added yet.
                    </span>
                  )}
                  {positives.map((idx) => {
                    const ing = ingredients[idx];
                    if (!ing) return null;
                    return (
                      <span key={idx} className="ingredient-chip positive" style={{ padding: '3px 8px', fontSize: '11px' }}>
                        {ing.name}
                        <button className="chip-remove-btn" onClick={() => onRemovePositive(idx)}>×</button>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Add Negatives */}
              <div className="search-input-group" ref={negInputRef}>
                <label className="search-input-label" style={{ color: 'var(--color-sweet)' }}>
                  <span>➖</span> Exclude Notes
                </label>
                <div className="search-field-container">
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '12px' }}>🔍</span>
                  <input
                    ref={negInputRef}
                    type="text"
                    className="search-input-field"
                    style={{ padding: '10px 12px 10px 32px', fontSize: '13.5px', borderRadius: '8px' }}
                    placeholder="Type Sugar, Bacon, Honey..."
                    value={negInput}
                    onChange={(e) => {
                      setNegInput(e.target.value);
                      setShowNegDropdown(true);
                      setNegActiveIndex(0);
                    }}
                    onFocus={() => setShowNegDropdown(true)}
                    onKeyDown={(e) => handleDropdownKeyDown(
                      e, filteredNegSuggestions, negActiveIndex, setNegActiveIndex,
                      onAddNegative, setNegInput, setShowNegDropdown
                    )}
                  />

                  {showNegDropdown && filteredNegSuggestions.length > 0 && (
                    <div className="autocomplete-dropdown" style={{ borderRadius: '8px' }}>
                      {filteredNegSuggestions.map((item, index) => {
                        const dominant = getDominantTastes(item.sensory)[0];
                        return (
                          <div
                            key={item.originalIndex}
                            className={`autocomplete-item ${index === negActiveIndex ? 'active' : ''}`}
                            style={{
                              padding: '9px 12px',
                              background: index === negActiveIndex ? 'rgba(96, 108, 56, 0.08)' : 'transparent',
                            }}
                            onClick={() => {
                              onAddNegative(item.originalIndex);
                              setNegInput('');
                              setShowNegDropdown(false);
                            }}
                            onMouseEnter={() => setNegActiveIndex(index)}
                          >
                            <span>{item.name}</span>
                            {dominant && <span className="autocomplete-item-taste">{dominant.name}</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="chip-container" style={{ minHeight: '38px', padding: '6px' }}>
                  {negatives.length === 0 && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 'auto 4px' }}>
                      No ingredients subtracted.
                    </span>
                  )}
                  {negatives.map((idx) => {
                    const ing = ingredients[idx];
                    if (!ing) return null;
                    return (
                      <span key={idx} className="ingredient-chip negative" style={{ padding: '3px 8px', fontSize: '11px' }}>
                        {ing.name}
                        <button className="chip-remove-btn" onClick={() => onRemoveNegative(idx)}>×</button>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            <VectorEquation positives={positives} negatives={negatives} ingredients={ingredients} />
          </div>
        )}
      </div>
    </section>
  );
};
