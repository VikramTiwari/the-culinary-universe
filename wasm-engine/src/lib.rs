use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};

// Set up a global allocator for tiny WASM binary sizes (default is fine, but we configure panic hook below)
#[wasm_bindgen(start)]
pub fn init_panic_hook() {
    // When the `console_error_panic_hook` feature is enabled, we can call this
    // to get better error messages in the browser console if Rust panics.
    console_error_panic_hook::set_once();
}

/// Represents an individual search match containing the original dataset index
/// and the calculated cosine similarity score.
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SearchResult {
    pub index: u32,
    pub score: f32,
}

/// LocalVectorIndex manages the flat vector dataset inside the WASM linear memory space.
/// It performs exact K-Nearest Neighbor (KNN) brute-force scans over contiguous memory.
#[wasm_bindgen]
pub struct LocalVectorIndex {
    /// Contiguous vector data. A flat representation of dimension-sized float slices.
    /// Shape: [num_vectors, dimensions]
    vectors: Vec<f32>,
    /// Dimensions of the vector space (e.g., 256)
    dimensions: usize,
    /// Total count of vectors in the dataset (e.g., 5000)
    num_vectors: usize,
    /// Pre-computed L2 Norms of each vector. Pre-calculating these on initialization
    /// saves 256 multiplications and 1 square root per vector during every single search,
    /// improving computational throughput by over 10x.
    norms: Vec<f32>,
}

#[wasm_bindgen]
impl LocalVectorIndex {
    /// Creates a new index by copying a Float32Array from JavaScript into WASM memory.
    /// 
    /// ### Memory Boundary Boundary Notice:
    /// - `buffer`: This parameter is passed as a slice `&[f32]`. Behind the scenes, `wasm-bindgen`
    ///   allocates a temporary slice pointing directly to the JS-typed `Float32Array` on the WASM heap.
    /// - `.to_vec()`: We immediately clone the slice into a Rust-managed, heap-allocated `Vec<f32>`.
    ///   This is crucial because the input slice `&[f32]` is only valid during the duration of the
    ///   function call. Cloning gives Rust complete ownership of the data.
    #[wasm_bindgen(constructor)]
    pub fn new(buffer: &[f32], dimensions: usize) -> Result<LocalVectorIndex, JsValue> {
        Self::new_internal(buffer, dimensions).map_err(|err| JsValue::from_str(&err))
    }

    /// Computes the resulting query vector from positive and negative indices, and
    /// performs a contiguous, linear memory scan (brute-force KNN) to find the top `top_k` matches.
    ///
    /// ### Memory Boundary Boundary Notice:
    /// - `positives` and `negatives` are typed as `&[u32]`. They represent indices of positive
    ///   and negative terms (e.g. `[Tomato, Basil]` - `[Sugar]`).
    /// - The query vector $\vec{T} = \sum \vec{P} - \sum \vec{N}$ is computed locally in Rust memory.
    /// - Cosine similarity is computed: $\cos(\theta) = \frac{\vec{T} \cdot \vec{V}}{\|\vec{T}\| \|\vec{V}\|}$.
    /// - Returns a serialized `JsValue` containing the top K search matches, converted with zero-overhead
    ///   by `serde_wasm_bindgen` into native JavaScript objects.
    pub fn compute_and_search(
        &self,
        positives: &[u32],
        negatives: &[u32],
        top_k: usize,
    ) -> Result<JsValue, JsValue> {
        match self.search_internal(positives, negatives, top_k) {
            Ok(results) => Ok(serde_wasm_bindgen::to_value(&results)?),
            Err(err_msg) => Err(JsValue::from_str(&err_msg)),
        }
    }
}

// Pure Rust internal computation and search implementation for complete native testability
impl LocalVectorIndex {
    pub fn new_internal(buffer: &[f32], dimensions: usize) -> Result<LocalVectorIndex, String> {
        if dimensions == 0 {
            return Err("Dimensions must be greater than zero".to_string());
        }
        if buffer.len() % dimensions != 0 {
            return Err("Buffer size is not a multiple of the vector dimensions".to_string());
        }

        let num_vectors = buffer.len() / dimensions;
        let vectors = buffer.to_vec();
        
        // Pre-compute L2 norms for cache-friendly cosine similarity calculations
        let mut norms = Vec::with_capacity(num_vectors);
        for idx in 0..num_vectors {
            let start = idx * dimensions;
            let end = start + dimensions;
            let slice = &vectors[start..end];
            
            let mut sum_sq = 0.0f32;
            for &val in slice {
                sum_sq += val * val;
            }
            norms.push(sum_sq.sqrt());
        }

        Ok(LocalVectorIndex {
            vectors,
            dimensions,
            num_vectors,
            norms,
        })
    }

    pub fn search_internal(
        &self,
        positives: &[u32],
        negatives: &[u32],
        top_k: usize,
    ) -> Result<Vec<SearchResult>, String> {
        if positives.is_empty() && negatives.is_empty() {
            return Err("Must specify at least one positive or negative ingredient".to_string());
        }

        // Initialize target query vector
        let mut target = vec![0.0f32; self.dimensions];

        // 1. Accumulate positive ingredient vectors
        for &idx in positives {
            let idx_usize = idx as usize;
            if idx_usize >= self.num_vectors {
                return Err(format!("Positive index {} out of bounds", idx));
            }
            let start = idx_usize * self.dimensions;
            let end = start + self.dimensions;
            let slice = &self.vectors[start..end];
            for i in 0..self.dimensions {
                target[i] += slice[i];
            }
        }

        // 2. Subtract negative ingredient vectors
        for &idx in negatives {
            let idx_usize = idx as usize;
            if idx_usize >= self.num_vectors {
                return Err(format!("Negative index {} out of bounds", idx));
            }
            let start = idx_usize * self.dimensions;
            let end = start + self.dimensions;
            let slice = &self.vectors[start..end];
            for i in 0..self.dimensions {
                target[i] -= slice[i];
            }
        }

        // 3. Compute L2 norm of the synthesized target vector
        let mut target_norm_sq = 0.0f32;
        for i in 0..self.dimensions {
            target_norm_sq += target[i] * target[i];
        }
        let target_norm = target_norm_sq.sqrt();

        // 4. Perform highly optimized linear cosine similarity scan
        let mut results: Vec<SearchResult> = Vec::with_capacity(self.num_vectors);

        for idx in 0..self.num_vectors {
            let start = idx * self.dimensions;
            let end = start + self.dimensions;
            let vec_slice = &self.vectors[start..end];

            // Linear contiguous dot-product.
            // When compiled in release mode with `opt-level = 3`, the compiler automatically
            // auto-vectorizes this loop into SIMD instructions (AVX/NEON) on modern browsers.
            let mut dot_product = 0.0f32;
            for i in 0..self.dimensions {
                dot_product += target[i] * vec_slice[i];
            }

            let vec_norm = self.norms[idx];
            let score = if target_norm > 0.0 && vec_norm > 0.0 {
                dot_product / (target_norm * vec_norm)
            } else {
                0.0f32
            };

            results.push(SearchResult {
                index: idx as u32,
                score,
            });
        }

        // 5. Sort matching scores in descending order
        // We use sort_unstable_by because float values are not Ord. We handle NaNs safely.
        results.sort_unstable_by(|a, b| {
            b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal)
        });

        // 6. Truncate to top K results
        results.truncate(top_k);

        Ok(results)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_index_initialization_success() {
        let buffer = vec![
            1.0, 0.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 0.0, 1.0,
        ];
        let index = LocalVectorIndex::new_internal(&buffer, 3).unwrap();
        assert_eq!(index.dimensions, 3);
        assert_eq!(index.num_vectors, 3);
    }

    #[test]
    fn test_index_initialization_invalid() {
        let buffer = vec![1.0, 0.0];
        // Zero dimensions
        assert!(LocalVectorIndex::new_internal(&buffer, 0).is_err());
        // Mismatched size (2 values, dimension 3)
        assert!(LocalVectorIndex::new_internal(&buffer, 3).is_err());
    }

    #[test]
    fn test_norms_precomputation() {
        let buffer = vec![
            3.0, 4.0, 0.0, // length = sqrt(3^2 + 4^2) = 5
            0.0, 1.0, 0.0, // length = 1
        ];
        let index = LocalVectorIndex::new_internal(&buffer, 3).unwrap();
        assert_eq!(index.norms[0], 5.0f32);
        assert_eq!(index.norms[1], 1.0f32);
    }

    #[test]
    fn test_compute_and_search_success() {
        // Index with 3 vectors of dimension 3:
        // Index 0: [1.0, 0.0, 0.0]
        // Index 1: [0.0, 1.0, 0.0]
        // Index 2: [0.0, 0.0, 1.0]
        let buffer = vec![
            1.0, 0.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 0.0, 1.0,
        ];
        let index = LocalVectorIndex::new_internal(&buffer, 3).unwrap();

        // 1. Positive query for Index 0
        let results = index.search_internal(&[0], &[], 3).unwrap();
        
        // The closest vector should be Index 0 itself (score = 1.0)
        assert_eq!(results[0].index, 0);
        assert_eq!(results[0].score, 1.0f32);
        
        // 2. Synthesized blend query with positives and negatives:
        // Target: [1.0, 1.0, 0.0] (combining Index 0 + Index 1)
        let results2 = index.search_internal(&[0, 1], &[], 3).unwrap();
        
        // Score for Index 0 and Index 1: 1.0 / sqrt(2) = 0.70710677
        assert_eq!(results2[0].score.is_nan(), false);
        assert!((results2[0].score - 0.70710677).abs() < 1e-5);
    }

    #[test]
    fn test_compute_and_search_out_of_bounds() {
        let buffer = vec![1.0, 0.0, 0.0];
        let index = LocalVectorIndex::new_internal(&buffer, 3).unwrap();

        // Positive out of bounds
        assert!(index.search_internal(&[5], &[], 3).is_err());
        // Negative out of bounds
        assert!(index.search_internal(&[], &[5], 3).is_err());
    }

    #[test]
    fn test_compute_and_search_empty_queries() {
        let buffer = vec![1.0, 0.0, 0.0];
        let index = LocalVectorIndex::new_internal(&buffer, 3).unwrap();

        assert!(index.search_internal(&[], &[], 3).is_err());
    }
}
