/**
 * Computes the zero-based slot indexes at which a bag boundary separator should
 * be drawn within a queue of `queueLength` slots. The current bag has
 * `bagRemaining` pieces remaining (each drawn piece that appears in the queue
 * counts toward the boundary), and every subsequent bag contributes 7 pieces.
 *
 * Returns only boundary positions that fall strictly inside the visible queue
 * (i.e. greater than 0 and less than `queueLength`).
 */
export function getBagBoundaryPositions(
  queueLength: number,
  bagRemaining: number
): number[] {
  if (bagRemaining < 1 || queueLength < 2) return [];
  const positions: number[] = [];
  for (let boundary = bagRemaining; boundary < queueLength; boundary += 7) {
    positions.push(boundary);
  }
  return positions;
}