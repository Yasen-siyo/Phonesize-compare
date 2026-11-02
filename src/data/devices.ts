import type { Device } from '../types'

const modules = import.meta.glob<Device>('./devices/*.json', { eager: true, import: 'default' })

export type Group = 'Apple iPhone' | 'Apple iPad' | 'Samsung Galaxy' | 'Google Pixel'

export const groupOf = (d: Device): Group =>
  d.brand === 'Apple' ? (d.id.startsWith('ipad') ? 'Apple iPad' : 'Apple iPhone') : d.brand === 'Samsung' ? 'Samsung Galaxy' : 'Google Pixel'

export const GROUPS: Group[] = ['Apple iPhone', 'Apple iPad', 'Samsung Galaxy', 'Google Pixel']

/** 그룹 안에서는 최신 모델부터, 같은 해에는 큰 기기부터 */
export const devices: Device[] = Object.values(modules).sort(
  (a, b) =>
    GROUPS.indexOf(groupOf(a)) - GROUPS.indexOf(groupOf(b)) ||
    b.releaseYear - a.releaseYear ||
    b.body.height * b.body.width - a.body.height * a.body.width,
)

export const deviceById = (id: string) => devices.find((d) => d.id === id)
