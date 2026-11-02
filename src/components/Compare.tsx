import type { Device } from '../types'
import { devices } from '../data/devices'
import { DeviceSvg } from './DeviceSvg'
import { screenSizeMm } from '../lib/geometry'

export type Mode = 'side' | 'overlay'

const COLORS = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)']

interface Props {
  pxPerMm: number
  selected: string[]
  mode: Mode
  onSelected: (ids: string[]) => void
  onMode: (m: Mode) => void
}

const fmt = (n: number) => n.toFixed(2).replace(/0$/, '')
const diff = (v: number, base: number) => {
  const d = v - base
  if (Math.abs(d) < 0.05) return '같음'
  return `${d > 0 ? '+' : '−'}${fmt(Math.abs(d))}mm (${d > 0 ? '+' : '−'}${Math.abs((d / base) * 100).toFixed(1)}%)`
}

export function Compare({ pxPerMm, selected, mode, onSelected, onMode }: Props) {
  const chosen = selected.map((id) => devices.find((d) => d.id === id)).filter(Boolean) as Device[]
  const base = chosen[0]

  const toggle = (id: string) =>
    onSelected(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id].slice(-4))

  const maxW = Math.max(0, ...chosen.map((d) => d.body.width))
  const maxH = Math.max(0, ...chosen.map((d) => d.body.height))

  return (
    <section className="compare">
      <div className="toolbar">
        <fieldset className="picker">
          <legend>비교할 기기 (최대 4개, 처음 고른 기기가 기준)</legend>
          {devices.map((d) => (
            <label key={d.id} className="chip">
              <input type="checkbox" checked={selected.includes(d.id)} onChange={() => toggle(d.id)} />
              {d.model}
            </label>
          ))}
        </fieldset>
        <div className="tabs" role="tablist" aria-label="보기 방식">
          <button role="tab" aria-selected={mode === 'side'} onClick={() => onMode('side')}>
            나란히
          </button>
          <button role="tab" aria-selected={mode === 'overlay'} onClick={() => onMode('overlay')}>
            겹쳐서
          </button>
        </div>
      </div>

      {chosen.length === 0 ? (
        <p className="empty">위에서 기기를 골라 주세요.</p>
      ) : (
        <div className="stage" tabIndex={0} aria-label="실제 크기 비교 영역">
          {mode === 'side' ? (
            <div className="side">
              {chosen.map((d, i) => (
                <figure key={d.id} style={{ color: COLORS[i] }}>
                  <DeviceSvg device={d} pxPerMm={pxPerMm} />
                  <figcaption>{d.model}</figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <div className="overlay" style={{ width: maxW * pxPerMm, height: maxH * pxPerMm }}>
              {chosen.map((d, i) => (
                <div
                  key={d.id}
                  className="layer"
                  style={{ left: ((maxW - d.body.width) / 2) * pxPerMm, top: (maxH - d.body.height) * pxPerMm }}
                >
                  <DeviceSvg device={d} pxPerMm={pxPerMm} variant="outline" color={COLORS[i]} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {chosen.length > 0 && (
        <table className="specs">
          <thead>
            <tr>
              <th>기기</th>
              <th>세로</th>
              <th>가로</th>
              <th>두께</th>
              <th>화면</th>
            </tr>
          </thead>
          <tbody>
            {chosen.map((d, i) => {
              const s = screenSizeMm(d)
              return (
                <tr key={d.id}>
                  <th scope="row">
                    <span className="swatch" style={{ background: COLORS[i] }} />
                    {d.model}
                  </th>
                  <td>
                    {fmt(d.body.height)}mm
                    {i > 0 && <small>{diff(d.body.height, base.body.height)}</small>}
                  </td>
                  <td>
                    {fmt(d.body.width)}mm
                    {i > 0 && <small>{diff(d.body.width, base.body.width)}</small>}
                  </td>
                  <td>
                    {fmt(d.body.depth)}mm
                    {i > 0 && <small>{diff(d.body.depth, base.body.depth)}</small>}
                  </td>
                  <td>
                    {d.screen.diagonalInch}″<small>{fmt(s.width)} × {fmt(s.height)}mm</small>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
      <p className="note">
        본체 크기·두께·화면 대각선은 제조사 공식값, 모서리 반경과 카메라 구멍 크기·위치는 추정값입니다. 실제 폰을 화면 위
        그림에 대 보면 크기를 바로 비교할 수 있습니다.
      </p>
    </section>
  )
}
