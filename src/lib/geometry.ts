import type { Device } from '../types'

const MM_PER_INCH = 25.4

/** 대각선(인치)과 해상도로 화면의 가로·세로(mm)를 구한다. 픽셀이 정사각형이라고 가정 */
export function screenSizeMm(d: Device): { width: number; height: number } {
  const [px, py] = d.screen.resolutionPx
  const diagPx = Math.hypot(px, py)
  const mmPerPx = (d.screen.diagonalInch * MM_PER_INCH) / diagPx
  return { width: px * mmPerPx, height: py * mmPerPx }
}

/**
 * 둥근 사각형 경로. 'continuous'는 iOS식 연속 곡률 모서리를 근사한 것으로,
 * 곡선이 반경보다 조금 더 먼 곳(1.3r)에서 시작해 직선과 부드럽게 이어진다.
 */
export function roundedRectPath(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  shape: 'arc' | 'continuous',
): string {
  if (shape === 'arc') {
    r = Math.min(r, w / 2, h / 2)
    return [
      `M${x + r} ${y}`,
      `H${x + w - r}`,
      `A${r} ${r} 0 0 1 ${x + w} ${y + r}`,
      `V${y + h - r}`,
      `A${r} ${r} 0 0 1 ${x + w - r} ${y + h}`,
      `H${x + r}`,
      `A${r} ${r} 0 0 1 ${x} ${y + h - r}`,
      `V${y + r}`,
      `A${r} ${r} 0 0 1 ${x + r} ${y}`,
      'Z',
    ].join(' ')
  }
  const a = Math.min(r * 1.3, w / 2, h / 2)
  const k = a * 0.22 // 제어점이 꼭짓점에 가까울수록 모서리가 각져 보인다
  return [
    `M${x + a} ${y}`,
    `H${x + w - a}`,
    `C${x + w - k} ${y} ${x + w} ${y + k} ${x + w} ${y + a}`,
    `V${y + h - a}`,
    `C${x + w} ${y + h - k} ${x + w - k} ${y + h} ${x + w - a} ${y + h}`,
    `H${x + a}`,
    `C${x + k} ${y + h} ${x} ${y + h - k} ${x} ${y + h - a}`,
    `V${y + a}`,
    `C${x} ${y + k} ${x + k} ${y} ${x + a} ${y}`,
    'Z',
  ].join(' ')
}
