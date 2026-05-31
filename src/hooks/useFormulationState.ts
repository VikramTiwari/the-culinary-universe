import { useState, useEffect, useRef, useMemo } from 'react';
import { Ingredient } from '../types';

interface UseFormulationStateParams {
  ingredients: Ingredient[];
  positives: number[];
  negatives: number[];
}

export function useFormulationState({
  ingredients,
  positives,
  negatives,
}: UseFormulationStateParams) {
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
      if (posInputRef.current && !posInputRef.current.contains(e.target as Node)) {
        setShowPosDropdown(false);
      }
      if (negInputRef.current && !negInputRef.current.contains(e.target as Node)) {
        setShowNegDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const getFilteredSuggestions = (input: string, excluded: number[]) => {
    if (!input.trim()) return [];
    const query = input.toLowerCase();
    return ingredients
      .map((ing, originalIndex) => ({ ...ing, originalIndex }))
      .filter(
        (ing) => ing.name.toLowerCase().includes(query) && !excluded.includes(ing.originalIndex)
      )
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

  return {
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
    handleDropdownKeyDown,
  };
}
