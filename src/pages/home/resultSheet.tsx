import { useEffect, useRef, useState } from 'react'

import { Icon } from './icons'

export interface SheetResult {
  name: string
  fill: string
  subtitle: string
  message: string
  removeLabel: string
  showRemove: boolean
}

interface ResultSheetProps {
  open: boolean
  result: SheetResult | null
  restoreFocus: boolean
  onClose: () => void
  onRemoveSpin: () => void
  onSpinAgain: () => void
  onCopyName: () => void
  onCopyMessage: () => void
}

const ResultSheet = ({
  open,
  result,
  restoreFocus,
  onClose,
  onRemoveSpin,
  onSpinAgain,
  onCopyName,
  onCopyMessage
}: ResultSheetProps): JSX.Element | null => {
  const [present, setPresent] = useState(open)
  const [shown, setShown] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const primaryRef = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const wasOpen = useRef(false)

  if (open && !present) {
    setPresent(true)
  }

  useEffect(() => {
    if (!open) {
      setShown(false)
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const id = window.setTimeout(() => {
        setPresent(false)
      }, reduce ? 0 : 260)
      return () => {
        window.clearTimeout(id)
      }
    }

    const frame = window.requestAnimationFrame(() => {
      setShown(true)
    })
    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      wasOpen.current = true
      returnFocus.current = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
      return
    }

    if (!wasOpen.current) {
      return
    }

    wasOpen.current = false
    if (restoreFocus) {
      returnFocus.current?.focus({ preventScroll: true })
    }
  }, [open, restoreFocus])

  useEffect(() => {
    if (!shown) {
      return
    }

    const id = window.setTimeout(() => {
      primaryRef.current?.focus({ preventScroll: true })
    }, 30)
    return () => {
      window.clearTimeout(id)
    }
  }, [shown])

  useEffect(() => {
    if (!open) {
      return
    }

    const trap = (event: KeyboardEvent): void => {
      if (event.key !== 'Tab') {
        return
      }

      const root = sheetRef.current
      if (root === null) {
        return
      }

      const buttons = [...root.querySelectorAll<HTMLButtonElement>('button:not([hidden]):not([disabled])')]
      const visible = buttons.filter((button) => button.offsetParent !== null)
      if (visible.length === 0) {
        return
      }

      const first = visible[0]
      const last = visible[visible.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', trap)
    return () => {
      document.removeEventListener('keydown', trap)
    }
  }, [open])

  if (result === null) {
    return null
  }

  return (
    <>
      <button
        className={shown ? 'scrim is-open' : 'scrim'}
        type="button"
        tabIndex={-1}
        aria-label="Close"
        hidden={!present}
        onClick={onClose}
      />
      <div
        className={shown ? 'sheet is-open' : 'sheet'}
        id="sheet"
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-over"
        aria-describedby="result-sub"
        hidden={!present}
      >
        <div className="sheet-grip" aria-hidden="true" />
        <button className="icon-btn sheet-close" id="sheet-close" type="button" aria-label="Close" onClick={onClose}>
          <Icon name="x" />
        </button>
        <div className="result">
          <p className="result-over" id="result-over">Congratulations!</p>
          <div className="result-name" id="result-name" style={{ background: result.fill }}>
            {result.name}
          </div>
          <p className="result-sub" id="result-sub">{result.subtitle}</p>
          <div className="result-actions">
            {result.showRemove && (
              <button
                className="btn btn-primary"
                id="remove-spin-btn"
                type="button"
                ref={primaryRef}
                onClick={onRemoveSpin}
              >
                <Icon name="spin" />
                <span>{result.removeLabel}</span>
              </button>
            )}
            <button
              className={result.showRemove ? 'btn btn-secondary' : 'btn btn-primary'}
              id="again-btn"
              type="button"
              ref={result.showRemove ? undefined : primaryRef}
              onClick={onSpinAgain}
            >
              <Icon name="spin" />
              Spin again
            </button>
            <div className="result-copy">
              <button className="btn btn-quiet" id="copy-name-btn" type="button" onClick={onCopyName}>
                <Icon name="copy" />
                Copy name
              </button>
              <button
                className="btn btn-quiet"
                id="copy-msg-btn"
                type="button"
                aria-describedby="copy-preview"
                onClick={onCopyMessage}
              >
                <Icon name="copy" />
                Copy message
              </button>
            </div>
            <p className="copy-preview" id="copy-preview">{result.message}</p>
          </div>
        </div>
      </div>
    </>
  )
}

export default ResultSheet
