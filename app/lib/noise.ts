// Simplex-style Perlin noise implementation
function fade(t: number) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number) {
  return a + t * (b - a);
}

function grad(hash: number, x: number, y: number) {
  const h = hash & 3;
  const u = h < 2 ? x : y;
  const v = h < 2 ? y : x;
  return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
}

export class PerlinNoise {
  private perm: number[];

  constructor(seed = 0) {
    const p = Array.from({ length: 256 }, (_, i) => i);
    // Seeded shuffle
    let s = seed;
    for (let i = 255; i > 0; i--) {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      const j = Math.abs(s) % (i + 1);
      [p[i], p[j]] = [p[j], p[i]];
    }
    this.perm = [...p, ...p];
  }

  noise(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);
    const a = this.perm[X] + Y;
    const b = this.perm[X + 1] + Y;
    return lerp(
      lerp(grad(this.perm[a], xf, yf), grad(this.perm[b], xf - 1, yf), u),
      lerp(grad(this.perm[a + 1], xf, yf - 1), grad(this.perm[b + 1], xf - 1, yf - 1), u),
      v
    );
  }

  // Fractal Brownian Motion — layered octaves for organic terrain
  fbm(x: number, y: number, octaves = 3, lacunarity = 2, gain = 0.5): number {
    let value = 0;
    let amplitude = 0.5;
    let frequency = 1;
    for (let i = 0; i < octaves; i++) {
      value += this.noise(x * frequency, y * frequency) * amplitude;
      amplitude *= gain;
      frequency *= lacunarity;
    }
    return value;
  }
}
