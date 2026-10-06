// Rose-diagram helpers ported unchanged from the F2 prototype.

// Counts each strike and its opposite direction (strike + 180°) into 10° bins.
export function binStrikes(strikes, binSize = 10) {
  const nBins = 360 / binSize;
  const bins = Array.from({ length: nBins }, (_, i) => ({ angle: i * binSize, v: 0 }));
  strikes.forEach((s) => {
    [s, s + 180].forEach((a) => {
      const norm = ((a % 360) + 360) % 360;
      const idx = Math.floor(norm / binSize);
      bins[idx].v += 1;
    });
  });
  return bins;
}

// Reconstructed lobe (NOT data): Gaussian around a strike axis and its opposite.
export function gaussianLobe({ centerDeg, spreadDeg, peak, floor = 0, binSize = 10 }) {
  const nBins = 360 / binSize;
  return Array.from({ length: nBins }, (_, i) => {
    const angle = i * binSize;
    const d1 = Math.min(Math.abs(angle - centerDeg), 360 - Math.abs(angle - centerDeg));
    const d2 = Math.min(Math.abs(angle - (centerDeg + 180)), 360 - Math.abs(angle - (centerDeg + 180)));
    const d = Math.min(d1, d2);
    const v = peak * Math.exp(-(d * d) / (2 * spreadDeg * spreadDeg)) + floor;
    return { angle, v };
  });
}

export function polarToXY(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
