import { useMemo } from 'react';
import { Ingredient } from '../types';
import { TASTE_COLORS } from '../constants';

// Pure function to calculate dynamic alchemical camera zoom based on coordinate spread
export function calculateDynamicZoom(
  positives: number[],
  negatives: number[],
  pointCloud: { x: number; y: number; z: number }[],
  nodeCenter: { x: number; y: number; z: number }
): number {
  let maxDist = 0;
  const activeIndices = [...positives, ...negatives];
  activeIndices.forEach((idx) => {
    const p = pointCloud[idx];
    if (p) {
      const dx = p.x - nodeCenter.x;
      const dy = p.y - nodeCenter.y;
      const dz = p.z - nodeCenter.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist > maxDist) maxDist = dist;
    }
  });

  if (maxDist === 0) {
    return 12.0; // Close inspection zoom for single element
  }

  // Dynamic zoom mapping: closer when tight, farther when spread (min 4.5, max 13.0)
  return Math.max(4.5, Math.min(13.0, 14.5 - maxDist * 0.05));
}

// Pure function to calculate dynamic coordinate centerpiece node
export function calculateAlchemicalNodeCoords(
  positives: number[],
  negatives: number[],
  pointCloud: { x: number; y: number; z: number }[]
): { x: number; y: number; z: number } {
  if (positives.length === 0 && negatives.length === 0) return { x: 0, y: 0, z: 0 };

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

  return { x, y, z };
}

// Pure function to combine positive and negative sensory profiles
export function calculateSynthesizedSensory(
  positives: number[],
  negatives: number[],
  ingredients: Ingredient[]
): number[] {
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
}

// Pure function to find the dominant color in a synthesized sensory profile
export function determineDominantTasteColor(
  sensory: number[],
  hasIngredients: boolean
): string {
  if (!hasIngredients) {
    return '#bf9525'; // Fallback default (Honey gold)
  }
  let maxVal = -Infinity;
  let dominantIdx = 0;
  sensory.forEach((val, i) => {
    if (val > maxVal) {
      maxVal = val;
      dominantIdx = i;
    }
  });
  return TASTE_COLORS[dominantIdx] || '#bf9525';
}

// Pure function to determine default alchemical recipe name dynamically
export function determineDefaultRecipeName(
  positives: number[],
  negatives: number[],
  ingredients: Ingredient[]
): string {
  const totalCount = positives.length + negatives.length;
  if (totalCount === 0) {
    return 'Empty Formulation';
  } else if (totalCount === 1) {
    const idx = positives.length === 1 ? positives[0] : negatives[0];
    return ingredients[idx]?.name || 'Synthesized Compound';
  }

  // 1. Gather active ingredient names
  const activeIndices = [...positives, ...negatives];
  const names = activeIndices
    .map((idx) => ingredients[idx]?.name)
    .filter(Boolean) as string[];

  if (names.length === 0) {
    return 'Synthesized Compound';
  }

  // 2. Stable seeded pseudorandom generator based on combined indices
  const seedStr = activeIndices.slice().sort().join('-');
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const random = () => {
    hash = (hash * 1664525 + 1013904223) | 0;
    return (hash >>> 0) / 0xffffffff;
  };

  // 3. Extract prefix, middle, and suffix slices from clean ingredient names
  const chunks: string[] = [];
  for (const name of names) {
    const clean = name.toLowerCase().replace(/[^a-z]/g, '');
    if (clean.length <= 3) {
      chunks.push(clean);
    } else {
      const len = clean.length;
      chunks.push(clean.slice(0, Math.ceil(len / 2)));
      chunks.push(clean.slice(Math.floor(len / 2)));
      if (len >= 5) {
        chunks.push(clean.slice(Math.floor(len / 4), Math.ceil((3 * len) / 4)));
      }
    }
  }

  if (chunks.length === 0) {
    return 'Synthesized Compound';
  }

  // 4. Randomly pick and concatenate 2 to 3 chunks
  const numChunksToUse = random() > 0.5 ? 3 : 2;
  let blended = '';
  for (let i = 0; i < numChunksToUse; i++) {
    const pickIdx = Math.floor(random() * chunks.length);
    blended += chunks[pickIdx];
  }

  // Deduplicate adjacent repeating letters (e.g. "tto" -> "to") and limit size
  blended = blended.replace(/(.)\1+/g, '$1');
  if (blended.length > 14) {
    blended = blended.slice(0, 12);
  }

  // Format as Capitalized title case
  let nameResult = blended.charAt(0).toUpperCase() + blended.slice(1);

  // 5. Add a culinary/alchemical descriptor with a 65% probability
  const alchemicalModifiers = [
    'Elixir', 'Essence', 'Reduction', 'Emulsion', 'Extract', 
    'Glaze', 'Dust', 'Infusion', 'Nectar', 'Mist', 'Nebula', 
    'Concoction', 'Synthesis', 'Blend', 'Symphony', 'Compote'
  ];
  
  if (random() > 0.35) {
    const modifier = alchemicalModifiers[Math.floor(random() * alchemicalModifiers.length)];
    if (random() > 0.5) {
      nameResult = `${nameResult} ${modifier}`;
    } else {
      nameResult = `${modifier} of ${nameResult}`;
    }
  }

  return nameResult;
}

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
    return calculateSynthesizedSensory(positives, negatives, ingredients);
  }, [positives, negatives, ingredients]);

  // Find dominant taste index and its color dynamically
  const dominantTasteColor = useMemo(() => {
    const hasIngredients = positives.length > 0 || negatives.length > 0;
    return determineDominantTasteColor(synthesizedSensory, hasIngredients);
  }, [synthesizedSensory, positives.length, negatives.length]);

  // Calculate the 3D UMAP coordinate of the custom alchemical node core
  const alchemicalNode = useMemo(() => {
    if (!alchemyActive || (positives.length === 0 && negatives.length === 0) || pointCloud.length === 0) return null;

    const { x, y, z } = calculateAlchemicalNodeCoords(positives, negatives, pointCloud);

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

    return calculateDynamicZoom(positives, negatives, pointCloud, alchemicalNode);
  }, [alchemyActive, positives, negatives, pointCloud, alchemicalNode]);

  return {
    alchemicalNode,
    synthesizedSensory,
    dynamicZoom
  };
}
