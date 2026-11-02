import { useEffect, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { Device } from '../types'
import { CARD_MM, COIN_500_MM } from '../lib/calibration'
import { detectDevice, estimatePxPerMm } from '../lib/detect'
import { devices } from '../data/devices'

type Method = 'card' | 'coin' | 'ruler'

interface Props {
  initial: number
  onDone: (pxPerMm: number) => void
  onCancel?: () => void
}

const MIN = 1.5
const MAX = 14

export function Calibrate({ initial, onDone, onCancel }: Props) {
  const [ppm, setPpm] = useState(initial)
  const [method, setMethod] = useState<Method>('card')
  const [rulerMm, setRulerMm] = useState(100)
  const [detected, setDetected] = useState<Device | null>(null)

  useEffect(() => {
    detectDevice(devices).then(setDetected)
  }, [])

  const clamp = (v: number) => Math.min(MAX, Math.max(MIN, v))
  const nudge = (ratio: number) => setPpm((p) => clamp(p * ratio))

  /** 기준 물체의 오른쪽 끝을 끌어서 맞춘다. 폭이 refMm × ppm이므로 dx px만큼 끌면 ppm은 dx/refMm만큼 변한다 */
  const startDrag = (refMm: number) => (e: ReactPointerEvent<HTMLElement>) => {
    e.preventDefault()
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    const x0 = e.clientX
    const p0 = ppm
    const move = (ev: PointerEvent) => setPpm(clamp(p0 + (ev.clientX - x0) / refMm))
    const end = () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', end)
      el.removeEventListener('pointercancel', end)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', end)
    el.addEventListener('pointercancel', end)
  }

  const handle = (refMm: number) => (
    <span className="drag-handle" onPointerDown={startDrag(refMm)} aria-hidden="true" title="끌어서 크기 맞추기" />
  )

  return (
    <section className="calibrate">
      <h1>화면 크기 맞추기</h1>
      <p className="lead">
        화면마다 1mm의 크기가 달라서, 실제 물건과 한 번 맞춰야 기기를 실물 크기로 보여줄 수 있습니다.
        브라우저 확대는 100%로 두고 진행하세요.
      </p>

      <div className="tabs" role="tablist">
        {(
          [
            ['card', '카드'],
            ['coin', '500원 동전'],
            ['ruler', '자'],
          ] as const
        ).map(([m, label]) => (
          <button key={m} role="tab" aria-selected={method === m} onClick={() => setMethod(m)}>
            {label}
          </button>
        ))}
      </div>

      <p className="hint">
        {method === 'card' &&
          '신용카드·체크카드·교통카드를 아래 상자의 왼쪽 위 모서리에 맞춰 대고, 오른쪽 끝의 손잡이를 끌거나 아래 슬라이더로 카드 끝과 같아지게 조절하세요. 맞춘 뒤 세로 길이도 같은지 확인하세요.'}
        {method === 'coin' &&
          '500원 동전을 원 위에 올려 두고, 원이 동전과 똑같아지도록 조절하세요. 동전은 작아서 카드보다 오차가 커질 수 있습니다.'}
        {method === 'ruler' && '자를 눈금 막대 아래에 대고 0과 끝 눈금이 자의 눈금과 맞도록 조절하세요.'}
      </p>

      {detected && (
        <p className="detected">
          이 기기는 <b>{detected.model}</b>(으)로 보입니다.{' '}
          <button className="link" onClick={() => setPpm(estimatePxPerMm(detected))}>
            추정값으로 맞추기
          </button>{' '}
          (같은 화면 크기의 다른 모델일 수 있으니 카드로 확인하세요)
        </p>
      )}

      <div className="calib-stage">
        {method === 'card' && (
          <div
            className="ref-card"
            style={{
              width: CARD_MM.width * ppm,
              height: CARD_MM.height * ppm,
              borderRadius: CARD_MM.radius * ppm,
            }}
          >
            <span>85.60 × 53.98 mm</span>
            {handle(CARD_MM.width)}
          </div>
        )}
        {method === 'coin' && (
          <div className="ref-coin" style={{ width: COIN_500_MM * ppm, height: COIN_500_MM * ppm }}>
            <span>500</span>
            {handle(COIN_500_MM)}
          </div>
        )}
        {method === 'ruler' && (
          <div>
            <div className="ruler-wrap" style={{ width: rulerMm * ppm + 2 }}>
            <svg width={rulerMm * ppm + 2} height={44} className="ref-ruler" aria-label={`${rulerMm}mm 눈금`}>
              {Array.from({ length: rulerMm + 1 }, (_, i) => (
                <line
                  key={i}
                  x1={1 + i * ppm}
                  x2={1 + i * ppm}
                  y1={0}
                  y2={i % 10 === 0 ? 28 : i % 5 === 0 ? 20 : 12}
                  stroke="currentColor"
                  strokeWidth={1}
                />
              ))}
              {Array.from({ length: Math.floor(rulerMm / 10) + 1 }, (_, i) => (
                <text key={i} x={1 + i * 10 * ppm} y={42} fontSize={11} textAnchor="middle" fill="currentColor">
                  {i}
                </text>
              ))}
            </svg>
            {handle(rulerMm)}
            </div>
            <label className="ruler-len">
              눈금 길이
              <select value={rulerMm} onChange={(e) => setRulerMm(Number(e.target.value))}>
                {[50, 100, 150, 200].map((v) => (
                  <option key={v} value={v}>
                    {v / 10}cm
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>

      <div className="dock">
      <div className="controls">
        <button onClick={() => nudge(1 / 1.01)} aria-label="크게 줄이기">−−</button>
        <button onClick={() => nudge(1 / 1.002)} aria-label="조금 줄이기">−</button>
        <input
          type="range"
          min={MIN}
          max={MAX}
          step={0.001}
          value={ppm}
          onChange={(e) => setPpm(Number(e.target.value))}
          aria-label="크기 조절"
        />
        <button onClick={() => nudge(1.002)} aria-label="조금 키우기">+</button>
        <button onClick={() => nudge(1.01)} aria-label="크게 키우기">++</button>
      </div>
      <p className="readout">
        1mm = {ppm.toFixed(3)} CSS px · 약 {(ppm * 25.4 * window.devicePixelRatio).toFixed(0)} PPI(물리 픽셀 기준)
      </p>

      <div className="actions">
        {onCancel && (
          <button className="secondary" onClick={onCancel}>
            취소
          </button>
        )}
        <button className="primary" onClick={() => onDone(ppm)}>
          이 크기로 저장
        </button>
      </div>
      </div>
    </section>
  )
}
