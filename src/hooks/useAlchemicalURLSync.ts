import { useEffect, useRef } from 'react';
import { Ingredient } from '../types';

interface AlchemicalURLSyncProps {
  alchemyActive: boolean;
  ingredients: Ingredient[];
  positives: number[];
  setPositives: React.Dispatch<React.SetStateAction<number[]>>;
  negatives: number[];
  setNegatives: React.Dispatch<React.SetStateAction<number[]>>;
}

export function useAlchemicalURLSync({
  alchemyActive,
  ingredients,
  positives,
  setPositives,
  negatives,
  setNegatives
}: AlchemicalURLSyncProps) {
  const hasInitializedRef = useRef(false);

  // 1. Initialize positives and negatives from URL parameters once ingredients are loaded
  useEffect(() => {
    if (!alchemyActive || ingredients.length === 0 || hasInitializedRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const addParam = params.get('add');
    const subParam = params.get('sub');

    let loadedPositives: number[] = [];
    let loadedNegatives: number[] = [];

    if (addParam) {
      const names = addParam.split(',');
      names.forEach((name) => {
        const idx = ingredients.findIndex(
          (ing) => ing.name.toLowerCase() === name.trim().toLowerCase()
        );
        if (idx !== -1 && !loadedPositives.includes(idx)) loadedPositives.push(idx);
      });
    }

    if (subParam) {
      const names = subParam.split(',');
      names.forEach((name) => {
        const idx = ingredients.findIndex(
          (ing) => ing.name.toLowerCase() === name.trim().toLowerCase()
        );
        if (idx !== -1 && !loadedNegatives.includes(idx)) loadedNegatives.push(idx);
      });
    }

    if (loadedPositives.length > 0 || loadedNegatives.length > 0) {
      setPositives(loadedPositives);
      setNegatives(loadedNegatives);
    }
    
    hasInitializedRef.current = true;
  }, [alchemyActive, ingredients, setPositives, setNegatives]);

  // 2. Synchronize positive additions and negative subtractions to URL parameters on changes
  useEffect(() => {
    if (!alchemyActive || ingredients.length === 0 || !hasInitializedRef.current) return;

    const params = new URLSearchParams();

    if (positives.length > 0) {
      const names = positives.map((idx) => ingredients[idx]?.name).filter(Boolean);
      params.set('add', names.join(','));
    }

    if (negatives.length > 0) {
      const names = negatives.map((idx) => ingredients[idx]?.name).filter(Boolean);
      params.set('sub', names.join(','));
    }

    const query = params.toString();
    const newRelativePathQuery = window.location.pathname + (query ? '?' + query : '');
    window.history.replaceState(null, '', newRelativePathQuery);
  }, [alchemyActive, positives, negatives, ingredients]);
}
