import { useEffect, useRef } from 'react';
import { Ingredient } from '../types';

// Pure function to encode formulation state to a URL-safe Base64 binary hash ID
export function encodeAlchemicalState(
  positives: number[],
  negatives: number[],
  customName: string
): string {
  const encoder = new TextEncoder();
  const nameBytes = encoder.encode(customName);

  // 1 byte (pos count) + 2 * pos.length + 1 byte (neg count) + 2 * neg.length + nameBytes
  const totalLength = 1 + positives.length * 2 + 1 + negatives.length * 2 + nameBytes.length;
  const buffer = new ArrayBuffer(totalLength);
  const view = new DataView(buffer);
  const uint8 = new Uint8Array(buffer);

  let offset = 0;

  // Encode positive indices
  view.setUint8(offset++, positives.length);
  for (const pos of positives) {
    view.setUint16(offset, pos, false);
    offset += 2;
  }

  // Encode negative indices
  view.setUint8(offset++, negatives.length);
  for (const neg of negatives) {
    view.setUint16(offset, neg, false);
    offset += 2;
  }

  // Encode name bytes
  uint8.set(nameBytes, offset);

  // Convert binary to standard Base64
  let binString = '';
  for (let i = 0; i < uint8.length; i++) {
    binString += String.fromCharCode(uint8[i]);
  }
  const base64 = btoa(binString);

  // Convert to URL-safe Base64
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Pure function to decode formulation state from a URL-safe Base64 binary hash ID
export function decodeAlchemicalState(
  hash: string,
  maxIndex: number
): { positives: number[]; negatives: number[]; customName: string } {
  // Convert URL-safe Base64 back to standard Base64
  let base64 = hash.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';

  const binString = atob(base64);
  const uint8 = new Uint8Array(binString.length);
  for (let i = 0; i < binString.length; i++) {
    uint8[i] = binString.charCodeAt(i);
  }

  const view = new DataView(uint8.buffer);
  let offset = 0;

  // Decode positive indices
  const loadedPositives: number[] = [];
  if (offset < uint8.length) {
    const posCount = view.getUint8(offset++);
    for (let i = 0; i < posCount; i++) {
      if (offset + 2 <= uint8.length) {
        const idx = view.getUint16(offset, false);
        offset += 2;
        if (idx >= 0 && idx < maxIndex) {
          loadedPositives.push(idx);
        }
      }
    }
  }

  // Decode negative indices
  const loadedNegatives: number[] = [];
  if (offset < uint8.length) {
    const negCount = view.getUint8(offset++);
    for (let i = 0; i < negCount; i++) {
      if (offset + 2 <= uint8.length) {
        const idx = view.getUint16(offset, false);
        offset += 2;
        if (idx >= 0 && idx < maxIndex) {
          loadedNegatives.push(idx);
        }
      }
    }
  }

  // Decode custom name
  let loadedName = '';
  if (offset < uint8.length) {
    const nameBytes = uint8.subarray(offset);
    loadedName = new TextDecoder().decode(nameBytes);
  }

  return {
    positives: loadedPositives,
    negatives: loadedNegatives,
    customName: loadedName
  };
}

interface AlchemicalURLSyncProps {
  alchemyActive: boolean;
  ingredients: Ingredient[];
  positives: number[];
  setPositives: React.Dispatch<React.SetStateAction<number[]>>;
  negatives: number[];
  setNegatives: React.Dispatch<React.SetStateAction<number[]>>;
  customName: string;
  setCustomName: React.Dispatch<React.SetStateAction<string>>;
  setIsNameEdited: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useAlchemicalURLSync({
  alchemyActive, ingredients,
  positives, setPositives,
  negatives, setNegatives,
  customName, setCustomName,
  setIsNameEdited
}: AlchemicalURLSyncProps) {
  const hasInitializedRef = useRef(false);
  const isReadyToWriteRef = useRef(false);

  // 1. Decode alchemical state from URL-safe Base64 binary hash ID on load
  useEffect(() => {
    if (!alchemyActive || ingredients.length === 0 || hasInitializedRef.current) return;

    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
    if (hash.trim()) {
      try {
        const { positives: loadedPositives, negatives: loadedNegatives, customName: loadedName } = decodeAlchemicalState(hash, ingredients.length);

        setPositives(loadedPositives);
        setNegatives(loadedNegatives);

        if (loadedName) {
          setCustomName(loadedName);
          setIsNameEdited(true);
        }
      } catch (e) {
        console.warn('Failed to parse alchemical binary formulation hash ID:', e);
      }
    }

    hasInitializedRef.current = true;
    setTimeout(() => {
      isReadyToWriteRef.current = true;
    }, 150);
  }, [alchemyActive, ingredients, setPositives, setNegatives, setCustomName, setIsNameEdited]);

  // 2. Encode alchemical state into URL-safe Base64 binary hash ID on formulation changes
  useEffect(() => {
    if (!alchemyActive || ingredients.length === 0 || !hasInitializedRef.current || !isReadyToWriteRef.current) return;

    let hashQuery = '';
    if (positives.length > 0 || negatives.length > 0) {
      try {
        hashQuery = encodeAlchemicalState(positives, negatives, customName);
      } catch (e) {
        console.error('Failed to encode alchemical binary formulation hash ID:', e);
      }
    }

    const newRelativePathQuery = window.location.pathname + window.location.search + (hashQuery ? '#' + hashQuery : '');
    window.history.replaceState(null, '', newRelativePathQuery);
  }, [alchemyActive, positives, negatives, ingredients, customName]);
}
