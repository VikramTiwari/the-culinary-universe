import { ProjectionParams } from './math';
import { Star } from './canvasHelpers';

export interface Ingredient {
  name: string;
  sensory: number[]; // 10-dimensional sensory profile
  coords?: number[]; // 3D UMAP coordinates
}

export interface AlchemicalNode {
  x: number;
  y: number;
  z: number;
  positives: number[];
  negatives: number[];
  searchResults: { index: number; score: number }[];
  dominantColor?: string;
}

export interface DrawSceneOptions {
  ctx: CanvasRenderingContext2D;
  pointCloud: any[];
  currentCoords: { x: number; y: number; z: number }[];
  cosmicDust: Star[];
  projectionParams: ProjectionParams;
  zoom: number;
  showAxes: boolean;
  axisTasteX: number;
  axisTasteY: number;
  axisTasteZ: number;
  showTethers: boolean;
  primaryIdx: number | null;
  isComparing: boolean;
  selectedIdx: number | null;
  hoveredIdx: number | null;
  frame: number;
  randomHighlights?: number[];
  alchemicalNode?: AlchemicalNode | null;
  alchemyActive?: boolean;
}
