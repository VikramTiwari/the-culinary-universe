import { useState, useEffect, useMemo } from 'react';
import { Ingredient } from '../types';
import {
  calculateUmapCenterOffset,
  calculateTasteMeans,
  generateCosmicDust,
  generatePointCloud,
  performKMeansClustering,
} from '../math';

export function useIngredientLoader() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('./ingredients.json')
      .then((res) => res.json())
      .then((data: Ingredient[]) => setIngredients(data))
      .catch(() => setError('Failed to load ingredient metadata'));
  }, []);

  const cosmicDust = useMemo(() => generateCosmicDust(60), []);
  const umapCenterOffset = useMemo(() => calculateUmapCenterOffset(ingredients), [ingredients]);
  const tasteMeans = useMemo(() => calculateTasteMeans(ingredients), [ingredients]);
  const pointCloud = useMemo(() => generatePointCloud(ingredients, umapCenterOffset), [
    ingredients,
    umapCenterOffset,
  ]);
  const clusters = useMemo(() => performKMeansClustering(pointCloud), [pointCloud]);

  return {
    ingredients,
    error,
    cosmicDust,
    umapCenterOffset,
    tasteMeans,
    pointCloud,
    clusters,
  };
}
