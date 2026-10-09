/** 分数从 0 到 100，色相从红过渡到绿。 */
export function scoreColor(score: number): string {
  const clamped = Math.min(100, Math.max(0, score));
  const hue = Math.round((clamped / 100) * 120);
  return `hsl(${hue} 70% 45%)`;
}
