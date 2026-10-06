import { EDGE_MARGIN } from './constants'

export const weightsFor = (
  names: string[],
  sizes: number[],
  unfair: boolean
): number[] => {
  if (!unfair) {
    return names.map(() => 1)
  }

  return names.map((_, index) => {
    const size = sizes[index]
    return size > 0 ? size : 1
  })
}

export const pickIndex = (weights: number[], random = Math.random()): number => {
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  let cursor = random * total

  for (let index = 0; index < weights.length; index += 1) {
    cursor -= weights[index]
    if (cursor < 0) {
      return index
    }
  }

  return weights.length - 1
}

export const chances = (weights: number[]): number[] => {
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  return weights.map((weight) => weight / total)
}

export const pct = (chance: number): string => {
  return chance < 0.01 ? '<1%' : `${Math.round(chance * 100)}%`
}

export const sliceAngles = (weights: number[]): Array<[number, number]> => {
  if (weights.length === 0) {
    return []
  }

  const total = weights.reduce((sum, weight) => sum + weight, 0)
  let covered = 0

  return weights.map((weight) => {
    const start = (covered / total) * Math.PI * 2
    covered += weight
    return [start, (covered / total) * Math.PI * 2]
  })
}

export const landingAngle = (
  span: [number, number],
  random = Math.random()
): number => {
  const [start, end] = span
  return start + (end - start) * (EDGE_MARGIN + (1 - 2 * EDGE_MARGIN) * random)
}

export const planSpin = (
  rotation: number,
  turns: number,
  weights: number[],
  pickRandom = Math.random(),
  landRandom = Math.random()
): { winner: number, to: number } => {
  const angles = sliceAngles(weights)
  const winner = pickIndex(weights, pickRandom)
  const target = landingAngle(angles[winner], landRandom)
  const delta = (((-target - rotation) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)

  return {
    winner,
    to: rotation + turns * 2 * Math.PI + delta
  }
}

export const localAtPointer = (rotation: number): number => {
  return ((-rotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
}

export const indexAtPointer = (rotation: number, weights: number[]): number => {
  const local = localAtPointer(rotation)
  return sliceAngles(weights).findIndex(([start, end]) => local >= start && local < end)
}

export const centreFirst = (weights: number[]): number => {
  const first = sliceAngles(weights)[0]
  if (first === undefined) {
    return 0
  }

  return -((first[0] + first[1]) / 2)
}
