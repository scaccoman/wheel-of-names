const audioPlays = { count: 0 }
const mediaState: Record<string, boolean> = {}

class MockAudio {
  currentTime = 0

  play (): Promise<void> {
    audioPlays.count += 1
    return Promise.resolve()
  }

  pause (): void {}

  addEventListener (): void {}

  removeEventListener (): void {}
}

window.Audio = MockAudio as unknown as typeof Audio
;(window as unknown as { __audioPlays: { count: number } }).__audioPlays = audioPlays
;(window as unknown as { __media: Record<string, boolean> }).__media = mediaState

class ResizeObserverMock {
  observe (): void {}

  unobserve (): void {}

  disconnect (): void {}
}

window.ResizeObserver = ResizeObserverMock

window.matchMedia = (query: string): MediaQueryList => {
  return {
    get matches () {
      return mediaState[query] ?? false
    },
    media: query,
    onchange: null,
    addEventListener () {},
    removeEventListener () {},
    addListener () {},
    removeListener () {},
    dispatchEvent () {
      return false
    }
  } as MediaQueryList
}

window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
  return window.setTimeout(() => {
    callback(performance.now() + 20000)
  }, 0) as unknown as number
}

window.cancelAnimationFrame = (id: number): void => {
  window.clearTimeout(id)
}

const clipboardWrites: string[] = []
const writeText = (text: string): Promise<void> => {
  clipboardWrites.push(text)
  return Promise.resolve()
}
;(window as unknown as { __writes: string[] }).__writes = clipboardWrites

Object.defineProperty(navigator, 'clipboard', {
  configurable: true,
  value: {
    writeText
  }
})

const canvasContext = new Proxy({} as CanvasRenderingContext2D, {
  get (_target, property) {
    if (property === 'measureText') {
      return () => ({ width: 0 })
    }

    return () => undefined
  }
})

const getContext = (): CanvasRenderingContext2D => canvasContext
HTMLCanvasElement.prototype.getContext = getContext as unknown as typeof HTMLCanvasElement.prototype.getContext
