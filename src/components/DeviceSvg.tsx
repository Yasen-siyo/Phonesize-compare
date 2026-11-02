import type { Device } from '../types'
import { roundedRectPath, screenSizeMm } from '../lib/geometry'

interface Props {
  device: Device
  pxPerMm: number
  /** outline: 겹쳐 보기용 반투명 외곽선 */
  variant?: 'solid' | 'outline'
  color?: string
}

/** 기기 앞면을 mm 좌표로 그리고, 크기만 pxPerMm으로 맞춘다 */
export function DeviceSvg({ device: d, pxPerMm, variant = 'solid', color = 'currentColor' }: Props) {
  const { width: W, height: H, cornerRadius, cornerShape } = d.body
  const s = screenSizeMm(d)
  const sx = (W - s.width) / 2
  const sy = (H - s.height) / 2
  const outline = variant === 'outline'

  let cutout = null
  const c = d.cutout
  if (c.type === 'island') {
    cutout = (
      <rect
        x={W / 2 - c.width / 2}
        y={sy + c.top}
        width={c.width}
        height={c.height}
        rx={c.height / 2}
        fill={outline ? 'none' : '#000'}
        stroke={outline ? color : 'none'}
        vectorEffect="non-scaling-stroke"
      />
    )
  } else if (c.type === 'punchHole') {
    cutout = (
      <circle
        cx={W / 2}
        cy={sy + c.top + c.diameter / 2}
        r={c.diameter / 2}
        fill={outline ? 'none' : '#000'}
        stroke={outline ? color : 'none'}
        vectorEffect="non-scaling-stroke"
      />
    )
  } else if (c.type === 'bezelCamera') {
    const cx = c.side === 'right' ? W - sx / 2 : W / 2
    const cy = c.side === 'right' ? H / 2 : sy / 2
    cutout = (
      <circle
        cx={cx}
        cy={cy}
        r={c.diameter / 2}
        fill={outline ? 'none' : 'var(--device-screen)'}
        stroke={outline ? color : 'var(--device-edge)'}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
    )
  }

  return (
    <svg
      className="device-svg"
      width={W * pxPerMm}
      height={H * pxPerMm}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`${d.brand} ${d.model} 실제 크기 앞면`}
    >
      <path
        d={roundedRectPath(0.15, 0.15, W - 0.3, H - 0.3, cornerRadius, cornerShape)}
        fill={outline ? color : 'var(--device-body)'}
        fillOpacity={outline ? 0.08 : 1}
        stroke={outline ? color : 'var(--device-edge)'}
        strokeWidth={outline ? 2 : 1.5}
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={roundedRectPath(sx, sy, s.width, s.height, d.screen.cornerRadius, cornerShape)}
        fill={outline ? 'none' : 'var(--device-screen)'}
        stroke={outline ? color : 'none'}
        strokeDasharray={outline ? '4 3' : undefined}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
      {cutout}
    </svg>
  )
}
