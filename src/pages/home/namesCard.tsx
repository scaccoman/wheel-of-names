import { useEffect, useRef, useState } from 'react'
import type { ClipboardEvent, FormEvent } from 'react'

import { countLabel, splitNames } from './format'
import { Icon } from './icons'

interface Highlight {
  from: number
  only: boolean
}

interface NamesCardProps {
  names: string[]
  fills: string[]
  chances: string[] | null
  spinning: boolean
  highlight: Highlight | null
  onAdd: (list: string[]) => void
  onRemove: (index: number) => void
  onShuffle: () => void
  onClear: () => void
  onUseExamples: () => void
  onSaveList: (list: string[]) => void
  onPasteMany: (count: number) => void
}

const HELP = 'Press Enter to add. Paste a list to add many at once.'

const NamesCard = ({
  names,
  fills,
  chances,
  spinning,
  highlight,
  onAdd,
  onRemove,
  onShuffle,
  onClear,
  onUseExamples,
  onSaveList,
  onPasteMany
}: NamesCardProps): JSX.Element => {
  const [draft, setDraft] = useState('')
  const [error, setError] = useState(false)
  const [help, setHelp] = useState(HELP)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [leaving, setLeaving] = useState<number | null>(null)
  const [moved, setMoved] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const bulkRef = useRef<HTMLTextAreaElement>(null)
  const focusAfter = useRef<'input' | number | null>(null)
  const leaveTimer = useRef(0)
  const moveTimer = useRef(0)

  useEffect(() => {
    const target = focusAfter.current
    if (target === null) {
      return
    }

    focusAfter.current = null
    if (target === 'input' || names.length === 0) {
      inputRef.current?.focus()
      return
    }

    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('button')
    const next = buttons?.item(Math.min(target, buttons.length - 1))
    if (next === null || next === undefined) {
      inputRef.current?.focus()
      return
    }

    next.focus()
  }, [names])

  useEffect(() => {
    if (highlight === null || highlight.only) {
      return
    }

    const list = listRef.current
    const row = list?.querySelector('.name-row.is-new:last-of-type')
    if (row instanceof HTMLElement) {
      row.scrollIntoView({ block: 'nearest' })
    }
  }, [highlight, names])

  useEffect(() => {
    if (bulkOpen) {
      bulkRef.current?.focus()
    }
  }, [bulkOpen])

  useEffect(() => {
    return () => {
      window.clearTimeout(leaveTimer.current)
      window.clearTimeout(moveTimer.current)
    }
  }, [])

  const removeAt = (index: number): void => {
    if (leaving !== null) {
      return
    }

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      focusAfter.current = index
      onRemove(index)
      return
    }

    setLeaving(index)
    leaveTimer.current = window.setTimeout(() => {
      focusAfter.current = index
      onRemove(index)
      setLeaving(null)
    }, 180)
  }

  const shuffle = (): void => {
    onShuffle()
    setMoved(true)
    window.clearTimeout(moveTimer.current)
    moveTimer.current = window.setTimeout(() => {
      setMoved(false)
    }, 280)
  }

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const list = splitNames(draft)
    if (list.length === 0) {
      setError(true)
      setHelp('Type a name first.')
      inputRef.current?.focus()
      return
    }

    onAdd(list)
    setDraft('')
    setError(false)
    setHelp(list.length > 1 ? `Added ${list.length} names.` : HELP)
    inputRef.current?.focus()
  }

  const paste = (event: ClipboardEvent<HTMLInputElement>): void => {
    const text = event.clipboardData.getData('text')
    if (!/[\n,]/.test(text)) {
      return
    }

    event.preventDefault()
    const list = splitNames(text)
    if (list.length === 0) {
      return
    }

    onAdd(list)
    onPasteMany(list.length)
  }

  const openBulk = (): void => {
    setBulkText(names.join('\n'))
    setBulkOpen(true)
  }

  const closeBulk = (): void => {
    setBulkOpen(false)
    if (names.length === 0) {
      inputRef.current?.focus()
      return
    }

    window.setTimeout(() => {
      document.getElementById('bulk-btn')?.focus()
    }, 0)
  }

  const saveBulk = (): void => {
    const list = splitNames(bulkText)
    setBulkOpen(false)
    onSaveList(list)
    window.setTimeout(() => {
      if (list.length === 0) {
        inputRef.current?.focus()
        return
      }

      document.getElementById('bulk-btn')?.focus()
    }, 0)
  }

  const empty = names.length === 0

  return (
    <section
      className={bulkOpen ? 'card is-bulk' : 'card'}
      id="names-card"
      aria-labelledby="names-title"
      tabIndex={-1}
    >
      <div className="card-head">
        <h2 className="card-title" id="names-title">Names</h2>
        <span className="count" id="name-count" key={names.length} aria-label={countLabel(names.length)}>
          {names.length}
        </span>
        <span className="spacer" />
      </div>
      <form className="add-form" id="add-form" onSubmit={submit} noValidate>
        <label className="sr-only" htmlFor="add-input">Add a name</label>
        <input
          className="field"
          id="add-input"
          ref={inputRef}
          type="text"
          placeholder="Add a name"
          autoComplete="off"
          enterKeyHint="done"
          maxLength={60}
          aria-describedby="add-help"
          aria-invalid={error || undefined}
          value={draft}
          disabled={spinning}
          onChange={(event) => {
            setDraft(event.target.value)
            if (error) {
              setError(false)
              setHelp(HELP)
            }
          }}
          onPaste={paste}
        />
        <button className="btn btn-primary" id="add-btn" type="submit" disabled={spinning}>
          <Icon name="plus" />
          Add
        </button>
      </form>
      <p className={error ? 'field-help is-error' : 'field-help'} id="add-help">{help}</p>
      <p className="locked-note" id="locked-note">
        <Icon name="pause" />
        Editing is paused while the wheel spins.
      </p>
      <div className={bulkOpen ? 'bulk is-open' : 'bulk'} id="bulk">
        <label className="setting-label" htmlFor="bulk-input">Edit the whole list</label>
        <p className="setting-desc" id="bulk-desc">One name per line. Commas also split names.</p>
        <textarea
          id="bulk-input"
          ref={bulkRef}
          aria-describedby="bulk-desc"
          spellCheck={false}
          value={bulkText}
          disabled={spinning}
          onChange={(event) => {
            setBulkText(event.target.value)
          }}
        />
        <div className="bulk-actions">
          <button className="btn btn-ghost btn-sm" id="bulk-cancel" type="button" onClick={closeBulk}>
            Cancel
          </button>
          <button
            className="btn btn-primary btn-sm"
            id="bulk-apply"
            type="button"
            disabled={spinning}
            onClick={saveBulk}
          >
            Save list
          </button>
        </div>
      </div>
      <ul
        className={moved ? 'names is-moved' : 'names'}
        id="names"
        aria-label="Names on the wheel"
        ref={listRef}
        hidden={empty || bulkOpen}
      >
        {names.map((name, index) => {
          const isNew = highlight !== null && (
            highlight.only ? index === highlight.from : index >= highlight.from
          )
          const rowClass = [
            'name-row',
            isNew ? 'is-new' : '',
            leaving === index ? 'is-leaving' : ''
          ].filter((item) => item !== '').join(' ')
          return (
            <li className={rowClass} key={`${name}-${index}`}>
              <span className="swatch" style={{ background: fills[index] }} />
              <span className="name-text" title={name}>{name}</span>
              {chances !== null && (
                <span className="chance" title="Chance to win">
                  {chances[index]}
                  <span className="sr-only"> chance</span>
                </span>
              )}
              <button
                className="icon-btn"
                type="button"
                aria-label={`Remove ${name}`}
                disabled={spinning}
                onClick={() => {
                  removeAt(index)
                }}
              >
                <Icon name="x" />
              </button>
            </li>
          )
        })}
      </ul>
      <div className="names-empty" id="names-empty" hidden={!empty || bulkOpen}>
        <strong>Add names to get started</strong>
        Type a name above, or paste a list. One per line or comma-separated.
        <div className="empty-actions">
          <button className="btn btn-secondary btn-sm" id="empty-bulk-btn" type="button" onClick={openBulk}>
            <Icon name="paste" />
            Paste a list
          </button>
          <button className="btn btn-ghost btn-sm" id="example-btn" type="button" onClick={onUseExamples}>
            Use example names
          </button>
        </div>
      </div>
      <div className="list-tools" id="list-tools" hidden={empty}>
        <button
          className="btn btn-quiet btn-sm"
          id="shuffle-btn"
          type="button"
          disabled={spinning || names.length < 2}
          onClick={shuffle}
        >
          <Icon name="shuffle" />
          Shuffle
        </button>
        <button
          className="btn btn-quiet btn-sm"
          id="bulk-btn"
          type="button"
          aria-expanded={bulkOpen}
          aria-controls="bulk"
          disabled={spinning}
          onClick={() => {
            if (bulkOpen) {
              closeBulk()
              return
            }
            openBulk()
          }}
        >
          <Icon name="paste" />
          Edit list
        </button>
        <button
          className="btn btn-quiet btn-sm"
          id="clear-btn"
          type="button"
          disabled={spinning}
          onClick={() => {
            focusAfter.current = 'input'
            onClear()
          }}
        >
          <Icon name="trash" />
          Clear
        </button>
      </div>
    </section>
  )
}

export default NamesCard
