import { useEffect, useState } from 'react'
import type { Device } from '../types'
import { devices, GROUPS, groupOf } from '../data/devices'
import { DeviceSvg } from './DeviceSvg'
import { screenSizeMm } from '../lib/geometry'

export type Mode = 'side' | 'overlay'
export type Orientation = 'portrait' | 'landscape'

const COLORS = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)']

interface Props {
  pxPerMm: number
  selected: string[]
  mode: Mode
  orientation: Orientation
  onOrientation: (o: Orientation) => void
  onSelected: (ids: string[]) => void
  onMode: (m: Mode) => void
}

const fmt = (n: number) => n.toFixed(2).replace(/0$/, '')
const diff = (v: number, base: number) => {
  const d = v - base
  if (Math.abs(d) < 0.05) return '같음'
  return `${d > 0 ? '+' : '−'}${fmt(Math.abs(d))}mm (${d > 0 ? '+' : '−'}${Math.abs((d / base) * 100).toFixed(1)}%)`
}

export function Compare({ pxPerMm, selected, mode, orientation, onOrientation, onSelected, onMode }: Props) {
  const land = orientation === 'landscape'
  const [image, setImage] = useState<string | null>(null)
  const [fit, setFit] = useState<'cover' | 'contain'>('cover')
  const [query, setQuery] = useState('')
  // 한글 이름으로도 찾을 수 있게: 검색어를 낱말로 나눠 모두 들어 있는 기기만 보여준다
  const KO: Record<string, string> = {
    아이폰: 'iphone', 아이패드: 'ipad', 갤럭시: 'galaxy', 삼성: 'samsung', 픽셀: 'pixel', 구글: 'google', 애플: 'apple',
    프로: 'pro', 맥스: 'max', 울트라: 'ultra', 플러스: '+', 에어: 'air', 미니: 'mini', 듀오: 'duo', 접힘: '접힘', 펼침: '펼침',
  }
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => KO[t] ?? t)
  const hay = (d: Device) => `${d.brand} ${d.model}`.toLowerCase().replace(/plus/g, '+')
  const visible = (d: Device) =>
    !tokens.length || selected.includes(d.id) || tokens.every((t) => hay(d).replace(/\s+/g, '').includes(t.replace('plus', '+')))
  // 이미지는 이 브라우저 안에서만 쓰고 어디에도 올리지 않는다
  useEffect(() => () => {
    if (image) URL.revokeObjectURL(image)
  }, [image])

  const chosen = selected.map((id) => devices.find((d) => d.id === id)).filter(Boolean) as Device[]
  const base = chosen[0]

  const toggle = (id: string) =>
    onSelected(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id].slice(-4))

  // 화면에 그려지는 가로·세로(가로 모드면 서로 바뀜)
  const dw = (d: Device) => (land ? d.body.height : d.body.width)
  const dh = (d: Device) => (land ? d.body.width : d.body.height)
  const maxW = Math.max(0, ...chosen.map(dw))
  const maxH = Math.max(0, ...chosen.map(dh))

  return (
    <section className="compare">
      <div className="toolbar">
        <fieldset className="picker">
          <legend>비교할 기기 (최대 4개, 처음 고른 기기가 기준)</legend>
          <input
            id="device-search"
            className="search"
            type="search"
            placeholder="기기 검색 (예: 갤럭시 울트라, iPad Pro)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {GROUPS.map((g) => {
            const list = devices.filter((d) => groupOf(d) === g && visible(d))
            if (!list.length) return null
            return (
              <div key={g} className="group">
                <span className="group-name">{g}</span>
                <div className="chips">
                  {list.map((d) => (
                    <label key={d.id} className="chip">
                      <input type="checkbox" checked={selected.includes(d.id)} onChange={() => toggle(d.id)} />
                      {d.model}
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </fieldset>
        <div className="tabs" role="tablist" aria-label="보기 방식">
          <button role="tab" aria-selected={mode === 'side'} onClick={() => onMode('side')}>
            나란히
          </button>
          <button role="tab" aria-selected={mode === 'overlay'} onClick={() => onMode('overlay')}>
            겹쳐서
          </button>
        </div>
        <button
          className="secondary rotate-btn"
          onClick={() => onOrientation(land ? 'portrait' : 'landscape')}
          aria-pressed={land}
        >
          <span aria-hidden="true" className={`rotate-icon${land ? ' land' : ''}`} />
          {land ? '세로로 세우기' : '가로로 눕히기'}
        </button>
      </div>

      <div className="image-bar">
        <label className="file-btn">
          <input
            id="screen-image"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) setImage(URL.createObjectURL(f))
              e.target.value = ''
            }}
          />
          {image ? '다른 이미지 고르기' : '화면에 이미지 넣기'}
        </label>
        {image && (
          <>
            <div className="tabs" role="tablist" aria-label="이미지 맞춤 방식">
              <button role="tab" aria-selected={fit === 'cover'} onClick={() => setFit('cover')}>
                꽉 채우기
              </button>
              <button role="tab" aria-selected={fit === 'contain'} onClick={() => setFit('contain')}>
                전체 보기
              </button>
            </div>
            <button className="link" onClick={() => setImage(null)}>
              이미지 빼기
            </button>
          </>
        )}
        <span className="image-note">
          {image
            ? mode === 'overlay'
              ? '이미지는 나란히 보기에서 보입니다.'
              : '이미지는 내 브라우저에서만 쓰이고 어디에도 올라가지 않습니다.'
            : '배경화면이나 스크린샷이 각 기기 화면에서 어떻게 보이는지 확인할 수 있습니다.'}
        </span>
      </div>

      {chosen.length === 0 ? (
        <p className="empty">위에서 기기를 골라 주세요.</p>
      ) : (
        <div className="stage" tabIndex={0} aria-label="실제 크기 비교 영역">
          {mode === 'side' ? (
            <div className={`side${land ? ' land' : ''}`}>
              {chosen.map((d, i) => (
                <figure key={d.id} style={{ color: COLORS[i] }}>
                  <DeviceSvg device={d} pxPerMm={pxPerMm} image={image ?? undefined} imageFit={fit} landscape={land} />
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
                  style={{ left: ((maxW - dw(d)) / 2) * pxPerMm, top: (maxH - dh(d)) * pxPerMm }}
                >
                  <DeviceSvg device={d} pxPerMm={pxPerMm} variant="outline" color={COLORS[i]} landscape={land} />
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
