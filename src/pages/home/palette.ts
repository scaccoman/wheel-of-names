export const PALETTE = [
  '#FF9B85',
  '#6FD3C6',
  '#FFD45C',
  '#B9A6FF',
  '#FFBE7A',
  '#8EC5FF',
  '#FF9FCB',
  '#9FDB7A'
]

export const SLICE_INK = '#17171C'

export const colorIndexes = (count: number): number[] => {
  const indexes: number[] = []

  for (let i = 0; i < count; i += 1) {
    let color = i % PALETTE.length

    if (count > 1 && i === count - 1 && color === indexes[0]) {
      for (const candidate of [2, 3, 4, 5, 6, 1, 7]) {
        if (candidate !== indexes[i - 1] && candidate !== indexes[0]) {
          color = candidate
          break
        }
      }
    }

    indexes.push(color)
  }

  return indexes
}

export const fillAt = (index: number, count: number): string => {
  return PALETTE[colorIndexes(count)[index]]
}
