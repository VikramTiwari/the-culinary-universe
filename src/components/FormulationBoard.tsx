import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Ingredient } from '../types';
import { TASTE_NAMES, TASTE_COLORS } from '../constants';
import { useRouter } from '../hooks/useRouter';

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
  customName: string;
  setCustomName: (name: string) => void;
  setIsNameEdited: (edited: boolean) => void;
  onNameBlur: () => void;
}

export const FormulationBoard: React.FC<FormulationBoardProps> = ({
  positives, negatives, ingredients,
  onAddPositive, onRemovePositive, onAddNegative, onRemoveNegative,
  workerState, workerError,
  customName, setCustomName, setIsNameEdited,
  onNameBlur
}) => {
  const { navigate } = useRouter();
  const [posInput, setPosInput] = useState('');
  const [negInput, setNegInput] = useState('');
  const [showPosDropdown, setShowPosDropdown] = useState(false);
  const [showNegDropdown, setShowNegDropdown] = useState(false);
  const [posActiveIndex, setPosActiveIndex] = useState(0);
  const [negActiveIndex, setNegActiveIndex] = useState(0);

  const posInputRef = useRef<HTMLDivElement>(null);
  const negInputRef = useRef<HTMLDivElement>(null);

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
    <div style={{ 
      padding: '12px 32px', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '20px',
      flexWrap: 'wrap',
      background: 'rgba(255, 255, 255, 0.45)',
      backdropFilter: 'blur(20px) saturate(180%)',
      borderBottom: '1px solid rgba(96, 108, 56, 0.15)',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* Sleek Alchemical Vial Logo Indicator */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        borderRight: '1px solid rgba(255,255,255,0.08)', 
        paddingRight: '16px', 
        userSelect: 'none',
        height: '24px'
      }}>
        <span style={{ 
          fontFamily: '"Outfit", sans-serif', 
          fontSize: '13.5px', 
          fontWeight: 800, 
          textTransform: 'uppercase', 
          letterSpacing: '0.08em',
          color: 'var(--text-muted)'
        }}>Formulation</span>
      </div>

      {workerState === 'loading' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>
            Loading database...
          </p>
        </div>
      )}

      {workerState === 'error' && (
        <div style={{ color: 'var(--color-sweet)', fontSize: '14px', padding: '4px 0' }}>
          <strong>Error:</strong> {workerError}
        </div>
      )}

      {workerState === 'ready' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          fontSize: '19px',
          color: 'var(--text-secondary)',
          flexGrow: 1
        }}>
          {/* Recipe Name Input */}
          <input
            type="text"
            value={customName}
            onChange={(e) => {
              setCustomName(e.target.value);
              setIsNameEdited(true);
            }}
            onBlur={onNameBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onNameBlur();
                e.currentTarget.blur();
              }
            }}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: '1.5px dashed rgba(72, 127, 101, 0.4)',
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontSize: '21px',
              fontWeight: 700,
              fontStyle: 'italic',
              color: 'var(--color-sweet)',
              padding: '2px 4px',
              width: '210px',
              outline: 'none',
              transition: 'all 0.2s ease',
            }}
            placeholder="Name recipe..."
            title="Click to rename recipe"
          />

          {/* Equals Operator */}
          <span className="equation-symbol" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-secondary)', fontFamily: 'Outfit, sans-serif', margin: '0 4px', userSelect: 'none' }}>＝</span>

          {/* Additions parenthetical list */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', minHeight: '28px' }} ref={posInputRef}>
            <span style={{ fontSize: '21px', fontWeight: 600, color: 'var(--text-muted)', userSelect: 'none' }}>(</span>

            {positives.map((idx) => {
              const ing = ingredients[idx];
              if (!ing) return null;
              return (
                <span key={idx} className="ingredient-chip positive" style={{ padding: '3px 9px', fontSize: '12.5px', gap: '4px' }}>
                  {ing.name}
                  <button className="chip-remove-btn" onClick={() => onRemovePositive(idx)}>×</button>
                </span>
              );
            })}

            <div style={{ position: 'relative', display: 'inline-block', minWidth: '100px', flexGrow: 1 }}>
              <input
                type="text"
                className="inline-equation-input"
                placeholder={positives.length === 0 ? "+ add ingredients..." : "+ add..."}
                value={posInput}
                onChange={(e) => {
                  setPosInput(e.target.value);
                  setShowPosDropdown(true);
                  setPosActiveIndex(0);
                }}
                onFocus={() => setShowPosDropdown(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && posInput === '' && positives.length > 0) {
                    onRemovePositive(positives[positives.length - 1]);
                  } else {
                    handleDropdownKeyDown(
                      e, filteredPosSuggestions, posActiveIndex, setPosActiveIndex,
                      onAddPositive, setPosInput, setShowPosDropdown
                    );
                  }
                }}
              />

              {showPosDropdown && filteredPosSuggestions.length > 0 && (
                <div className="autocomplete-dropdown" style={{
                  borderRadius: '8px',
                  width: '220px',
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  zIndex: 100,
                  marginTop: '4px'
                }}>
                  {filteredPosSuggestions.map((item, index) => {
                    const dominant = getDominantTastes(item.sensory)[0];
                    return (
                      <div
                        key={item.originalIndex}
                        className={`autocomplete-item ${index === posActiveIndex ? 'active' : ''}`}
                        style={{
                          padding: '7px 10px',
                          fontSize: '15px',
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

            <span style={{ fontSize: '21px', fontWeight: 600, color: 'var(--text-muted)', userSelect: 'none' }}>)</span>
          </div>

          {/* Subtraction Operator */}
          <span className="equation-symbol" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-secondary)', fontFamily: 'Outfit, sans-serif', margin: '0 6px', userSelect: 'none' }}>－</span>

          {/* Exclusions parenthetical list */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', minHeight: '28px' }} ref={negInputRef}>
            <span style={{ fontSize: '21px', fontWeight: 600, color: 'var(--text-muted)', userSelect: 'none' }}>(</span>

            {negatives.map((idx) => {
              const ing = ingredients[idx];
              if (!ing) return null;
              return (
                <span key={idx} className="ingredient-chip negative" style={{ padding: '3px 9px', fontSize: '12.5px', gap: '4px' }}>
                  {ing.name}
                  <button className="chip-remove-btn" onClick={() => onRemoveNegative(idx)}>×</button>
                </span>
              );
            })}

            <div style={{ position: 'relative', display: 'inline-block', minWidth: '100px', flexGrow: 1 }}>
              <input
                type="text"
                className="inline-equation-input"
                placeholder={negatives.length === 0 ? "- exclude flavors..." : "- subtract..."}
                value={negInput}
                onChange={(e) => {
                  setNegInput(e.target.value);
                  setShowNegDropdown(true);
                  setNegActiveIndex(0);
                }}
                onFocus={() => setShowNegDropdown(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && negInput === '' && negatives.length > 0) {
                    onRemoveNegative(negatives[negatives.length - 1]);
                  } else {
                    handleDropdownKeyDown(
                      e, filteredNegSuggestions, negActiveIndex, setNegActiveIndex,
                      onAddNegative, setNegInput, setShowNegDropdown
                    );
                  }
                }}
              />

              {showNegDropdown && filteredNegSuggestions.length > 0 && (
                <div className="autocomplete-dropdown" style={{
                  borderRadius: '8px',
                  width: '220px',
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  zIndex: 100,
                  marginTop: '4px'
                }}>
                  {filteredNegSuggestions.map((item, index) => {
                    const dominant = getDominantTastes(item.sensory)[0];
                    return (
                      <div
                        key={item.originalIndex}
                        className={`autocomplete-item ${index === negActiveIndex ? 'active' : ''}`}
                        style={{
                          padding: '7px 10px',
                          fontSize: '15px',
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

            <span style={{ fontSize: '21px', fontWeight: 600, color: 'var(--text-muted)', userSelect: 'none' }}>)</span>
          </div>

        </div>
      )}

      {/* Floating Exit Button on Far Right of the Shelf */}
      <button
        onClick={() => navigate('/')}
        style={{
          background: 'rgba(33, 37, 41, 0.04)',
          color: 'var(--text-secondary)',
          border: '1px solid rgba(96, 108, 56, 0.15)',
          borderRadius: '99px',
          padding: '6px 14px',
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          fontSize: '13.5px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          transition: 'all 0.2s ease',
          userSelect: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(33, 37, 41, 0.08)';
          e.currentTarget.style.borderColor = 'rgba(96, 108, 56, 0.3)';
          e.currentTarget.style.color = 'var(--text-primary)';
          e.currentTarget.style.transform = 'translateY(-0.5px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(33, 37, 41, 0.04)';
          e.currentTarget.style.borderColor = 'rgba(96, 108, 56, 0.15)';
          e.currentTarget.style.color = 'var(--text-secondary)';
          e.currentTarget.style.transform = 'none';
        }}
      >
        <span>Return to Explorer</span>
      </button>
    </div>
  );
};
