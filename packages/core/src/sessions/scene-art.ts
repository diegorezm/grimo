import type { ReadingScene } from "./focus";

/**
 * What the reading themes are made of, for any renderer: SVG paths (web `<svg>`,
 * `react-native-svg`), particle positions in percent, and how each theme's sound is synthesized.
 */
export const SCENE_WIDTH = 1200;
export const SCENE_HEIGHT = 400;

/** Stable pseudo-random numbers, so a scene doesn't change on every render. */
const noise = (seed: number) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};

/** A row of pines as one silhouette path. */
function pines(seed: number, count: number, minHeight: number, maxHeight: number) {
  const step = SCENE_WIDTH / count;
  let path = `M0 ${SCENE_HEIGHT}`;
  for (let tree = 0; tree <= count; tree++) {
    const x = tree * step + (noise(seed + tree) - 0.5) * step * 0.6;
    const height = minHeight + noise(seed + tree * 7) * (maxHeight - minHeight);
    const half = height * 0.22;
    const top = SCENE_HEIGHT - height;
    path += ` L${x - half} ${SCENE_HEIGHT} L${x - half * 0.55} ${top + height * 0.62}`;
    path += ` L${x - half * 0.8} ${top + height * 0.62} L${x - half * 0.35} ${top + height * 0.32}`;
    path += ` L${x - half * 0.55} ${top + height * 0.32} L${x} ${top}`;
    path += ` L${x + half * 0.55} ${top + height * 0.32} L${x + half * 0.35} ${top + height * 0.32}`;
    path += ` L${x + half * 0.8} ${top + height * 0.62} L${x + half * 0.55} ${top + height * 0.62}`;
    path += ` L${x + half} ${SCENE_HEIGHT}`;
  }
  return `${path} L${SCENE_WIDTH} ${SCENE_HEIGHT} Z`;
}

/** Twice the screen wide with a whole number of crests, so sliding by half loops seamlessly. */
function wave(height: number, amplitude: number) {
  const period = 300;
  let path = `M0 ${SCENE_HEIGHT - height}`;
  for (let x = 0; x < SCENE_WIDTH * 2; x += period) {
    path += ` q${period / 4} ${-amplitude} ${period / 2} 0 t${period / 2} 0`;
  }
  return `${path} L${SCENE_WIDTH * 2} ${SCENE_HEIGHT} L0 ${SCENE_HEIGHT} Z`;
}

export const SCENE_FOREST_LAYERS = [
  { path: pines(3, 26, 120, 210), ink: 9, sway: 11 },
  { path: pines(11, 18, 150, 280), ink: 15, sway: 15 },
  { path: pines(23, 11, 200, 360), ink: 24, sway: 19 },
];
export const SCENE_FIREFLIES = Array.from({ length: 16 }, (_, index) => ({
  left: 4 + noise(index + 40) * 92,
  bottom: 4 + noise(index + 70) * 42,
  delay: -noise(index + 90) * 12,
  duration: 8 + noise(index + 110) * 8,
}));
export const SCENE_RAINDROPS = Array.from({ length: 60 }, (_, index) => ({
  left: noise(index + 200) * 100,
  delay: -noise(index + 300) * 3,
  duration: 0.9 + noise(index + 400) * 0.9,
}));
export const SCENE_STARS = Array.from({ length: 70 }, (_, index) => ({
  left: noise(index + 500) * 100,
  top: noise(index + 600) * 70,
  size: 1 + noise(index + 700) * 2,
  delay: -noise(index + 800) * 6,
  duration: 3 + noise(index + 900) * 4,
}));
export const SCENE_WAVES = [
  { path: wave(170, 26), ink: 9, drift: 26 },
  { path: wave(115, 20), ink: 15, drift: 19 },
  { path: wave(60, 14), ink: 24, drift: 13 },
];
export const SCENE_HILLS = `M0 ${SCENE_HEIGHT} L0 300 Q200 210 420 290 T820 270 T${SCENE_WIDTH} 300 L${SCENE_WIDTH} ${SCENE_HEIGHT} Z`;
export const SCENE_RAIN_HILLS = pines(37, 16, 90, 190);

export const SCENE_SUNSET_PINES = pines(51, 24, 90, 300);
export const SCENE_CHECKS = Array.from({ length: 24 }, (_, index) => ({
  x: 215 + (index % 6) * 62,
  y: 300 + Math.floor(index / 6) * 42,
  fill: ["#d9a066", "#f0d9b5", "#7d7f4a", "#f0d9b5"][(index + Math.floor(index / 6)) % 4],
}));

export interface SceneSound {
  noise: "brown" | "white";
  filter: BiquadFilterType;
  frequency: number;
  volume: number;
  /** Slow swell: how fast (Hz) and how deep. */
  swell: [number, number];
  crickets?: boolean;
}

export const SCENE_SOUNDS: Record<Exclude<ReadingScene, "none">, SceneSound> = {
  cozy: { noise: "brown", filter: "lowpass", frequency: 380, volume: 0.3, swell: [0.04, 0.04] },
  window: { noise: "brown", filter: "lowpass", frequency: 900, volume: 0.3, swell: [0.09, 0.2] },
  sunset: {
    noise: "brown",
    filter: "lowpass",
    frequency: 600,
    volume: 0.25,
    swell: [0.07, 0.1],
    crickets: true,
  },
  forest: { noise: "brown", filter: "lowpass", frequency: 700, volume: 0.35, swell: [0.08, 0.12] },
  rain: { noise: "white", filter: "bandpass", frequency: 2600, volume: 0.05, swell: [0.05, 0.01] },
  night: {
    noise: "brown",
    filter: "lowpass",
    frequency: 320,
    volume: 0.2,
    swell: [0.05, 0.05],
    crickets: true,
  },
  ocean: { noise: "brown", filter: "lowpass", frequency: 1100, volume: 0.35, swell: [0.11, 0.25] },
};
