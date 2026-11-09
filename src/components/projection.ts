export type Point = readonly [number, number];
export type Quad = readonly [Point, Point, Point, Point];
/** Homography maps all four photographed corners, including perspective, into one planar surface. */
export function projectiveMatrix(from: Quad, to: Quad) {
  const equations: number[][] = [];
  from.forEach(([x, y], i) => {
    const [u, v] = to[i];
    equations.push(
      [x, y, 1, 0, 0, 0, -u * x, -u * y, u],
      [0, 0, 0, x, y, 1, -v * x, -v * y, v],
    );
  });
  for (let c = 0; c < 8; c++) {
    let pivot = c;
    for (let r = c + 1; r < 8; r++)
      if (Math.abs(equations[r][c]) > Math.abs(equations[pivot][c])) pivot = r;
    [equations[c], equations[pivot]] = [equations[pivot], equations[c]];
    const divisor = equations[c][c];
    if (Math.abs(divisor) < 1e-10) throw Error("Degenerate panel projection");
    for (let k = c; k < 9; k++) equations[c][k] /= divisor;
    for (let r = 0; r < 8; r++) {
      if (r === c) continue;
      const factor = equations[r][c];
      for (let k = c; k < 9; k++) equations[r][k] -= factor * equations[c][k];
    }
  }
  const [a, b, c, d, e, f, g, h] = equations.map((row) => row[8]);
  return [a, d, 0, g, b, e, 0, h, 0, 0, 1, 0, c, f, 0, 1];
}
export function scaledQuad(quad: Quad, scale: number): Quad {
  return quad.map(([x, y]) => [x * scale, y * scale]) as unknown as Quad;
}
