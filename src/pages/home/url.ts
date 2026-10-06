import { DEFAULT_NAMES } from './constants'

export const randSize = (): number => {
  const size = Math.floor(100 * Math.random())
  return size === 0 ? 1 : size
}

export const wheelSearch = (names: string[], unfair: boolean): string => {
  const list = names.map((name) => encodeURIComponent(name)).join(',')
  return `?names=${list}${unfair ? '&unfairMode=true' : ''}`
}

export const pageBase = (): string => {
  return `${window.location.protocol}//${window.location.host}${window.location.pathname}`
}

export const wheelURL = (names: string[], unfair: boolean): string => {
  return `${pageBase()}${wheelSearch(names, unfair)}`
}

export const readURL = (): { names: string[], unfair: boolean, sizes: number[] } => {
  const params = new URLSearchParams(window.location.search)
  const raw = params.get('names')
  const names = raw === null
    ? DEFAULT_NAMES.slice()
    : raw.split(',').map((part) => part.trim()).filter((part) => part !== '')

  return {
    names,
    unfair: Boolean(params.get('unfairMode')),
    sizes: names.map(() => randSize())
  }
}

export const writeURL = (names: string[], unfair: boolean): void => {
  const next = `${window.location.pathname}${wheelSearch(names, unfair)}`
  window.history.replaceState({}, '', next)
}
