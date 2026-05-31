import { describe, it, expect } from 'vitest';
import { encodeAlchemicalState, decodeAlchemicalState } from '../hooks/useAlchemicalURLSync';

describe('Alchemical URL Base64 Binary Serialization', () => {
  const maxIndex = 400; // Database index boundary

  it('should encode and decode a standard state losslessly (Roundtrip Verification)', () => {
    const positives = [12, 194, 256];
    const negatives = [5, 99];
    const customName = 'Coriander Dream-Vial';

    // Encode
    const encoded = encodeAlchemicalState(positives, negatives, customName);
    expect(typeof encoded).toBe('string');
    expect(encoded.length).toBeGreaterThan(0);

    // Decode
    const decoded = decodeAlchemicalState(encoded, maxIndex);

    expect(decoded.positives).toEqual(positives);
    expect(decoded.negatives).toEqual(negatives);
    expect(decoded.customName).toBe(customName);
  });

  it('should generate URL-safe Base64 strings (no standard +, /, or =)', () => {
    // Specifically construct input that would produce +, /, and = padding under standard Base64
    const positives = [0, 1, 2];
    const negatives = [3];
    const customName = 'a'; // small string to check padding removal

    const encoded = encodeAlchemicalState(positives, negatives, customName);

    expect(encoded).not.toContain('+');
    expect(encoded).not.toContain('/');
    expect(encoded).not.toContain('=');
  });

  it('should decode empty formulation states cleanly', () => {
    const positives: number[] = [];
    const negatives: number[] = [];
    const customName = '';

    const encoded = encodeAlchemicalState(positives, negatives, customName);
    const decoded = decodeAlchemicalState(encoded, maxIndex);

    expect(decoded.positives).toEqual([]);
    expect(decoded.negatives).toEqual([]);
    expect(decoded.customName).toBe('');
  });

  it('should filter out indices that exceed the database maxIndex limit during decoding', () => {
    const positives = [10, 500]; // 500 exceeds maxIndex = 400
    const negatives = [300, 450]; // 450 exceeds maxIndex = 400
    const customName = 'Safe formulation';

    const encoded = encodeAlchemicalState(positives, negatives, customName);
    const decoded = decodeAlchemicalState(encoded, maxIndex);

    expect(decoded.positives).toEqual([10]);
    expect(decoded.negatives).toEqual([300]);
    expect(decoded.customName).toBe(customName);
  });

  it('should handle UTF-8 characters in recipe names correctly', () => {
    const positives = [42];
    const negatives = [7];
    const customName = 'Crème brûlée & Szechuan 🌶️';

    const encoded = encodeAlchemicalState(positives, negatives, customName);
    const decoded = decodeAlchemicalState(encoded, maxIndex);

    expect(decoded.positives).toEqual([42]);
    expect(decoded.negatives).toEqual([7]);
    expect(decoded.customName).toBe(customName);
  });
});
