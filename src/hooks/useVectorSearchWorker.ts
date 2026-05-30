import { useState, useEffect, useRef } from 'react';

export interface SearchResult {
  index: number;
  score: number;
}

export type WorkerState = 'idle' | 'loading' | 'ready' | 'error';
export type SearchState = 'idle' | 'loading' | 'ready' | 'error';

export function useVectorSearchWorker(positives: number[], negatives: number[]) {
  const workerRef = useRef<Worker | null>(null);
  const [workerState, setWorkerState] = useState<WorkerState>('idle');
  const [workerError, setWorkerError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLatency, setSearchLatency] = useState<number | null>(null);
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [searchError, setSearchError] = useState<string | null>(null);

  // 1. Initialize Web Worker & Fetch dataset.bin
  useEffect(() => {
    // Vite-compatible worker instantiation syntax
    const worker = new Worker(
      new URL('../worker.ts', import.meta.url),
      { type: 'module' }
    );
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent) => {
      const { type, results, error: msgError, latencyMs } = event.data;

      switch (type) {
        case 'INIT_SUCCESS':
          setWorkerState('ready');
          break;
        case 'INIT_ERROR':
          setWorkerState('error');
          setWorkerError(msgError || 'Unknown WASM initialization error');
          break;
        case 'SEARCH_SUCCESS':
          setSearchResults(results || []);
          setSearchLatency(latencyMs || 0);
          setSearchState('ready');
          break;
        case 'SEARCH_ERROR':
          setSearchState('error');
          setSearchError(msgError || 'Search calculation failed');
          break;
        default:
          break;
      }
    };

    setWorkerState('loading');
    fetch('./dataset.bin')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to download full vector dataset (dataset.bin)');
        return res.arrayBuffer();
      })
      .then((buffer) => {
        worker.postMessage(
          {
            type: 'INIT',
            payload: {
              buffer,
              dimensions: 300,
            },
          },
          [buffer]
        );
      })
      .catch((err) => {
        setWorkerState('error');
        setWorkerError(err.message || err.toString());
      });

    return () => {
      worker.terminate();
    };
  }, []);

  // 2. Trigger full-dimensional searches in the worker when positive/negative lists change
  useEffect(() => {
    if (workerState !== 'ready' || !workerRef.current) return;
    if (positives.length === 0 && negatives.length === 0) {
      setSearchResults([]);
      setSearchState('idle');
      return;
    }

    setSearchState('loading');
    workerRef.current.postMessage({
      type: 'SEARCH',
      payload: {
        positives,
        negatives,
      },
    });
  }, [positives, negatives, workerState]);

  return {
    workerState,
    workerError,
    searchResults,
    searchLatency,
    searchState,
    searchError,
  };
}
