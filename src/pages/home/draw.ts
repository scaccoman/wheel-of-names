import { PALETTE, SLICE_INK, colorIndexes } from './palette'
import { sliceAngles, weightsFor } from './odds'

export interface DrawInput {
  canvas: HTMLCanvasElement
  width: number
  names: string[]
  sizes: number[]
  unfair: boolean
  rotation: number
}

const cssVar = (name: string): string => {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

const fitText = (
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string => {
  if (context.measureText(text).width <= maxWidth) {
    return text
  }

  let low = 0
  let high = text.length

  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2)
    const sample = `${text.slice(0, mid).trimEnd()}…`
    if (context.measureText(sample).width <= maxWidth) {
      low = mid
    } else {
      high = mid - 1
    }
  }

  return low === 0 ? '' : `${text.slice(0, low).trimEnd()}…`
}

export const drawWheel = (input: DrawInput): void => {
  const { canvas, width, names, sizes, unfair, rotation } = input
  if (width <= 0) {
    return
  }

  const context = canvas.getContext('2d')
  if (context === null) {
    return
  }

  const ratio = window.devicePixelRatio
  const dpr = Math.min(ratio > 0 ? ratio : 1, 3)
  const pixelSize = Math.round(width * dpr)
  canvas.width = pixelSize
  canvas.height = pixelSize
  context.setTransform(1, 0, 0, 1, 0, 0)
  context.clearRect(0, 0, pixelSize, pixelSize)

  if (names.length === 0) {
    return
  }

  context.scale(dpr, dpr)
  const center = width / 2
  const rim = Math.max(6, width * 0.018)
  const radius = center - rim
  const hubRadius = width * 0.11 + 5
  const rimValue = cssVar('--wheel-rim')
  const lineValue = cssVar('--wheel-line')
  const fontValue = cssVar('--font')
  const rimColor = rimValue === '' ? '#fff' : rimValue
  const lineColor = lineValue === '' ? '#fff' : lineValue
  const font = fontValue === '' ? 'system-ui' : fontValue
  const weights = weightsFor(names, sizes, unfair)
  const angles = sliceAngles(weights)
  const colors = colorIndexes(names.length)
  const base = -Math.PI / 2 + rotation

  context.beginPath()
  context.arc(center, center, center, 0, Math.PI * 2)
  context.fillStyle = rimColor
  context.fill()

  for (let index = 0; index < names.length; index += 1) {
    const [start, end] = angles[index]
    context.beginPath()
    context.moveTo(center, center)
    context.arc(center, center, radius, base + start, base + end)
    context.closePath()
    context.fillStyle = PALETTE[colors[index]]
    context.fill()
  }

  if (names.length > 1) {
    context.strokeStyle = lineColor
    context.lineWidth = Math.max(2, width * 0.005)
    for (let index = 0; index < names.length; index += 1) {
      const angle = base + angles[index][0]
      context.beginPath()
      context.moveTo(center, center)
      context.lineTo(center + Math.cos(angle) * radius, center + Math.sin(angle) * radius)
      context.stroke()
    }
  }

  const textStart = hubRadius + 8
  const textEnd = radius - Math.max(14, width * 0.04)
  const available = textEnd - textStart
  const maxFont = Math.min(24, width * 0.052)
  const minFont = 10
  context.fillStyle = SLICE_INK
  context.textBaseline = 'middle'

  for (let index = 0; index < names.length; index += 1) {
    const [start, end] = angles[index]
    const span = end - start
    const mid = base + (start + end) / 2
    const inner = textStart + available * 0.3
    let fontSize = Math.min(maxFont, 2 * inner * Math.sin(Math.min(span, Math.PI) / 2) * 0.72)

    if (names.length === 1) {
      fontSize = maxFont
    }

    if (fontSize < minFont) {
      continue
    }

    context.font = `700 ${fontSize}px ${font}`
    if (context.measureText(names[index]).width > available && fontSize > minFont) {
      fontSize = Math.max(minFont, fontSize * 0.82)
      context.font = `700 ${fontSize}px ${font}`
    }

    const label = fitText(context, names[index], available)
    context.save()
    context.translate(center, center)
    const facesRight = Math.cos(mid) >= -1e-6
    if (facesRight) {
      context.rotate(mid)
      context.textAlign = 'right'
      context.fillText(label, textEnd, 0)
    } else {
      context.rotate(mid + Math.PI)
      context.textAlign = 'left'
      context.fillText(label, -textEnd, 0)
    }
    context.restore()
  }
}
