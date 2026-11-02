/** 모든 길이 단위는 mm. */
export type Confidence = 'official' | 'measured' | 'estimated'

export type Cutout =
  | { type: 'none' }
  /** 다이나믹 아일랜드 같은 알약형. 화면 위쪽 가장자리에서 top만큼 떨어진 중앙에 위치 */
  | { type: 'island'; width: number; height: number; top: number }
  /** 펀치홀 카메라(원형) */
  | { type: 'punchHole'; diameter: number; top: number }
  /** 화면 위쪽 가장자리에 붙은 노치 */
  | { type: 'notch'; width: number; height: number }
  /** 베젤에 있는 카메라(태블릿). 세로로 든 기준 위쪽(top) 또는 오른쪽(right) 베젤의 가운데 */
  | { type: 'bezelCamera'; diameter: number; side: 'top' | 'right' }

export interface Device {
  id: string
  brand: string
  model: string
  releaseYear: number
  body: {
    width: number
    height: number
    depth: number
    cornerRadius: number
    cornerShape: 'arc' | 'continuous'
  }
  screen: {
    diagonalInch: number
    resolutionPx: [number, number] // [가로, 세로]
    /** 제조사 공시 ppi. 있으면 대각선(반올림된 값)보다 우선해 화면 크기를 계산한다 */
    ppi?: number
    cornerRadius: number
  }
  cutout: Cutout
  /** 필드 경로 → 신뢰도. 적혀 있지 않은 필드는 estimated로 본다 */
  confidence: Record<string, Confidence>
  sources: string[]
  /** 폴더블을 펼친 상태: 가운데 접힘선을 그린다 */
  fold?: boolean
  /** 방문자 기기 자동 추정용 단서 */
  detect?: {
    /** Android Client Hints의 model 값에 포함되는 문자열 */
    uaModels?: string[]
    /** iOS 등: 세로 방향 screen.width, screen.height(CSS px)와 devicePixelRatio */
    cssViewport?: [number, number, number]
  }
}
