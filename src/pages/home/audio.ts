import { useCallback, useEffect, useState } from 'react'
import type { MutableRefObject } from 'react'

interface AudioControls {
  play: () => void
  stop: () => void
}

export const useAudio = (
  src: string,
  mutedRef: MutableRefObject<boolean>
): AudioControls => {
  const [audio] = useState(() => new Audio(src))

  const play = useCallback((): void => {
    if (mutedRef.current) {
      return
    }

    audio.currentTime = 0
    audio.play().catch(() => undefined)
  }, [audio, mutedRef])

  const stop = useCallback((): void => {
    audio.pause()
    audio.currentTime = 0
  }, [audio])

  useEffect(() => {
    return () => {
      audio.pause()
    }
  }, [audio])

  return { play, stop }
}
