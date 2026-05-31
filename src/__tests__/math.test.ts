import { describe, it, expect } from 'vitest';
import {
  calculateTasteMeans,
  calculateUmapCenterOffset,
  generatePointCloud,
  performKMeansClustering
} from '../math';
import { Ingredient } from '../types';

describe('Math Utilities & Algorithms', () => {
  const mockIngredients: Ingredient[] = [
    {
      name: 'Sugar',
      coords: [1.0, 2.0, 3.0],
      sensory: [0.9, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    },
    {
      name: 'Lemon',
      coords: [-2.0, -1.0, 0.0],
      sensory: [0.1, 0.85, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    },
    {
      name: 'Salt',
      coords: [3.0, 0.0, -1.0],
      sensory: [0.0, 0.0, 0.95, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    }
  ];

  describe('calculateTasteMeans', () => {
    it('should aggregate sensory values correctly', () => {
      const means = calculateTasteMeans(mockIngredients);
      expect(means).toBeInstanceOf(Array);
      expect(means.length).toBe(10);
      
      // Expected sweet average = (0.9 + 0.1 + 0.0) / 3 = 0.333...
      expect(means[0]).toBeCloseTo(0.333, 3);
      // Expected sour average = (0.1 + 0.85 + 0.0) / 3 = 0.3166...
      expect(means[1]).toBeCloseTo(0.317, 3);
      // Expected salty average = (0.0 + 0.0 + 0.95) / 3 = 0.3166...
      expect(means[2]).toBeCloseTo(0.317, 3);
    });

    it('should return all zeros for empty ingredients', () => {
      const means = calculateTasteMeans([]);
      expect(means).toEqual(new Array(10).fill(0));
    });
  });

  describe('calculateUmapCenterOffset', () => {
    it('should calculate the centroid of the point coordinates correctly', () => {
      const offset = calculateUmapCenterOffset(mockIngredients);
      // Average x = (1.0 + -2.0 + 3.0) / 3 = 0.666... => rounds to 0.667
      expect(offset.x).toBeCloseTo(0.667, 3);
      // Average y = (2.0 + -1.0 + 0.0) / 3 = 0.333... => rounds to 0.333
      expect(offset.y).toBeCloseTo(0.333, 3);
      // Average z = (3.0 + 0.0 + -1.0) / 3 = 0.666... => rounds to 0.667
      expect(offset.z).toBeCloseTo(0.667, 3);
    });

    it('should return all zeros for empty ingredients', () => {
      const offset = calculateUmapCenterOffset([]);
      expect(offset).toEqual({ x: 0, y: 0, z: 0 });
    });
  });

  describe('generatePointCloud', () => {
    it('should correctly translate coordinates and scale them by 230', () => {
      const offset = { x: 1.0, y: 1.0, z: 1.0 };
      const pointCloud = generatePointCloud(mockIngredients, offset);

      expect(pointCloud.length).toBe(3);

      // Sugar first coordinate translated (idx 0, seed 0): (1.0 - 1.0) * 230 + sin(0) * 12 = 0
      expect(pointCloud[0].x).toBeCloseTo(0, 3);
      // Sugar y: (2.0 - 1.0) * 230 + cos(0) * 12 = 230 + 12 = 242
      expect(pointCloud[0].y).toBeCloseTo(242, 3);
      // Lemon x (idx 1, seed 1.5): (-2.0 - 1.0) * 230 + sin(1.5) * 12 = -690 + 0.99749 * 12 = -678.03
      const expectedLemonX = -690 + Math.sin(1.5) * 12;
      expect(pointCloud[1].x).toBeCloseTo(expectedLemonX, 3);
    });

    it('should return empty list for empty ingredients', () => {
      const pointCloud = generatePointCloud([], { x: 0, y: 0, z: 0 });
      expect(pointCloud).toEqual([]);
    });
  });

  describe('performKMeansClustering', () => {
    it('should segment UMAP points into exactly 10 stable groups matching pure taste peaks', () => {
      // Create a set of 10 points corresponding to each pure taste dimension peak
      const KPoints = Array.from({ length: 10 }, (_, idx) => {
        const sensory = new Array(10).fill(0);
        sensory[idx] = 1.0; // Peak value for this dimension
        return {
          index: idx,
          name: `Ingredient ${idx}`,
          x: idx * 10,
          y: idx * 10,
          z: idx * 10,
          color: '#ffffff',
          sensory
        };
      });

      const clusters = performKMeansClustering(KPoints);

      expect(clusters.length).toBe(10);
      clusters.forEach((cluster, idx) => {
        expect(cluster.majorityTasteIdx).toBe(idx);
        expect(cluster.centroid).toHaveProperty('x');
        expect(cluster.centroid).toHaveProperty('y');
        expect(cluster.centroid).toHaveProperty('z');
      });
    });

    it('should handle empty point arrays safely', () => {
      const clusters = performKMeansClustering([]);
      expect(clusters).toEqual([]);
    });
  });
});
