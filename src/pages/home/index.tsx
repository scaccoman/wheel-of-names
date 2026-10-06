import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import classNames from 'classnames'

import { CLASS_NAME } from './const'
import { type HomeProps } from './types'
import { propTypes, defaultProps } from './props'
import { useAudio } from './audio'
import { useMedia } from './useMedia'
import {
  COPY_PROMPT_DELAY_MS,
  DEFAULT_NAMES,
  REDUCED_SHEET_DELAY_MS,
  REDUCED_SPIN_MS,
  REDUCED_SPIN_TURNS,
  SHEET_DELAY_MS,
  SPIN_MS,
  SPIN_TURNS,
  TOAST_ACTION_MS,
  TOAST_MS
} from './constants'
import { countLabel, short } from './format'
import { hostMessage } from './message'
import { centreFirst, chances, indexAtPointer, pct, planSpin, weightsFor } from './odds'
import { PALETTE, colorIndexes, fillAt } from './palette'
import { pageBase, randSize, readURL, wheelURL, writeURL } from './url'
import { BrandMark, Icon, IconSprite } from './icons'
import WheelCanvas from './wheelCanvas'
import type { WheelHandle } from './wheelCanvas'
import NamesCard from './namesCard'
import UnfairCard from './unfairCard'
import ResultSheet from './resultSheet'
import type { SheetResult } from './resultSheet'

import buttonClickMp3 from './button-click.mp3'
import spinWheelMp3 from './spin-wheel.mp3'
import crowdCheeringMp3 from './crowd-cheering.mp3'
import copyMeMp3 from './copy-me.mp3'
import congratulationsMp3 from './congratulations-deep-voice.mp3'
import './style.scss'

interface Snapshot {
  names: string[]
  sizes: number[]
  unfair: boolean
  winner: number
}

interface Anim {
  from: number
  to: number
  t0: number
  dur: number
  reduce: boolean
  weights: number[]
}

interface ToastState {
  text: string
  undo?: () => void
}

interface ActionBag {
  spin: () => void
  skip: () => void
  toggleMute: () => void
  closeSheet: () => void
  sheetOpen: boolean
  spinning: boolean
}

const easeOut = (progress: number): number => 1 - (1 - progress) ** 4

const prefersReduced = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const savedTheme = (): 'light' | 'dark' | null => {
  const value = localStorage.getItem('wheel.theme')
  return value === 'light' || value === 'dark' ? value : null
}

interface SpinButtonProps {
  id: string
  hidden: boolean
  spinning: boolean
  empty: boolean
  onSpin: () => void
}

const SpinButton = ({
  id,
  hidden,
  spinning,
  empty,
  onSpin
}: SpinButtonProps): JSX.Element => {
  const label = spinning
    ? 'Skip to the result'
    : empty
      ? 'Spin, add a name first'
      : 'Spin the wheel'

  return (
    <button
      id={id}
      type="button"
      className={spinning ? 'btn btn-primary btn-spin is-skip' : 'btn btn-primary btn-spin'}
      aria-disabled={empty}
      aria-label={label}
      hidden={hidden}
      onClick={onSpin}
    >
      <Icon name={spinning ? 'skip' : 'spin'} />
      <span>{spinning ? 'Skip' : 'Spin'}</span>
    </button>
  )
}

const Home: React.FC<HomeProps> = (props: HomeProps) => {
  const { className } = props
  const initial = useState(readURL)[0]
  const initialRotation = centreFirst(weightsFor(initial.names, initial.sizes, initial.unfair))

  const [names, setNames] = useState(initial.names)
  const [sizes, setSizes] = useState(initial.sizes)
  const [unfair, setUnfair] = useState(initial.unfair)
  const [rotation, setRotation] = useState(initialRotation)
  const [spinning, setSpinning] = useState(false)
  const [exploding, setExploding] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [restoreFocus, setRestoreFocus] = useState(true)
  const [result, setResult] = useState<SheetResult | null>(null)
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [muted, setMuted] = useState(() => localStorage.getItem('wheel.muted') === '1')
  const [theme, setTheme] = useState<'light' | 'dark' | null>(savedTheme)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [live, setLive] = useState('')
  const [highlight, setHighlight] = useState<{ from: number, only: boolean } | null>(null)

  const wide = useMedia('(min-width: 900px)')
  const touch = useMedia('(hover: none)')
  const osDark = useMedia('(prefers-color-scheme: dark)')

  const mutedRef = useRef(muted)
  mutedRef.current = muted
  const namesRef = useRef(names)
  const sizesRef = useRef(sizes)
  const unfairRef = useRef(unfair)
  const spinningRef = useRef(spinning)
  const rotationRef = useRef(initialRotation)
  const winnerRef = useRef(0)
  const copiedRef = useRef(false)
  const animRef = useRef<Anim | null>(null)
  const wheelRef = useRef<WheelHandle>(null)
  const timeouts = useRef<number[]>([])
  const toastTimer = useRef(0)
  const actions = useRef<ActionBag>({
    spin () {},
    skip () {},
    toggleMute () {},
    closeSheet () {},
    sheetOpen: false,
    spinning: false
  })

  namesRef.current = names
  sizesRef.current = sizes
  unfairRef.current = unfair
  spinningRef.current = spinning

  const clickSound = useAudio(buttonClickMp3, mutedRef)
  const wheelAudio = useAudio(spinWheelMp3, mutedRef)
  const crowdAudio = useAudio(crowdCheeringMp3, mutedRef)
  const copyAudio = useAudio(copyMeMp3, mutedRef)
  const congratulationsAudio = useAudio(congratulationsMp3, mutedRef)

  const onConfettiDone = useCallback((): void => {
    setExploding(false)
  }, [])

  const later = (delay: number, fn: () => void): void => {
    const id = window.setTimeout(fn, delay)
    timeouts.current.push(id)
  }

  const clearLaters = (): void => {
    timeouts.current.forEach((id) => {
      window.clearTimeout(id)
    })
    timeouts.current = []
  }

  const announce = (text: string): void => {
    setLive('')
    later(30, () => {
      setLive(text)
    })
  }

  const showToast = (text: string, undo?: () => void): void => {
    setToast(undo === undefined ? { text } : { text, undo })
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => {
      setToast(null)
    }, undo === undefined ? TOAST_MS : TOAST_ACTION_MS)
  }

  const stopSounds = (): void => {
    clickSound.stop()
    wheelAudio.stop()
    crowdAudio.stop()
    copyAudio.stop()
    congratulationsAudio.stop()
  }

  const updateLists = (nextNames: string[], nextSizes: number[], nextUnfair: boolean): void => {
    namesRef.current = nextNames
    sizesRef.current = nextSizes
    unfairRef.current = nextUnfair
    setNames(nextNames)
    setSizes(nextSizes)
    setUnfair(nextUnfair)
    if (!spinningRef.current) {
      const nextRotation = centreFirst(weightsFor(nextNames, nextSizes, nextUnfair))
      rotationRef.current = nextRotation
      setRotation(nextRotation)
    }
  }

  const closeSheet = (silent = false): void => {
    setRestoreFocus(!silent)
    setSheetOpen(false)
  }

  const openResult = (next: Snapshot): void => {
    const winnerName = next.names[next.winner]
    if (winnerName === undefined) {
      return
    }

    const weights = weightsFor(next.names, next.sizes, next.unfair)
    const chance = chances(weights)[next.winner] ?? 0
    copiedRef.current = false
    setSnapshot(next)
    setResult({
      name: winnerName,
      fill: fillAt(next.winner, next.names.length),
      subtitle: next.unfair ? `is the winner! (${pct(chance)} chance)` : 'is the winner!',
      message: hostMessage(next.names, next.winner, next.unfair, pageBase()),
      removeLabel: `Remove ${short(winnerName, 16)} & spin again`,
      showRemove: next.names.length >= 2
    })
    setRestoreFocus(true)
    setSheetOpen(true)
  }

  const finish = (): void => {
    const anim = animRef.current
    const reduce = anim?.reduce ?? prefersReduced()
    animRef.current = null
    const landed = ((rotationRef.current % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
    rotationRef.current = landed
    setRotation(landed)
    setSpinning(false)
    spinningRef.current = false

    const list = namesRef.current
    const winner = winnerRef.current
    const winnerName = list[winner]
    if (winnerName === undefined) {
      return
    }

    announce(`${winnerName} is the winner!`)
    wheelAudio.stop()
    crowdAudio.play()
    if (!reduce) {
      setExploding(true)
    }

    const next = {
      names: list.slice(),
      sizes: sizesRef.current.slice(),
      unfair: unfairRef.current,
      winner
    }
    later(reduce ? REDUCED_SHEET_DELAY_MS : SHEET_DELAY_MS, () => {
      openResult(next)
      later(COPY_PROMPT_DELAY_MS, () => {
        if (!copiedRef.current) {
          copyAudio.play()
        }
      })
    })
  }

  const skip = (): void => {
    const anim = animRef.current
    if (anim === null) {
      return
    }

    anim.t0 = performance.now() - anim.dur
  }

  const spin = (): void => {
    if (animRef.current !== null) {
      skip()
      return
    }

    const list = namesRef.current
    if (list.length === 0) {
      announce('Add at least one name to spin.')
      document.getElementById('add-input')?.focus()
      return
    }

    clearLaters()
    closeSheet(true)
    copiedRef.current = false
    wheelAudio.stop()
    crowdAudio.stop()
    copyAudio.stop()
    wheelAudio.play()

    const reduce = prefersReduced()
    const from = rotationRef.current
    const weights = weightsFor(list, sizesRef.current, unfairRef.current)
    const planned = planSpin(from, reduce ? REDUCED_SPIN_TURNS : SPIN_TURNS, weights)
    winnerRef.current = planned.winner
    setSpinning(true)
    spinningRef.current = true
    announce('Spinning…')

    const anim = {
      from,
      to: planned.to,
      t0: performance.now(),
      dur: reduce ? REDUCED_SPIN_MS : SPIN_MS,
      reduce,
      weights
    }
    animRef.current = anim
    let last = indexAtPointer(from, weights)

    const step = (now: number): void => {
      const current = animRef.current
      if (current === null) {
        return
      }

      const progress = Math.min(1, (now - current.t0) / current.dur)
      const angle = current.from + (current.to - current.from) * easeOut(progress)
      rotationRef.current = angle
      wheelRef.current?.draw(angle)
      const under = indexAtPointer(angle, current.weights)
      if (under !== last) {
        last = under
        if (!current.reduce) {
          wheelRef.current?.wobble()
        }
      }

      if (progress < 1) {
        window.requestAnimationFrame(step)
        return
      }

      finish()
    }

    window.requestAnimationFrame(step)
  }

  const toggleMute = (): void => {
    const next = !mutedRef.current
    mutedRef.current = next
    setMuted(next)
    localStorage.setItem('wheel.muted', next ? '1' : '0')
    if (next) {
      stopSounds()
    }
    showToast(next ? 'Sound off' : 'Sound on')
  }

  const toggleTheme = (): void => {
    const dark = theme === 'dark' || (theme === null && osDark)
    const next = dark ? 'light' : 'dark'
    localStorage.setItem('wheel.theme', next)
    setTheme(next)
  }

  const writeClipboard = (text: string, okMessage: string, withSound: boolean): void => {
    if (withSound) {
      copiedRef.current = true
      copyAudio.stop()
      congratulationsAudio.play()
    }

    const write = navigator.clipboard?.writeText.bind(navigator.clipboard)
    if (write === undefined) {
      showToast('Couldn\'t copy. Select and copy the text instead.')
      return
    }

    write(text).then(() => {
      showToast(okMessage)
    }).catch(() => {
      showToast('Couldn\'t copy. Select and copy the text instead.')
    })
  }

  actions.current = {
    spin,
    skip,
    toggleMute,
    closeSheet: () => {
      closeSheet(false)
    },
    sheetOpen,
    spinning
  }

  useEffect(() => {
    writeURL(names, unfair)
  }, [names, unfair])

  useEffect(() => {
    document.body.dataset.unfair = unfair ? 'true' : 'false'
    document.title = `${unfair ? 'Unfair ' : ''}Wheel of Names`
  }, [unfair])

  useEffect(() => {
    if (spinning) {
      document.body.dataset.spinning = 'true'
      return
    }

    delete document.body.dataset.spinning
  }, [spinning])

  useEffect(() => {
    document.body.classList.toggle('is-locked', sheetOpen)
  }, [sheetOpen])

  useLayoutEffectTheme(theme, osDark)

  useEffect(() => {
    if (highlight === null) {
      return
    }

    const id = window.setTimeout(() => {
      setHighlight(null)
    }, 420)
    return () => {
      window.clearTimeout(id)
    }
  }, [highlight])

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        if (actions.current.sheetOpen) {
          actions.current.closeSheet()
          return
        }
        if (actions.current.spinning) {
          actions.current.skip()
        }
        return
      }

      const target = event.target
      const typing = target instanceof Element &&
        target.closest('input, textarea, [contenteditable]') !== null
      if (typing || event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      if (event.key === 'm' || event.key === 'M') {
        actions.current.toggleMute()
        return
      }

      const onPage = event.target === document.body || event.target === document.documentElement
      if ((event.key === ' ' || event.key === 'Enter') && onPage && !actions.current.sheetOpen) {
        event.preventDefault()
        actions.current.spin()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  useEffect(() => {
    return () => {
      timeouts.current.forEach((id) => {
        window.clearTimeout(id)
      })
      window.clearTimeout(toastTimer.current)
      delete document.body.dataset.spinning
      delete document.body.dataset.unfair
      document.body.classList.remove('is-locked')
    }
  }, [])

  const weights = weightsFor(names, sizes, unfair)
  const fills = colorIndexes(names.length).map((index) => PALETTE[index])
  const chanceLabels = unfair ? chances(weights).map((chance) => pct(chance)) : null
  const dark = theme === 'dark' || (theme === null && osDark)
  const title = `${unfair ? 'Unfair ' : ''}Wheel of Names`
  const empty = names.length === 0

  let hint: JSX.Element | string = ''
  if (spinning) {
    hint = touch
      ? 'Spinning… tap the wheel or Skip to jump to the result.'
      : 'Spinning… press Space or Esc to skip.'
  } else if (!empty && touch) {
    hint = 'Tap the wheel or the Spin button'
  } else if (!empty) {
    hint = (
      <>
        Click the wheel or press <kbd>Space</kbd> to spin · <kbd>M</kbd> mutes
      </>
    )
  }

  return (
    <div className={classNames(CLASS_NAME, className)}>
      <a className="skip-link" href="#names-card">Skip to names</a>
      <IconSprite />
      <header className="app-header">
        <div className="brand">
          <BrandMark />
          <h1 className="app-title" id="app-title">{title}</h1>
          <span className="unfair-badge" aria-hidden="true">Unfair</span>
        </div>
        <button
          className="icon-btn"
          id="share-btn"
          type="button"
          aria-label="Copy link to this wheel"
          title="Copy link to this wheel"
          onClick={() => {
            writeClipboard(wheelURL(names, unfair), 'Link copied. Anyone with it gets this list.', false)
          }}
        >
          <Icon name="link" />
        </button>
        <button
          className="icon-btn"
          id="theme-btn"
          type="button"
          aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
          title="Theme"
          onClick={toggleTheme}
        >
          <Icon name={dark ? 'sun' : 'moon'} />
        </button>
        <button
          className="icon-btn"
          id="mute-btn"
          type="button"
          aria-pressed={muted}
          aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
          title="Sound (M)"
          onClick={toggleMute}
        >
          <Icon name={muted ? 'mute' : 'sound'} />
        </button>
      </header>
      <main className="layout" id="main">
        <section className="stage" aria-label="Wheel">
          <WheelCanvas
            ref={wheelRef}
            names={names}
            sizes={sizes}
            unfair={unfair}
            rotation={rotation}
            spinning={spinning}
            themeKey={`${theme ?? 'system'}-${dark ? 'dark' : 'light'}`}
            exploding={exploding}
            onSpin={spin}
            onConfettiDone={onConfettiDone}
          />
          <div className="spin-row">
            <SpinButton
              id="spin-btn"
              hidden={!wide}
              spinning={spinning}
              empty={empty}
              onSpin={spin}
            />
            <p className="hint" id="spin-hint">{hint}</p>
          </div>
        </section>
        <aside className="panel">
          <NamesCard
            names={names}
            fills={fills}
            chances={chanceLabels}
            spinning={spinning}
            highlight={highlight}
            onAdd={(list) => {
              setHighlight({ from: namesRef.current.length, only: false })
              updateLists(
                [...namesRef.current, ...list],
                [...sizesRef.current, ...list.map(() => randSize())],
                unfairRef.current
              )
            }}
            onPasteMany={(count) => {
              showToast(`Added ${count} names`)
            }}
            onRemove={(index) => {
              const removed = namesRef.current[index]
              const removedSize = sizesRef.current[index]
              if (removed === undefined || removedSize === undefined) {
                return
              }
              updateLists(
                namesRef.current.filter((_, item) => item !== index),
                sizesRef.current.filter((_, item) => item !== index),
                unfairRef.current
              )
              showToast(`Removed "${short(removed)}"`, () => {
                const restoredNames = namesRef.current.slice()
                const restoredSizes = sizesRef.current.slice()
                restoredNames.splice(index, 0, removed)
                restoredSizes.splice(index, 0, removedSize)
                setHighlight({ from: index, only: true })
                updateLists(restoredNames, restoredSizes, unfairRef.current)
              })
            }}
            onShuffle={() => {
              const currentNames = namesRef.current
              const currentSizes = sizesRef.current
              const order = currentNames.map((_, index) => index)
              for (let index = order.length - 1; index > 0; index -= 1) {
                const swap = Math.floor(Math.random() * (index + 1))
                const held = order[index]
                order[index] = order[swap]
                order[swap] = held
              }
              updateLists(
                order.map((index) => currentNames[index]),
                order.map((index) => currentSizes[index]),
                unfairRef.current
              )
              showToast('Names shuffled')
            }}
            onClear={() => {
              const previousNames = namesRef.current.slice()
              const previousSizes = sizesRef.current.slice()
              updateLists([], [], unfairRef.current)
              showToast('List cleared', () => {
                updateLists(previousNames, previousSizes, unfairRef.current)
              })
            }}
            onUseExamples={() => {
              const list = DEFAULT_NAMES.slice()
              setHighlight({ from: namesRef.current.length, only: false })
              updateLists(
                [...namesRef.current, ...list],
                [...sizesRef.current, ...list.map(() => randSize())],
                unfairRef.current
              )
            }}
            onSaveList={(list) => {
              const previous = new Map(
                namesRef.current.map((name, index) => [name, sizesRef.current[index]])
              )
              updateLists(
                list,
                list.map((name) => {
                  const size = previous.get(name)
                  return size !== undefined && size > 0 ? size : randSize()
                }),
                unfairRef.current
              )
              showToast(`Saved ${countLabel(list.length)}`)
            }}
          />
          <UnfairCard
            unfair={unfair}
            spinning={spinning}
            canReroll={names.length > 0}
            onToggle={() => {
              if (spinningRef.current) {
                return
              }
              const next = !unfairRef.current
              clickSound.play()
              updateLists(
                namesRef.current,
                next ? namesRef.current.map(() => randSize()) : sizesRef.current,
                next
              )
            }}
            onReroll={() => {
              updateLists(namesRef.current, namesRef.current.map(() => randSize()), true)
              showToast('New slice sizes and odds')
            }}
          />
          <p className="footer-note">
            No ads, no accounts. The list lives in the link you share.{' '}
            <a href="https://github.com/scaccoman" target="_blank" rel="noopener noreferrer">Made by scaccoman</a>
          </p>
        </aside>
      </main>
      <div className="spin-dock" id="spin-dock">
        <SpinButton
          id="spin-btn-dock"
          hidden={wide}
          spinning={spinning}
          empty={empty}
          onSpin={spin}
        />
      </div>
      <ResultSheet
        open={sheetOpen}
        result={result}
        restoreFocus={restoreFocus}
        onClose={() => {
          closeSheet(false)
        }}
        onSpinAgain={() => {
          closeSheet(true)
          spin()
        }}
        onRemoveSpin={() => {
          if (snapshot === null) {
            return
          }
          const winnerName = snapshot.names[snapshot.winner]
          if (winnerName === undefined) {
            return
          }
          const keep = snapshot.names.map((name) => {
            return name.toLocaleLowerCase() !== winnerName.toLocaleLowerCase()
          })
          showToast(`Removed "${short(winnerName)}"`)
          closeSheet(true)
          updateLists(
            snapshot.names.filter((_, index) => keep[index]),
            snapshot.sizes.filter((_, index) => keep[index]),
            snapshot.unfair
          )
          spin()
        }}
        onCopyName={() => {
          if (result === null) {
            return
          }
          writeClipboard(result.name, 'Name copied', true)
        }}
        onCopyMessage={() => {
          if (result === null) {
            return
          }
          writeClipboard(result.message, 'Message copied', true)
        }}
      />
      <div className={toast === null ? 'toast' : 'toast is-on'} id="toast" role="status" aria-live="polite">
        <span id="toast-text">{toast?.text ?? ''}</span>
        <button
          id="toast-action"
          type="button"
          hidden={toast?.undo === undefined}
          onClick={() => {
            const undo = toast?.undo
            setToast(null)
            window.clearTimeout(toastTimer.current)
            undo?.()
          }}
        >
          Undo
        </button>
      </div>
      <p className="sr-only" id="live" aria-live="assertive">{live}</p>
    </div>
  )
}

const useLayoutEffectTheme = (theme: 'light' | 'dark' | null, osDark: boolean): void => {
  useLayoutEffect(() => {
    const root = document.documentElement
    if (theme === null) {
      delete root.dataset.theme
    } else {
      root.dataset.theme = theme
    }

    const dark = theme === 'dark' || (theme === null && osDark)
    const color = dark ? '#111115' : '#F5F4F0'
    document.querySelectorAll('meta[name="theme-color"]').forEach((node) => {
      node.setAttribute('content', color)
    })
  }, [theme, osDark])
}

Home.propTypes = propTypes
Home.defaultProps = defaultProps

export default Home
export { CLASS_NAME, type HomeProps }
