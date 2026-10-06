import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from 'react'
import ConfettiExplosion from 'react-confetti-explosion'

import { countLabel } from './format'
import { drawWheel } from './draw'

export interface WheelHandle {
  draw: (rotation: number) => void
  wobble: () => void
}

interface WheelCanvasProps {
  names: string[]
  sizes: number[]
  unfair: boolean
  rotation: number
  spinning: boolean
  themeKey: string
  exploding: boolean
  onSpin: () => void
  onConfettiDone: () => void
}

const WheelCanvas = forwardRef<WheelHandle, WheelCanvasProps>((props, ref) => {
  const {
    names,
    sizes,
    unfair,
    rotation,
    spinning,
    themeKey,
    exploding,
    onSpin,
    onConfettiDone
  } = props
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointerRef = useRef<SVGSVGElement>(null)
  const rotationRef = useRef(rotation)
  const dataRef = useRef({ names, sizes, unfair })
  dataRef.current = { names, sizes, unfair }

  const paint = (): void => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (canvas === null || wrap === null) {
      return
    }

    drawWheel({
      canvas,
      width: wrap.clientWidth,
      names: dataRef.current.names,
      sizes: dataRef.current.sizes,
      unfair: dataRef.current.unfair,
      rotation: rotationRef.current
    })
  }

  useImperativeHandle(ref, () => ({
    draw (next: number) {
      rotationRef.current = next
      paint()
    },
    wobble () {
      const pointer = pointerRef.current
      if (pointer === null) {
        return
      }

      pointer.classList.remove('tick')
      if (pointer.getBoundingClientRect().width >= 0) {
        pointer.classList.add('tick')
      }
    }
  }))

  useLayoutEffect(() => {
    rotationRef.current = rotation
    paint()
    const wrap = wrapRef.current
    if (wrap === null) {
      return
    }

    const observer = new ResizeObserver(() => {
      paint()
    })
    observer.observe(wrap)
    return () => {
      observer.disconnect()
    }
  }, [names, sizes, unfair, rotation, themeKey])

  const empty = names.length === 0
  const wheelLabel = spinning
    ? 'Skip to the result'
    : empty
      ? 'Wheel is empty. Add names first'
      : `Spin the wheel, ${names.length} names`

  return (
    <div className="wheel-wrap" ref={wrapRef}>
      <svg className="pointer" ref={pointerRef} viewBox="0 -8 34 50" aria-hidden="true">
        <path d="M17 41 3.5 14.5A15 15 0 1 1 30.5 14.5Z" />
        <circle cx="17" cy="13" r="5" />
      </svg>
      <button
        className="wheel-btn"
        id="wheel-btn"
        type="button"
        aria-describedby="spin-hint"
        aria-disabled={empty}
        aria-label={wheelLabel}
        onClick={onSpin}
      >
        <canvas
          className="wheel-canvas"
          ref={canvasRef}
          aria-hidden="true"
          style={{ visibility: empty ? 'hidden' : undefined }}
        />
      </button>
      <div className="hub" aria-hidden="true" style={{ visibility: empty ? 'hidden' : undefined }}>
        <div>
          <b id="hub-label">{spinning ? 'SKIP' : 'SPIN'}</b>
          <span id="hub-count">{empty ? '' : countLabel(names.length)}</span>
        </div>
      </div>
      <div className="wheel-empty" hidden={!empty}>
        <div>
          <strong>No names yet</strong>
          Add at least one name to spin the wheel.
        </div>
      </div>
      {exploding && (
        <div className="confetti">
          <ConfettiExplosion
            onComplete={onConfettiDone}
            duration={5000}
            particleSize={12}
            particleCount={200}
            force={1}
            width={4000}
            zIndex={9999}
          />
        </div>
      )}
    </div>
  )
})

WheelCanvas.displayName = 'WheelCanvas'

export default WheelCanvas
