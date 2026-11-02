import type { Device } from '../types'
import { screenSizeMm } from './geometry'

interface UADataLike {
  getHighEntropyValues(hints: string[]): Promise<{ model?: string }>
}

/** 방문자 기기를 데이터에서 찾아본다. 못 찾으면 null */
export async function detectDevice(devices: Device[]): Promise<Device | null> {
  const uaData = (navigator as Navigator & { userAgentData?: UADataLike }).userAgentData
  if (uaData?.getHighEntropyValues) {
    try {
      const { model } = await uaData.getHighEntropyValues(['model'])
      if (model) {
        // Samsung은 모델 코드 접두사(SM-S948 등), 그 밖에는 이름이 정확히 같아야 한다(Pixel 11 / Pixel 11 Pro 구분)
        const hit = devices.find((d) =>
          d.detect?.uaModels?.some((m) => (m.startsWith('SM-') ? model.startsWith(m) : model === m)),
        )
        if (hit) return hit
      }
    } catch {
      /* 권한 없음 등: 다음 방법으로 */
    }
  }
  const w = Math.min(screen.width, screen.height)
  const h = Math.max(screen.width, screen.height)
  const dpr = window.devicePixelRatio
  return (
    devices.find((d) => {
      const v = d.detect?.cssViewport
      return v && v[0] === w && v[1] === h && Math.abs(v[2] - dpr) < 0.01
    }) ?? null
  )
}

/** 기기 화면 전체가 CSS 화면 폭과 같다고 보고 pxPerMm을 추정한다 */
export function estimatePxPerMm(d: Device): number {
  const w = Math.min(screen.width, screen.height)
  const s = screenSizeMm(d)
  return w / Math.min(s.width, s.height)
}
