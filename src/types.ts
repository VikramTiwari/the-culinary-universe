export interface Ingredient {
  name: string;
  sensory: number[]; // 10-dimensional sensory profile
  coords?: number[]; // 3D UMAP coordinates
}
