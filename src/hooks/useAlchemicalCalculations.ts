import { useMemo } from 'react';
import { Ingredient } from '../types';

interface AlchemicalCalculationsProps {
  alchemyActive: boolean;
  positives: number[];
  negatives: number[];
  pointCloud: any[];
  searchResults: { index: number; score: number }[];
  ingredients: Ingredient[];
}

export function useAlchemicalCalculations({
  alchemyActive,
  positives,
  negatives,
  pointCloud,
  searchResults,
  ingredients
}: AlchemicalCalculationsProps) {
  // Calculate the 3D UMAP coordinate of the custom alchemical node core
  const alchemicalNode = useMemo(() => {
    if (!alchemyActive || (positives.length === 0 && negatives.length === 0) || pointCloud.length === 0) return null;

    let x = 0, y = 0, z = 0, count = 0;
    positives.forEach((idx) => {
      const p = pointCloud[idx];
      if (p) {
        x += p.x;
        y += p.y;
        z += p.z;
        count++;
      }
    });

    if (count > 0) {
      x = x / count;
      y = y / count;
      z = z / count;
    }

    // Repel alchemical coordinate away from excluded coordinates
    negatives.forEach((idx) => {
      const p = pointCloud[idx];
      if (p) {
        const dx = x - p.x;
        const dy = y - p.y;
        const dz = z - p.z;
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
        x += (dx / d) * 60;
        y += (dy / d) * 60;
        z += (dz / d) * 60;
      }
    });

    return {
      x,
      y,
      z,
      positives,
      negatives,
      searchResults
    };
  }, [alchemyActive, positives, negatives, pointCloud, searchResults]);

  // Real-time Sensory Synthesis math projection for the alchemist guide
  const synthesizedSensory = useMemo(() => {
    if (positives.length === 0 && negatives.length === 0) return Array(10).fill(0);
    const result = Array(10).fill(0);
    positives.forEach((idx) => {
      const ing = ingredients[idx];
      if (ing) {
        for (let i = 0; i < 10; i++) {
          result[i] += ing.sensory[i] || 0;
        }
      }
    });
    negatives.forEach((idx) => {
      const ing = ingredients[idx];
      if (ing) {
        for (let i = 0; i < 10; i++) {
          result[i] -= ing.sensory[i] || 0;
        }
      }
    });

    const count = positives.length;
    return result.map((v) => Math.max(0, Math.min(1, count > 0 ? v / count : v)));
  }, [positives, negatives, ingredients]);

  return {
    alchemicalNode,
    synthesizedSensory
  };
}
