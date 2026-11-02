/**
 * 보정값 pxPerMm(화면의 1mm가 몇 CSS px인지)을 저장·복원한다.
 * 브라우저 확대(Ctrl +/-)는 devicePixelRatio를 바꾸므로, 저장한 dpr과 비교해 환산한다.
 */
export const CARD_MM = { width: 85.6, height: 53.98, radius: 3.18 }
export const COIN_500_MM = 26.5
/** CSS 명목값(1in = 96px). 보정 전 초깃값으로만 쓴다 */
export const CSS_NOMINAL_PX_PER_MM = 96 / 25.4

interface Stored {
  pxPerMm: number
  dpr: number
  screenW: number
  screenH: number
  at: string
}

const KEY = 'drs.calibration.v1'

function read(): Stored | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Stored) : null
  } catch {
    return null
  }
}

export function saveCalibration(pxPerMm: number) {
  const s: Stored = {
    pxPerMm,
    dpr: window.devicePixelRatio,
    screenW: screen.width,
    screenH: screen.height,
    at: new Date().toISOString(),
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* 저장이 막혀도 이번 방문에서는 동작한다 */
  }
}

export function clearCalibration() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* noop */
  }
}

export type LoadedCalibration =
  | { status: 'none' }
  | { status: 'ok'; pxPerMm: number }
  /** 확대 배율만 바뀐 경우: 환산값을 쓰되 알려준다 */
  | { status: 'zoomAdjusted'; pxPerMm: number }
  /** 다른 화면으로 보인다: 재보정 권장 */
  | { status: 'otherScreen'; pxPerMm: number }

export function loadCalibration(): LoadedCalibration {
  const s = read()
  if (!s) return { status: 'none' }
  const sameScreenRatio =
    Math.abs(s.screenW * s.dpr - screen.width * window.devicePixelRatio) < 2 &&
    Math.abs(s.screenH * s.dpr - screen.height * window.devicePixelRatio) < 2
  const dprChanged = Math.abs(s.dpr - window.devicePixelRatio) > 0.001
  if (!dprChanged && s.screenW === screen.width && s.screenH === screen.height) {
    return { status: 'ok', pxPerMm: s.pxPerMm }
  }
  // 물리 픽셀 수가 같으면 같은 모니터에서 확대만 바뀐 것: 물리 px/mm은 그대로이므로 환산
  const adjusted = (s.pxPerMm * s.dpr) / window.devicePixelRatio
  if (sameScreenRatio) return { status: 'zoomAdjusted', pxPerMm: adjusted }
  return { status: 'otherScreen', pxPerMm: adjusted }
}
