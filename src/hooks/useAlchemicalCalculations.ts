import { useMemo } from 'react';
import { Ingredient } from '../types';
import { TASTE_COLORS } from '../constants';

interface AlchemicalCalculationsProps {
  alchemyActive: boolean;
  positives: number[];
  negatives: number[];
  pointCloud: any[];
  searchResults: { index: number; score: number }[];
  ingredients: Ingredient[];
  customName: string;
}

export function useAlchemicalCalculations({
  alchemyActive,
  positives,
  negatives,
  pointCloud,
  searchResults,
  ingredients,
  customName
}: AlchemicalCalculationsProps) {
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

  // Find dominant taste index and its color dynamically
  const dominantTasteColor = useMemo(() => {
    if (positives.length === 0 && negatives.length === 0) {
      return '#bf9525'; // Fallback default (Honey gold)
    }
    let maxVal = -Infinity;
    let dominantIdx = 0;
    synthesizedSensory.forEach((val, i) => {
      if (val > maxVal) {
        maxVal = val;
        dominantIdx = i;
      }
    });
    return TASTE_COLORS[dominantIdx] || '#bf9525';
  }, [synthesizedSensory, positives.length, negatives.length]);

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

    const filteredSearchResults = searchResults.filter(
      (res) => !positives.includes(res.index) && !negatives.includes(res.index)
    );

    return {
      x,
      y,
      z,
      positives,
      negatives,
      searchResults: filteredSearchResults,
      dominantColor: dominantTasteColor,
      sensory: synthesizedSensory,
      customName
    };
  }, [alchemyActive, positives, negatives, pointCloud, searchResults, dominantTasteColor, synthesizedSensory, customName]);

  // Calculate dynamic alchemical camera zoom based on coordinate spread
  const dynamicZoom = useMemo(() => {
    if (!alchemyActive || (positives.length === 0 && negatives.length === 0) || pointCloud.length === 0 || !alchemicalNode) {
      return 7.0; // default zoom
    }

    let maxDist = 0;
    const activeIndices = [...positives, ...negatives];
    activeIndices.forEach((idx) => {
      const p = pointCloud[idx];
      if (p) {
        const dx = p.x - alchemicalNode.x;
        const dy = p.y - alchemicalNode.y;
        const dz = p.z - alchemicalNode.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist > maxDist) maxDist = dist;
      }
    });

    if (maxDist === 0) {
      return 12.0; // Close inspection zoom for single element
    }

    // Dynamic zoom mapping: closer when tight, farther when spread (min 4.5, max 13.0)
    const targetZoom = Math.max(4.5, Math.min(13.0, 14.5 - maxDist * 0.05));
    return targetZoom;
  }, [alchemyActive, positives, negatives, pointCloud, alchemicalNode]);

  return {
    alchemicalNode,
    synthesizedSensory,
    dynamicZoom
  };
}
