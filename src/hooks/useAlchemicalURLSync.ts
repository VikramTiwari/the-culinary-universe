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
  alchemyActive, ingredients,
  positives, setPositives,
  negatives, setNegatives
}: AlchemicalURLSyncProps) {
  const hasInitializedRef = useRef(false);
  const isReadyToWriteRef = useRef(false);

  // 1. Decode alchemical state from URL-safe Base64 hash ID on load
  useEffect(() => {
    if (!alchemyActive || ingredients.length === 0 || hasInitializedRef.current) return;

    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
    if (hash.trim()) {
      try {
        // Convert URL-safe Base64 back to standard Base64
        let base64 = hash.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) base64 += '=';

        const json = atob(base64);
        const state = JSON.parse(json);

        const loadedPositives: number[] = [];
        const loadedNegatives: number[] = [];

        if (Array.isArray(state.a)) {
          state.a.forEach((item: any) => {
            const val = String(item).trim();
            const idxVal = parseInt(val, 10);
            if (!isNaN(idxVal) && idxVal.toString() === val && idxVal >= 0 && idxVal < ingredients.length) {
              loadedPositives.push(idxVal);
            } else {
              const idx = ingredients.findIndex((ing) => ing.name.toLowerCase() === val.toLowerCase());
              if (idx !== -1) loadedPositives.push(idx);
            }
          });
        }

        if (Array.isArray(state.s)) {
          state.s.forEach((item: any) => {
            const val = String(item).trim();
            const idxVal = parseInt(val, 10);
            if (!isNaN(idxVal) && idxVal.toString() === val && idxVal >= 0 && idxVal < ingredients.length) {
              loadedNegatives.push(idxVal);
            } else {
              const idx = ingredients.findIndex((ing) => ing.name.toLowerCase() === val.toLowerCase());
              if (idx !== -1) loadedNegatives.push(idx);
            }
          });
        }

        setPositives(loadedPositives);
        setNegatives(loadedNegatives);
      } catch (e) {
        console.warn('Failed to parse alchemical formulation hash ID:', e);
      }
    }

    hasInitializedRef.current = true;
    setTimeout(() => {
      isReadyToWriteRef.current = true;
    }, 150);
  }, [alchemyActive, ingredients, setPositives, setNegatives]);

  // 2. Encode alchemical state into URL-safe Base64 hash ID on formulation changes
  useEffect(() => {
    if (!alchemyActive || ingredients.length === 0 || !hasInitializedRef.current || !isReadyToWriteRef.current) return;

    let hashQuery = '';
    if (positives.length > 0 || negatives.length > 0) {
      try {
        // Map indices to ingredient names for robust, self-healing dataset resilient sharing
        const posNames = positives.map((idx) => ingredients[idx]?.name).filter(Boolean);
        const negNames = negatives.map((idx) => ingredients[idx]?.name).filter(Boolean);

        const state = { a: posNames, s: negNames };
        const json = JSON.stringify(state);
        const base64 = btoa(json);

        // Convert to URL-safe Base64
        hashQuery = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      } catch (e) {
        console.error('Failed to encode alchemical formulation hash ID:', e);
      }
    }

    const newRelativePathQuery = window.location.pathname + window.location.search + (hashQuery ? '#' + hashQuery : '');
    window.history.replaceState(null, '', newRelativePathQuery);
  }, [alchemyActive, positives, negatives, ingredients]);
}
