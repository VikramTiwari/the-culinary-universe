import { describe, it, expect } from 'vitest';
import {
  calculateSynthesizedSensory,
  determineDominantTasteColor,
  calculateAlchemicalNodeCoords,
  calculateDynamicZoom,
  determineDefaultRecipeName
} from '../hooks/useAlchemicalCalculations';
import { Ingredient } from '../types';

describe('Alchemical Synthesis Calculations', () => {
  const mockIngredients: Ingredient[] = [
    {
      name: 'Sugar',
      coords: [0, 0, 0],
      sensory: [0.8, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    },
    {
      name: 'Lemon',
      coords: [10, 10, 10],
      sensory: [0.0, 0.6, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    },
    {
      name: 'Chili',
      coords: [-20, -20, -20],
      sensory: [0.0, 0.0, 0.0, 0.0, 0.0, 0.7, 0.0, 0.0, 0.0, 0.0],
    }
  ];

  describe('calculateSynthesizedSensory', () => {
    it('should aggregate positive ingredient sensory arrays and average by positive count', () => {
      const positives = [0, 1]; // Sugar (sweet 0.8) + Lemon (sour 0.6)
      const negatives: number[] = [];

      const sensory = calculateSynthesizedSensory(positives, negatives, mockIngredients);

      // Total positives = 2. Averages should be divided by 2.
      expect(sensory[0]).toBeCloseTo(0.4, 3); // sweet: 0.8 / 2
      expect(sensory[1]).toBeCloseTo(0.3, 3); // sour: 0.6 / 2
      expect(sensory[2]).toBe(0);
    });

    it('should correctly subtract negative ingredient sensory profiles and clamp results to 0', () => {
      const positives = [0]; // Sugar (sweet 0.8)
      const negatives = [1]; // Lemon (sour 0.6, sweet 0.0)

      // Let's create an ingredient with sweet to subtract
      const sweetLemon: Ingredient = {
        name: 'Sweet Lemon',
        coords: [0, 0, 0],
        sensory: [0.2, 0.6, 0, 0, 0, 0, 0, 0, 0, 0]
      };
      
      const sensory = calculateSynthesizedSensory(positives, negatives, [mockIngredients[0], sweetLemon]);

      // 0.8 sweet - 0.2 sweet = 0.6 sweet. count = 1. Result = 0.6
      expect(sensory[0]).toBeCloseTo(0.6, 3);
      // 0.0 sour - 0.6 sour = -0.6. Clamps to 0
      expect(sensory[1]).toBe(0);
    });

    it('should return all zeros for empty ingredients list', () => {
      const sensory = calculateSynthesizedSensory([], [], []);
      expect(sensory).toEqual(new Array(10).fill(0));
    });
  });

  describe('determineDominantTasteColor', () => {
    it('should identify the dominant taste color correctly', () => {
      // Index 5 has value 0.7 (highest)
      const sensory = [0.1, 0.0, 0.0, 0.0, 0.0, 0.7, 0.0, 0.0, 0.0, 0.0];
      const color = determineDominantTasteColor(sensory, true);
      // Index 5 is umami/spicy (Chili) matching TASTE_COLORS[5]
      expect(color).toBeDefined();
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('should return honey gold fallback color if no active ingredients exist', () => {
      const color = determineDominantTasteColor(new Array(10).fill(0), false);
      expect(color).toBe('#bf9525');
    });
  });

  describe('calculateAlchemicalNodeCoords', () => {
    const mockPointCloud = [
      { x: 0, y: 0, z: 0 },
      { x: 10, y: 0, z: 0 },
      { x: 20, y: 20, z: 20 }
    ];

    it('should calculate coordinate average for positives', () => {
      const coords = calculateAlchemicalNodeCoords([0, 1], [], mockPointCloud);
      // Average of (0,0,0) and (10,0,0) = (5, 0, 0)
      expect(coords).toEqual({ x: 5, y: 0, z: 0 });
    });

    it('should repel coordinates away from excluded negatives (Exclusion Vector Repulsion Math)', () => {
      // Positive point is index 0: (0,0,0)
      // Negative point is index 1: (10,0,0)
      // Repulsion distance = 60
      // positive is at (0,0,0), negative is at (10,0,0) -> dx = -10 (direction away is -1, 0, 0)
      // expected coords: 0 + (-1 * 60) = -60, y = 0, z = 0
      const coords = calculateAlchemicalNodeCoords([0], [1], mockPointCloud);
      
      expect(coords.x).toBeCloseTo(-60, 3);
      expect(coords.y).toBeCloseTo(0, 3);
      expect(coords.z).toBeCloseTo(0, 3);
    });

    it('should return (0,0,0) if there are no selections', () => {
      const coords = calculateAlchemicalNodeCoords([], [], []);
      expect(coords).toEqual({ x: 0, y: 0, z: 0 });
    });
  });

  describe('calculateDynamicZoom', () => {
    const mockPointCloud = [
      { x: 0, y: 0, z: 0 },
      { x: 100, y: 100, z: 100 }
    ];

    it('should return close inspection zoom 12.0 for single active ingredient', () => {
      const nodeCenter = { x: 0, y: 0, z: 0 };
      const zoom = calculateDynamicZoom([0], [], mockPointCloud, nodeCenter);
      expect(zoom).toBe(12.0);
    });

    it('should dynamically calculate camera zoom based on max coordinates spread distance', () => {
      const nodeCenter = { x: 50, y: 50, z: 50 };
      // Dist from (50,50,50) to (0,0,0) = sqrt(50^2 * 3) = sqrt(7500) = ~86.6
      const zoom = calculateDynamicZoom([0, 1], [], mockPointCloud, nodeCenter);
      
      // Expected formula: Math.max(4.5, Math.min(13.0, 14.5 - maxDist * 0.05))
      // maxDist = 86.6. 14.5 - 86.6 * 0.05 = 14.5 - 4.33 = 10.17
      expect(zoom).toBeCloseTo(10.17, 1);
    });
  });

  describe('determineDefaultRecipeName', () => {
    it('should return "Empty Formulation" if positives and negatives are empty', () => {
      const name = determineDefaultRecipeName([], [], mockIngredients);
      expect(name).toBe('Empty Formulation');
    });

    it('should return ingredient name if single element is active', () => {
      const name = determineDefaultRecipeName([0], [], mockIngredients);
      expect(name).toBe('Sugar');
    });

    it('should return "Synthesized Compound" if multiple elements are active', () => {
      const name = determineDefaultRecipeName([0, 1], [], mockIngredients);
      expect(name).toBe('Synthesized Compound');
    });
  });
});
