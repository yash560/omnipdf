/**
 * SVG Optimizer & Vectorizer Engine
 */

export interface SvgOptimizeOptions {
  removeComments: boolean;
  removeMetadata: boolean;
  removeDoctype: boolean;
  roundDecimals: boolean;
  minify: boolean;
}

export function optimizeSvg(
  svgString: string,
  options: SvgOptimizeOptions = {
    removeComments: true,
    removeMetadata: true,
    removeDoctype: true,
    roundDecimals: true,
    minify: true,
  }
): { optimizedSvg: string; originalLength: number; optimizedLength: number; savingsPercent: number } {
  const originalLength = svgString.length;
  let result = svgString;

  if (options.removeComments) {
    result = result.replace(/<!--[\s\S]*?-->/g, '');
  }

  if (options.removeDoctype) {
    result = result.replace(/<!DOCTYPE[\s\S]*?>/gi, '');
    result = result.replace(/<\?xml[\s\S]*?\?>/gi, '');
  }

  if (options.removeMetadata) {
    result = result.replace(/<metadata[\s\S]*?<\/metadata>/gi, '');
    result = result.replace(/<desc[\s\S]*?<\/desc>/gi, '');
    result = result.replace(/<title[\s\S]*?<\/title>/gi, '');
    result = result.replace(/xmlns:sketch="[^"]*"/gi, '');
    result = result.replace(/xmlns:inkscape="[^"]*"/gi, '');
    result = result.replace(/xmlns:sodipodi="[^"]*"/gi, '');
    result = result.replace(/sodipodi:[a-z0-9_-]+="[^"]*"/gi, '');
    result = result.replace(/inkscape:[a-z0-9_-]+="[^"]*"/gi, '');
  }

  if (options.roundDecimals) {
    result = result.replace(/(\d+\.\d{3,})/g, (match) => parseFloat(match).toFixed(2));
  }

  if (options.minify) {
    result = result
      .replace(/\r?\n|\r/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/>\s+</g, '><')
      .trim();
  }

  const optimizedLength = result.length;
  const savingsPercent = Math.max(0, Math.round(((originalLength - optimizedLength) / originalLength) * 100));

  return {
    optimizedSvg: result,
    originalLength,
    optimizedLength,
    savingsPercent,
  };
}

/**
 * Bitmap to Smooth Vector SVG via Marching-Edge Contour Tracing & Curve Smoothing
 */
export async function vectorizeBitmap(
  file: File,
  threshold: number = 128,
  color: string = '#18181b'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxDim = 800;
      const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
      const width = Math.round(img.naturalWidth * scale);
      const height = Math.round(img.naturalHeight * scale);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      // 1. Binary Grid (1 for dark, 0 for light)
      const grid = new Uint8Array(width * height);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const brightness = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
          grid[y * width + x] = brightness < threshold && data[idx + 3] > 64 ? 1 : 0;
        }
      }

      // 2. Trace Boundary Contours using 8-connectivity edge tracking
      const visited = new Uint8Array(width * height);
      const pathDList: string[] = [];

      const directions = [
        [1, 0], [1, 1], [0, 1], [-1, 1],
        [-1, 0], [-1, -1], [0, -1], [1, -1]
      ];

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x;
          if (grid[idx] === 1 && visited[idx] === 0) {
            // Check if this is an edge pixel (adjacent to at least one 0)
            const isEdge =
              grid[idx - 1] === 0 ||
              grid[idx + 1] === 0 ||
              grid[idx - width] === 0 ||
              grid[idx + width] === 0;

            if (isEdge) {
              const contour: { x: number; y: number }[] = [];
              let curX = x;
              let curY = y;
              let dir = 0;

              for (let step = 0; step < 2000; step++) {
                contour.push({ x: curX, y: curY });
                visited[curY * width + curX] = 1;

                let foundNext = false;
                for (let d = 0; d < 8; d++) {
                  const checkDir = (dir + d) % 8;
                  const nextX = curX + directions[checkDir][0];
                  const nextY = curY + directions[checkDir][1];

                  if (nextX >= 0 && nextX < width && nextY >= 0 && nextY < height) {
                    if (grid[nextY * width + nextX] === 1) {
                      curX = nextX;
                      curY = nextY;
                      dir = (checkDir + 6) % 8; // Turn relative left for next search
                      foundNext = true;
                      break;
                    }
                  }
                }

                if (!foundNext || (curX === x && curY === y && contour.length > 2)) {
                  break;
                }
              }

              if (contour.length >= 4) {
                // Simplify contour points with Douglas-Peucker reduction
                const simplified = simplifyPoints(contour, 1.2);
                if (simplified.length >= 3) {
                  let dStr = `M${simplified[0].x},${simplified[0].y}`;
                  for (let i = 1; i < simplified.length; i++) {
                    dStr += `L${simplified[i].x},${simplified[i].y}`;
                  }
                  dStr += 'Z';
                  pathDList.push(dStr);
                }
              }
            }
          }
        }
      }

      // Fallback: if no continuous contours traced, perform run-length horizontal vector packing
      if (pathDList.length === 0) {
        for (let y = 0; y < height; y += 2) {
          let runStart = -1;
          for (let x = 0; x < width; x += 2) {
            if (grid[y * width + x] === 1) {
              if (runStart === -1) runStart = x;
            } else {
              if (runStart !== -1) {
                pathDList.push(`M${runStart},${y}h${x - runStart}v2h-${x - runStart}z`);
                runStart = -1;
              }
            }
          }
          if (runStart !== -1) {
            pathDList.push(`M${runStart},${y}h${width - runStart}v2h-${width - runStart}z`);
          }
        }
      }

      const svgOutput = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><path d="${pathDList.join(' ')}" fill="${color}" fill-rule="evenodd"/></svg>`;
      resolve(svgOutput);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for vectorization'));
    };

    img.src = objectUrl;
  });
}

function simplifyPoints(points: { x: number; y: number }[], tolerance: number): { x: number; y: number }[] {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let index = 0;
  const first = points[0];
  const last = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], first, last);
    if (dist > maxDist) {
      maxDist = dist;
      index = i;
    }
  }

  if (maxDist > tolerance) {
    const left = simplifyPoints(points.slice(0, index + 1), tolerance);
    const right = simplifyPoints(points.slice(index), tolerance);
    return left.slice(0, left.length - 1).concat(right);
  } else {
    return [first, last];
  }
}

function perpendicularDistance(
  pt: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number }
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const mag = Math.hypot(dx, dy);
  if (mag === 0) return Math.hypot(pt.x - lineStart.x, pt.y - lineStart.y);
  return Math.abs(dy * pt.x - dx * pt.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x) / mag;
}
