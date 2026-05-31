import { useState, useEffect } from 'react';
import { findNearestNeighbors3D } from '../math';

export function useMapHighlights(
  autoRotate: boolean,
  pointCloud: any[],
  alchemyActive: boolean,
  primaryIdx: number | null
) {
  const [randomHighlights, setRandomHighlights] = useState<number[]>([]);
  const [hoveredNeighbors, setHoveredNeighbors] = useState<{ name: string; score: number }[]>([]);

  useEffect(() => {
    if (!autoRotate || pointCloud.length === 0 || alchemyActive) {
      setRandomHighlights([]);
      return;
    }
    const selectRandom = () => {
      const selected: number[] = [];
      const len = pointCloud.length;
      while (selected.length < Math.min(10, len)) {
        const rand = Math.floor(Math.random() * len);
        if (!selected.includes(rand)) selected.push(rand);
      }
      setRandomHighlights(selected);
    };
    selectRandom();
    const interval = setInterval(selectRandom, 4000);
    return () => clearInterval(interval);
  }, [autoRotate, pointCloud.length, alchemyActive]);

  useEffect(() => {
    if (primaryIdx === null || pointCloud.length === 0 || alchemyActive) {
      setHoveredNeighbors([]);
      return;
    }
    const candidates = findNearestNeighbors3D(primaryIdx, pointCloud);
    setHoveredNeighbors(candidates.slice(0, 3));
  }, [primaryIdx, pointCloud, alchemyActive]);

  return { randomHighlights, hoveredNeighbors };
}
