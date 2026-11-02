import { useCallback, useEffect, useState } from 'react'
import { Calibrate } from './components/Calibrate'
import { Compare, type Mode } from './components/Compare'
import { devices } from './data/devices'
import {
  CSS_NOMINAL_PX_PER_MM,
  clearCalibration,
  loadCalibration,
  saveCalibration,
  type LoadedCalibration,
} from './lib/calibration'

const DEFAULT_IDS = ['iphone-18-pro-max', 'galaxy-s25-ultra']

function readUrl(): { ids: string[]; mode: Mode } {
  const p = new URLSearchParams(location.search)
  const ids = (p.get('d') ?? '')
    .split(',')
    .filter((id) => devices.some((d) => d.id === id))
  return {
    ids: ids.length ? ids : DEFAULT_IDS,
    mode: p.get('mode') === 'overlay' ? 'overlay' : 'side',
  }
}

export default function App() {
  const [cal, setCal] = useState<LoadedCalibration>(() => loadCalibration())
  const [calibrating, setCalibrating] = useState(() => loadCalibration().status === 'none')
  const [{ ids, mode }, setView] = useState(readUrl)
  const [pinchZoomed, setPinchZoomed] = useState(false)

  // 브라우저 확대 배율(devicePixelRatio) 변화 감지
  useEffect(() => {
    let mq: MediaQueryList
    const listen = () => {
      mq = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
      mq.addEventListener('change', onChange, { once: true })
    }
    const onChange = () => {
      setCal(loadCalibration())
      listen()
    }
    listen()
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // 모바일 핀치 확대 감지
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const check = () => setPinchZoomed(Math.abs(vv.scale - 1) > 0.02)
    check()
    vv.addEventListener('resize', check)
    return () => vv.removeEventListener('resize', check)
  }, [])

  // 선택 상태를 URL에 반영(공유용)
  useEffect(() => {
    const p = new URLSearchParams()
    if (ids.length) p.set('d', ids.join(','))
    if (mode !== 'side') p.set('mode', mode)
    history.replaceState(null, '', `${location.pathname}?${p}`)
  }, [ids, mode])

  const done = useCallback((ppm: number) => {
    saveCalibration(ppm)
    setCal({ status: 'ok', pxPerMm: ppm })
    setCalibrating(false)
  }, [])

  const pxPerMm = cal.status === 'none' ? CSS_NOMINAL_PX_PER_MM : cal.pxPerMm

  return (
    <div className="app">
      <header className="top">
        <span className="brand">실제 크기 폰 비교</span>
        {!calibrating && (
          <button className="secondary" onClick={() => setCalibrating(true)}>
            화면 다시 맞추기
          </button>
        )}
      </header>

      {pinchZoomed && <p className="banner warn">화면이 확대되어 있습니다. 두 손가락으로 원래 크기로 줄여야 실제 크기로 보입니다.</p>}
      {!calibrating && cal.status === 'zoomAdjusted' && (
        <p className="banner">브라우저 확대 배율이 바뀌어 크기를 자동으로 환산했습니다. 어긋나 보이면 다시 맞춰 주세요.</p>
      )}
      {!calibrating && cal.status === 'otherScreen' && (
        <p className="banner warn">
          보정했을 때와 다른 화면으로 보입니다.{' '}
          <button className="link" onClick={() => setCalibrating(true)}>
            다시 맞추기
          </button>
        </p>
      )}
      {!calibrating && cal.status === 'none' && (
        <p className="banner warn">
          아직 화면을 맞추지 않아 크기가 대략적입니다.{' '}
          <button className="link" onClick={() => setCalibrating(true)}>
            지금 맞추기
          </button>
        </p>
      )}

      <main>
        {calibrating ? (
          <Calibrate
            initial={pxPerMm}
            onDone={done}
            onCancel={() => setCalibrating(false)}
          />
        ) : (
          <Compare
            pxPerMm={pxPerMm}
            selected={ids}
            mode={mode}
            onSelected={(next) => setView((v) => ({ ...v, ids: next }))}
            onMode={(m) => setView((v) => ({ ...v, mode: m }))}
          />
        )}
      </main>

      <footer>
        <button
          className="link"
          onClick={() => {
            clearCalibration()
            setCal({ status: 'none' })
            setCalibrating(true)
          }}
        >
          보정값 지우기
        </button>
      </footer>
    </div>
  )
}
