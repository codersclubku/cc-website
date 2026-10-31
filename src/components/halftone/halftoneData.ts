export interface HalftoneField {
  cols: number;
  rows: number;
  data: Float32Array;
  isPhoto?: boolean;
}

function hashString(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

function createRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateSilhouette(id: string, cols = 64, rows = 80): HalftoneField {
  const seed = hashString(id);
  const rng = createRng(seed);

  const rxHead = 0.17 * (1 + (rng() * 2 - 1) * 0.08);
  const ryHead = 0.20;
  const cxHead = 0.5 + (rng() * 2 - 1) * 0.03;
  const cyHead = 0.33;

  const neckLenMult = 1 + (rng() * 2 - 1) * 0.10;
  const neckTop = cyHead + ryHead * 0.65;
  const neckBottom = neckTop + 0.15 * neckLenMult;
  const neckHalfW = 0.065;

  const rxShoulders = 0.42 * (1 + (rng() * 2 - 1) * 0.10);
  const ryShoulders = 0.28;
  const cyShoulders = 1.0;

  const hasHair = rng() > 0.5;
  const hairRx = rxHead * (1.06 + rng() * 0.08);
  const hairRy = ryHead * (0.65 + rng() * 0.18);
  const hairCy = cyHead - ryHead * 0.30;

  const edgeFalloff = 0.03;
  const data = new Float32Array(cols * rows);

  for (let y = 0; y < rows; y++) {
    const v = y / (rows - 1);
    for (let x = 0; x < cols; x++) {
      const u = x / (cols - 1);

      const dHead = Math.sqrt(
        Math.pow((u - cxHead) / rxHead, 2) + Math.pow((v - cyHead) / ryHead, 2)
      );
      const sHead = Math.max(0, Math.min(1, (1 + edgeFalloff - dHead) / (2 * edgeFalloff)));

      let sHair = 0;
      if (hasHair) {
        const dHair = Math.sqrt(
          Math.pow((u - cxHead) / hairRx, 2) + Math.pow((v - hairCy) / hairRy, 2)
        );
        sHair = Math.max(0, Math.min(1, (1 + edgeFalloff - dHair) / (2 * edgeFalloff)));
      }

      const dShoulders = Math.sqrt(
        Math.pow((u - 0.5) / rxShoulders, 2) + Math.pow((v - cyShoulders) / ryShoulders, 2)
      );
      const sShoulders = Math.max(0, Math.min(1, (1 + edgeFalloff - dShoulders) / (2 * edgeFalloff)));

      const dxNeck = Math.max(0, Math.max(cxHead - neckHalfW - u, u - (cxHead + neckHalfW)));
      const dyNeck = Math.max(0, Math.max(neckTop - v, v - neckBottom));
      const dNeck = Math.sqrt(dxNeck * dxNeck + dyNeck * dyNeck);
      const sNeck = Math.max(0, Math.min(1, (edgeFalloff - dNeck) / edgeFalloff));

      const combined = Math.max(sHead, sHair, sShoulders, sNeck);
      const vertGrad = 1.04 - 0.08 * v;
      data[y * cols + x] = Math.max(0, Math.min(1, combined * vertGrad));
    }
  }

  return { cols, rows, data, isPhoto: false };
}

export function sampleBilinear(field: HalftoneField, u: number, v: number): number {
  const { cols, rows, data } = field;
  const x = Math.max(0, Math.min(cols - 1, u * (cols - 1)));
  const y = Math.max(0, Math.min(rows - 1, v * (rows - 1)));

  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(cols - 1, x0 + 1);
  const y1 = Math.min(rows - 1, y0 + 1);

  const fx = x - x0;
  const fy = y - y0;

  const v00 = data[y0 * cols + x0];
  const v10 = data[y0 * cols + x1];
  const v01 = data[y1 * cols + x0];
  const v11 = data[y1 * cols + x1];

  const top = v00 * (1 - fx) + v10 * fx;
  const bottom = v01 * (1 - fx) + v11 * fx;

  return top * (1 - fy) + bottom * fy;
}

export async function samplePhoto(
  url: string,
  focalX = 0.5,
  focalY = 0.35,
  cols = 64,
  rows = 80
): Promise<HalftoneField> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const offscreen = document.createElement('canvas');
        offscreen.width = cols;
        offscreen.height = rows;
        const ctx = offscreen.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context unavailable'));
          return;
        }

        const aspectCanvas = cols / rows;
        const aspectImg = img.naturalWidth / img.naturalHeight;
        let sw: number;
        let sh: number;
        let sx: number;
        let sy: number;

        if (aspectImg > aspectCanvas) {
          sh = img.naturalHeight;
          sw = sh * aspectCanvas;
          sx = Math.max(0, Math.min(img.naturalWidth - sw, img.naturalWidth * focalX - sw / 2));
          sy = 0;
        } else {
          sw = img.naturalWidth;
          sh = sw / aspectCanvas;
          sx = 0;
          sy = Math.max(0, Math.min(img.naturalHeight - sh, img.naturalHeight * focalY - sh / 2));
        }

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);
        const imgData = ctx.getImageData(0, 0, cols, rows);
        const pixels = imgData.data;

        const count = cols * rows;
        const rawLuminances = new Float32Array(count);

        for (let i = 0; i < count; i++) {
          const r = pixels[i * 4];
          const g = pixels[i * 4 + 1];
          const b = pixels[i * 4 + 2];
          rawLuminances[i] = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        }

        const sorted = new Float32Array(rawLuminances).sort();
        const p2 = sorted[Math.floor(count * 0.02)];
        const p98 = sorted[Math.floor(count * 0.98)];
        const range = Math.max(0.001, p98 - p2);

        const data = new Float32Array(count);
        for (let i = 0; i < count; i++) {
          const norm = Math.max(0, Math.min(1, (rawLuminances[i] - p2) / range));
          data[i] = Math.pow(norm, 0.9);
        }

        resolve({ cols, rows, data, isPhoto: true });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image: ' + url));
    };

    img.src = url;
  });
}

const fieldCache = new Map<string, HalftoneField>();
const pendingLoads = new Map<string, Promise<HalftoneField>>();

export function getHalftoneField(
  id: string,
  photo?: string,
  focalX = 0.5,
  focalY = 0.35,
  onPhotoReady?: () => void
): HalftoneField {
  const cacheKey = photo ? `${id}:${photo}:${focalX}:${focalY}` : `${id}:silhouette`;

  const cached = fieldCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const silhouette = generateSilhouette(id);

  if (!photo) {
    fieldCache.set(cacheKey, silhouette);
    return silhouette;
  }

  if (!pendingLoads.has(cacheKey)) {
    const loadPromise = samplePhoto(photo, focalX, focalY)
      .then((loadedField) => {
        fieldCache.set(cacheKey, loadedField);
        onPhotoReady?.();
        return loadedField;
      })
      .catch(() => {
        fieldCache.set(cacheKey, silhouette);
        onPhotoReady?.();
        return silhouette;
      });
    pendingLoads.set(cacheKey, loadPromise);
  }

  return silhouette;
}

export function computeDotRadius(
  strengthOrLum: number,
  isPhoto: boolean,
  isDarkTheme: boolean,
  rMin: number,
  rMax: number
): number {
  const mapped = isPhoto ? (isDarkTheme ? strengthOrLum : 1 - strengthOrLum) : strengthOrLum;
  const strength = Math.max(0, Math.min(1, mapped));
  return rMin + (rMax - rMin) * Math.pow(strength, 1.2);
}
