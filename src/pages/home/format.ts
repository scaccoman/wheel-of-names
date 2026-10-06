import { MAX_NAME_LENGTH } from './constants'

export const splitNames = (text: string): string[] => {
  return text
    .split(/[\n,]/)
    .map((part) => part.trim().slice(0, MAX_NAME_LENGTH))
    .filter((part) => part !== '')
}

export const short = (value: string, max = 22): string => {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

export const countLabel = (count: number): string => {
  return `${count} ${count === 1 ? 'name' : 'names'}`
}
