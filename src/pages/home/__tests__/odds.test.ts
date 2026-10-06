/**
 * @jest-environment jsdom
 */

import { EDGE_MARGIN } from '../constants'
import { hostMessage } from '../message'
import {
  centreFirst,
  chances,
  indexAtPointer,
  localAtPointer,
  pickIndex,
  planSpin,
  sliceAngles,
  weightsFor
} from '../odds'
import { colorIndexes } from '../palette'

const erfc = (value: number): number => {
  const t = 1 / (1 + 0.5 * Math.abs(value))
  const y = t * Math.exp(
    -value * value -
    1.26551223 +
    t * (1.00002368 +
      t * (0.37409196 +
        t * (0.09678418 +
          t * (-0.18628806 +
            t * (0.27886807 +
              t * (-1.13520398 +
                t * (1.48851587 +
                  t * (-0.82215223 + t * 0.17087277))))))))
  )
  return value >= 0 ? y : 2 - y
}

describe('winner odds', () => {
  const samples = 100000

  const check = (names: string[], unfair: boolean, sizes?: number[]): void => {
    const weights = weightsFor(names, sizes ?? names.map(() => 1), unfair)
    const expected = chances(weights)
    const angles = sliceAngles(weights)
    const counts = new Array<number>(expected.length).fill(0)
    let mismatch = 0
    let edge = 0
    let rotation = 0.4

    for (let sample = 0; sample < samples; sample += 1) {
      const planned = planSpin(rotation, 5, weights)
      counts[planned.winner] += 1
      if (indexAtPointer(planned.to, weights) !== planned.winner) {
        mismatch += 1
      }
      const local = localAtPointer(planned.to)
      const [start, end] = angles[planned.winner]
      const margin = (end - start) * EDGE_MARGIN - 1e-9
      if (local - start < margin || end - local < margin) {
        edge += 1
      }
      rotation = planned.to % (2 * Math.PI)
    }

    let chi = 0
    let worst = 0
    expected.forEach((probability, index) => {
      const mean = probability * samples
      const observed = counts[index]
      chi += ((observed - mean) ** 2) / mean
      const z = Math.abs(observed - mean) / Math.sqrt(samples * probability * (1 - probability))
      worst = Math.max(worst, z)
    })

    const degrees = expected.length - 1
    const wh = ((chi / degrees) ** (1 / 3) - (1 - 2 / (9 * degrees))) / Math.sqrt(2 / (9 * degrees))
    const pValue = 0.5 * erfc(wh / Math.SQRT2)

    expect(mismatch).toBe(0)
    expect(edge).toBe(0)
    expect(worst).toBeLessThan(5)
    expect(pValue).toBeGreaterThan(0.001)
  }

  it('keeps a fair wheel uniform', () => {
    check(['john', 'mario', 'willy', 'frank', 'anna', 'joe'], false)
    check('abcdefghijklm'.split(''), false)
  })

  it('weights an unfair wheel by slice size', () => {
    check(['a', 'b', 'c', 'd', 'e', 'f'], true, [1, 5, 12, 30, 52, 99])
    check('pqrstuvwxy'.split(''), true, [4, 8, 15, 16, 23, 42, 7, 11, 19, 3])
  })

  it('picks by cumulative weight', () => {
    expect(pickIndex([1, 3], 0)).toBe(0)
    expect(pickIndex([1, 3], 0.2)).toBe(0)
    expect(pickIndex([1, 3], 0.3)).toBe(1)
    expect(pickIndex([1, 1, 1], 0.999)).toBe(2)
  })

  it('starts with the first slice under the pointer', () => {
    const weights = [1, 1, 1, 1]
    const rotation = centreFirst(weights)
    const [start, end] = sliceAngles(weights)[0]
    expect(localAtPointer(rotation)).toBeCloseTo((start + end) / 2)
  })
})

describe('slice colours', () => {
  it('gives neighbouring slices different colours', () => {
    for (let count = 2; count <= 30; count += 1) {
      const colors = colorIndexes(count)
      for (let index = 0; index < count; index += 1) {
        expect(colors[index]).not.toBe(colors[(index + 1) % count])
      }
    }
  })
})

describe('host message', () => {
  const base = 'https://wheel.scaccoman.com/'

  it('keeps the host note and drops the winner from the next link', () => {
    expect(hostMessage(['ada', 'grace', 'lin'], 0, false, base)).toBe(
      '@ada will be the next host!\nNew wheel: https://wheel.scaccoman.com/?names=grace,lin'
    )
  })

  it('uses the two-name note', () => {
    expect(hostMessage(['ada', 'grace'], 0, false, base)).toBe(
      "@ada will be the next host!\nThe day after tomorrow's winner is grace\nNew wheel: https://wheel.scaccoman.com/?names="
    )
  })

  it('keeps unfair mode on the next link and encodes odd characters', () => {
    expect(hostMessage(['a&b', 'c d', 'e'], 1, true, base)).toBe(
      '@c d will be the next host!\nNew wheel: https://wheel.scaccoman.com/?names=a%26b,e&unfairMode=true'
    )
  })
})
