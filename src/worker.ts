/// <reference lib="webworker" />

// Import the WASM JS entry point and the binary asset URL from Vite.
// The '?url' suffix instructs Vite to resolve this import as a static asset path,
// ensuring the binary is safely packaged and copied into the production build.
import init, { LocalVectorIndex } from './wasm-engine/pkg/wasm_engine.js';
import wasmUrl from './wasm-engine/pkg/wasm_engine_bg.wasm?url';

interface SearchResult {
  index: number;
  score: number;
}

let index: LocalVectorIndex | null = null;

/**
 * Handles initialization of the WebAssembly module and index instantiation.
 * 
 * ### Memory Transfer & Ownership Details:
 * 1. The float buffer is passed as a `Float32Array` view over a transferred `ArrayBuffer`.
 * 2. In JavaScript, transferring the `ArrayBuffer` avoids a memory copy into the worker thread.
 * 3. When we call `new LocalVectorIndex(...)`, the `wasm-bindgen` glue code copies the float data 
 *    directly into the WebAssembly linear memory space (managed inside the WASM heap).
 * 4. Once copied, Rust takes full ownership, and the original JS array can be safely garbage collected.
 */
async function initializeIndex(arrayBuffer: ArrayBuffer, dimensions: number) {
  try {
    // 1. Initialize the WASM module using the resolved asset URL from Vite
    await init({ module_or_path: wasmUrl });

    // 2. Wrap the transferred raw ArrayBuffer in a typed float view
    const floatBuffer = new Float32Array(arrayBuffer);

    // 3. Instantiate the Rust index class
    index = new LocalVectorIndex(floatBuffer, dimensions);

    // 4. Notify the main thread that loading is fully completed
    postMessage({ type: 'INIT_SUCCESS' });
  } catch (error: any) {
    postMessage({
      type: 'INIT_ERROR',
      error: error?.message || error?.toString() || 'Unknown WASM initialization error',
    });
  }
}

/**
 * Performs vector search based on positive and negative indices.
 */
function performSearch(positives: number[], negatives: number[]) {
  if (!index) {
    postMessage({ type: 'SEARCH_ERROR', error: 'Index is not initialized yet' });
    return;
  }

  try {
    const startTime = performance.now();

    // 1. Pack indices into typed Uint32Arrays to send across the JS-WASM boundary.
    // Uint32Array mapping avoids expensive object serialization, transferring raw binary slices.
    const posTyped = new Uint32Array(positives);
    const negTyped = new Uint32Array(negatives);

    // 2. Execute exact linear cosine KNN scan in the WASM memory space
    const rawResults = index.compute_and_search(posTyped, negTyped, 10) as SearchResult[];

    const latencyMs = performance.now() - startTime;

    // 3. Post results back to the main thread
    postMessage({
      type: 'SEARCH_SUCCESS',
      results: rawResults,
      latencyMs,
    });
  } catch (error: any) {
    postMessage({
      type: 'SEARCH_ERROR',
      error: error?.message || error?.toString() || 'Search execution failed',
    });
  }
}

// Global Message Routing inside the Web Worker
self.onmessage = async (event: MessageEvent) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'INIT':
      const { buffer, dimensions } = payload;
      await initializeIndex(buffer, dimensions);
      break;

    case 'SEARCH':
      const { positives, negatives } = payload;
      performSearch(positives, negatives);
      break;

    default:
      console.warn(`[Web Worker] Unrecognized message type: ${type}`);
      break;
  }
};
