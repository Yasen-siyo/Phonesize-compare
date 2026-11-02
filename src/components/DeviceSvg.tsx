import { useId } from 'react'
import type { Device } from '../types'
import { roundedRectPath, screenSizeMm } from '../lib/geometry'

interface Props {
  device: Device
  pxPerMm: number
  /** outline: 겹쳐 보기용 반투명 외곽선 */
  variant?: 'solid' | 'outline'
  color?: string
  /** 화면 영역에 넣을 이미지 URL */
  image?: string
  /** cover: 화면을 꽉 채움(잘림), contain: 이미지 전체를 보여줌(여백) */
  imageFit?: 'cover' | 'contain'
  /** true면 가로로 눕힌 모습(기기 위쪽이 왼쪽으로) */
  landscape?: boolean
}

/** 기기 앞면을 mm 좌표로 그리고, 크기만 pxPerMm으로 맞춘다 */
export function DeviceSvg({ device: d, pxPerMm, variant = 'solid', color = 'currentColor', image, imageFit = 'cover', landscape = false }: Props) {
  const clipId = useId()
  const { width: W, height: H, cornerRadius, cornerShape } = d.body
  const s = screenSizeMm(d)
  const sx = (W - s.width) / 2
  const sy = (H - s.height) / 2
  const outline = variant === 'outline'
  // 가로 모드: 세로 좌표(x, y)를 (y, W - x)로 옮긴다. 기기 위쪽이 왼쪽으로 간다
  const rot = landscape ? `translate(0 ${W}) rotate(-90)` : undefined
  const VW = landscape ? H : W
  const VH = landscape ? W : H
  // 이미지는 기기와 함께 돌리지 않고 보는 방향 그대로 화면을 채운다
  const img = landscape
    ? { x: sy, y: sx, w: s.height, h: s.width }
    : { x: sx, y: sy, w: s.width, h: s.height }

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
  } else if (c.type === 'notch') {
    const x0 = W / 2 - c.width / 2
    const x1 = W / 2 + c.width / 2
    const r = Math.min(c.height * 0.6, c.width / 4)
    const yb = sy + c.height
    cutout = (
      <path
        d={`M${x0 - 0.6} ${sy} Q${x0} ${sy} ${x0} ${sy + 0.6} V${yb - r} Q${x0} ${yb} ${x0 + r} ${yb} H${x1 - r} Q${x1} ${yb} ${x1} ${yb - r} V${sy + 0.6} Q${x1} ${sy} ${x1 + 0.6} ${sy} Z`}
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
      width={VW * pxPerMm}
      height={VH * pxPerMm}
      viewBox={`0 0 ${VW} ${VH}`}
      role="img"
      aria-label={`${d.brand} ${d.model} 실제 크기 앞면${landscape ? ', 가로' : ''}`}
    >
      <path
        transform={rot}
        d={roundedRectPath(0.15, 0.15, W - 0.3, H - 0.3, cornerRadius, cornerShape)}
        fill={outline ? color : 'var(--device-body)'}
        fillOpacity={outline ? 0.08 : 1}
        stroke={outline ? color : 'var(--device-edge)'}
        strokeWidth={outline ? 2 : 1.5}
        vectorEffect="non-scaling-stroke"
      />
      {image && !outline && (
        <>
          <clipPath id={clipId}>
            <path d={roundedRectPath(img.x, img.y, img.w, img.h, d.screen.cornerRadius, cornerShape)} />
          </clipPath>
          <rect x={img.x} y={img.y} width={img.w} height={img.h} fill="var(--device-screen)" clipPath={`url(#${clipId})`} />
          <image
            href={image}
            x={img.x}
            y={img.y}
            width={img.w}
            height={img.h}
            preserveAspectRatio={imageFit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet'}
            clipPath={`url(#${clipId})`}
          />
        </>
      )}
      <g transform={rot}>
      <path
        d={roundedRectPath(sx, sy, s.width, s.height, d.screen.cornerRadius, cornerShape)}
        fill={outline || image ? 'none' : 'var(--device-screen)'}
        stroke={outline ? color : 'none'}
        strokeDasharray={outline ? '4 3' : undefined}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
      {cutout}
      {d.fold && (
        <line
          x1={W / 2}
          y1={0.4}
          x2={W / 2}
          y2={H - 0.4}
          stroke={outline ? color : 'var(--device-edge)'}
          strokeDasharray="3 3"
          strokeOpacity={0.7}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      )}
      </g>
    </svg>
  )
}
