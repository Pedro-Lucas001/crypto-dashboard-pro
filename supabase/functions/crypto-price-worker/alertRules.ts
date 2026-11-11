export function thresholdReached(
  direction: "above" | "below",
  observed: number,
  target: number,
): boolean {
  if (!Number.isFinite(observed) || observed <= 0 || !Number.isFinite(target) || target <= 0) return false;
  return direction === "above" ? observed >= target : observed <= target;
}
