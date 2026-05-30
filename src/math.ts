import { Ingredient } from './types';

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface ProjectionParams {
  cosX: number;
  sinX: number;
  cosY: number;
  sinY: number;
  centerX: number;
  centerY: number;
  cameraFocalLength: number;
  cameraDistance: number;
  zoom?: number;
}

export interface ProjectedPoint {
  px: number;
  py: number;
  scale: number;
  rz: number;
}

export interface CosmicDustStar {
  x: number;
  y: number;
  z: number;
  opacity: number;
  radius: number;
}

export interface PointCloudItem {
  index: number;
  name: string;
  x: number;
  y: number;
  z: number;
  color: string;
  color2?: string;
  sensory: number[];
}

/**
 * Projects a 3D coordinate vector [x, y, z] to a 2D viewport location [px, py]
 * using a standard perspective camera matrix transform.
 */
export function project3DTo2D(
  p: Point3D,
  params: ProjectionParams
): ProjectedPoint {
  const {
    cosX,
    sinX,
    cosY,
    sinY,
    centerX,
    centerY,
    cameraFocalLength,
    cameraDistance,
    zoom = 1.0
  } = params;

  let x1 = p.x * cosY - p.z * sinY;
  let z1 = p.z * cosY + p.x * sinY;
  let y2 = p.y * cosX - z1 * sinX;
  let z2 = z1 * cosX + p.y * sinX;

  if (zoom !== 1.0) {
    x1 *= zoom;
    y2 *= zoom;
    z1 *= zoom;
    z2 *= zoom;
  }

  const scale = cameraFocalLength / (cameraFocalLength + z2 + cameraDistance);
  const px = centerX + x1 * scale;
  const py = centerY + y2 * scale;

  return {
    px,
    py,
    scale,
    rz: z2
  };
}

export function calculateUmapCenterOffset(ingredients: Ingredient[]): Point3D {
  if (ingredients.length === 0) return { x: 0, y: 0, z: 0 };
  let sumX = 0, sumY = 0, sumZ = 0, count = 0;
  ingredients.forEach((ing) => {
    if (ing.coords) {
      sumX += ing.coords[0];
      sumY += ing.coords[1];
      sumZ += ing.coords[2];
      count++;
    }
  });
  return count > 0 ? { x: sumX / count, y: sumY / count, z: sumZ / count } : { x: 0, y: 0, z: 0 };
}

export function calculateTasteMeans(ingredients: Ingredient[]): number[] {
  const means = Array(10).fill(0);
  if (ingredients.length === 0) return means;
  ingredients.forEach((ing) => {
    for (let i = 0; i < 10; i++) means[i] += ing.sensory[i] || 0;
  });
  return means.map((sum) => sum / ingredients.length);
}

export function generateCosmicDust(count: number = 60): CosmicDustStar[] {
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: (Math.random() - 0.5) * 500,
      y: (Math.random() - 0.5) * 500,
      z: (Math.random() - 0.5) * 500,
      opacity: 0.15 + Math.random() * 0.35,
      radius: 0.4 + Math.random() * 0.8
    });
  }
  return stars;
}

export function generatePointCloud(ingredients: Ingredient[], centerOffset: Point3D): PointCloudItem[] {
  if (ingredients.length === 0) return [];
  const colors = [
    '#be4b34', '#bf9525', '#487f65', '#2c2f42', '#9a3821',
    '#be3f25', '#355f37', '#437554', '#474d52', '#b67732'
  ];

  return ingredients.map((ing, idx) => {
    const x = ((ing.coords?.[0] ?? 0) - centerOffset.x) * 230;
    const y = ((ing.coords?.[1] ?? 0) - centerOffset.y) * 230;
    const z = ((ing.coords?.[2] ?? 0) - centerOffset.z) * 230;

    const seed = idx * 1.5;
    const maxVal = Math.max(...ing.sensory);
    const maxIndices: number[] = [];
    ing.sensory.forEach((v, i) => { if (Math.abs(v - maxVal) < 1e-5 && v > 0) maxIndices.push(i); });

    return {
      index: idx,
      name: ing.name,
      x: x + Math.sin(seed) * 12,
      y: y + Math.cos(seed) * 12,
      z: z + Math.sin(seed * 2.3) * 12,
      color: colors[maxIndices[0]] || '#6366f1',
      color2: maxIndices.length >= 2 ? (colors[maxIndices[1]] || '#6366f1') : undefined,
      sensory: ing.sensory
    };
  });
}
