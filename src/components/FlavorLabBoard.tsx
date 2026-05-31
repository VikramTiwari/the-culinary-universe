import React from 'react';
import { Ingredient } from '../types';
import { useRouter } from '../hooks/useRouter';
import { IngredientChip } from './IngredientChip';
import { AutocompleteDropdown } from './AutocompleteDropdown';
import { useFlavorLabState } from '../hooks/useFlavorLabState';
import { RecipeNameInput } from './RecipeNameInput';

interface FlavorLabBoardProps {
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

export const FlavorLabBoard: React.FC<FlavorLabBoardProps> = ({
  positives, negatives, ingredients,
  onAddPositive, onRemovePositive, onAddNegative, onRemoveNegative,
  workerState, workerError,
  customName, setCustomName, setIsNameEdited,
  onNameBlur
}) => {
  const { navigate } = useRouter();
  const {
    posInput,
    setPosInput,
    negInput,
    setNegInput,
    showPosDropdown,
    setShowPosDropdown,
    showNegDropdown,
    setShowNegDropdown,
    posActiveIndex,
    setPosActiveIndex,
    negActiveIndex,
    setNegActiveIndex,
    posInputRef,
    negInputRef,
    filteredPosSuggestions,
    filteredNegSuggestions,
    handleDropdownKeyDown
  } = useFlavorLabState({
    ingredients,
    positives,
    negatives
  });

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
        }}>Flavor Lab</span>
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
          <RecipeNameInput
            customName={customName}
            setCustomName={setCustomName}
            setIsNameEdited={setIsNameEdited}
            onNameBlur={onNameBlur}
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
                <IngredientChip
                  key={idx}
                  name={ing.name}
                  onRemove={() => onRemovePositive(idx)}
                  type="positive"
                />
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
                <AutocompleteDropdown
                  suggestions={filteredPosSuggestions}
                  activeIndex={posActiveIndex}
                  onSelect={(originalIndex) => {
                    onAddPositive(originalIndex);
                    setPosInput('');
                    setShowPosDropdown(false);
                  }}
                  onHoverItem={setPosActiveIndex}
                />
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
                <IngredientChip
                  key={idx}
                  name={ing.name}
                  onRemove={() => onRemoveNegative(idx)}
                  type="negative"
                />
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
                <AutocompleteDropdown
                  suggestions={filteredNegSuggestions}
                  activeIndex={negActiveIndex}
                  onSelect={(originalIndex) => {
                    onAddNegative(originalIndex);
                    setNegInput('');
                    setShowNegDropdown(false);
                  }}
                  onHoverItem={setNegActiveIndex}
                />
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
