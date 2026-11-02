import type { Device } from '../types'

const modules = import.meta.glob<Device>('./devices/*.json', { eager: true, import: 'default' })

export const devices: Device[] = Object.values(modules).sort(
  (a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model),
)

export const deviceById = (id: string) => devices.find((d) => d.id === id)
