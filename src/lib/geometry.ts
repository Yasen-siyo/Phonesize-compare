import type { Device } from '../types'

const MM_PER_INCH = 25.4

/** ppi(없으면 대각선 인치)와 해상도로 화면의 가로·세로(mm)를 구한다. 픽셀이 정사각형이라고 가정 */
export function screenSizeMm(d: Device): { width: number; height: number } {
  const [px, py] = d.screen.resolutionPx
  const mmPerPx = d.screen.ppi
    ? MM_PER_INCH / d.screen.ppi
    : (d.screen.diagonalInch * MM_PER_INCH) / Math.hypot(px, py)
  return { width: px * mmPerPx, height: py * mmPerPx }
}

/** 모서리 반경: 하나면 네 모서리 모두, 배열이면 [왼쪽 위, 오른쪽 위, 오른쪽 아래, 왼쪽 아래] */
export type Radii = number | [number, number, number, number]

export const radiiArray = (r: Radii): [number, number, number, number] =>
  typeof r === 'number' ? [r, r, r, r] : r

/** 가로 모드(기기 위쪽이 왼쪽)로 돌렸을 때의 모서리 순서 */
export const rotateRadii = (r: Radii): Radii => {
  const [tl, tr, br, bl] = radiiArray(r)
  return [tr, br, bl, tl]
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
  radii: Radii,
  shape: 'arc' | 'continuous',
): string {
  const lim = Math.min(w / 2, h / 2)
  const [tl, tr, br, bl] = radiiArray(radii).map((r) =>
    shape === 'arc' ? Math.min(r, lim) : Math.min(r * 1.3, lim),
  )
  // continuous: 제어점이 꼭짓점 쪽(0.22a)에 있는 3차 곡선으로 직선과 부드럽게 잇는다
  const k = (a: number) => a * 0.22
  const parts = [`M${x + tl} ${y}`, `H${x + w - tr}`]
  if (shape === 'arc') parts.push(tr ? `A${tr} ${tr} 0 0 1 ${x + w} ${y + tr}` : '')
  else parts.push(`C${x + w - k(tr)} ${y} ${x + w} ${y + k(tr)} ${x + w} ${y + tr}`)
  parts.push(`V${y + h - br}`)
  if (shape === 'arc') parts.push(br ? `A${br} ${br} 0 0 1 ${x + w - br} ${y + h}` : '')
  else parts.push(`C${x + w} ${y + h - k(br)} ${x + w - k(br)} ${y + h} ${x + w - br} ${y + h}`)
  parts.push(`H${x + bl}`)
  if (shape === 'arc') parts.push(bl ? `A${bl} ${bl} 0 0 1 ${x} ${y + h - bl}` : '')
  else parts.push(`C${x + k(bl)} ${y + h} ${x} ${y + h - k(bl)} ${x} ${y + h - bl}`)
  parts.push(`V${y + tl}`)
  if (shape === 'arc') parts.push(tl ? `A${tl} ${tl} 0 0 1 ${x + tl} ${y}` : '')
  else parts.push(`C${x} ${y + k(tl)} ${x + k(tl)} ${y} ${x + tl} ${y}`)
  parts.push('Z')
  return parts.filter(Boolean).join(' ')
}
