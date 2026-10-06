/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom'
import { act, render, screen, waitFor, fireEvent } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

import Home from '../'

const media = (): Record<string, boolean> => {
  return (window as unknown as { __media: Record<string, boolean> }).__media
}

const audioPlays = (): { count: number } => {
  return (window as unknown as { __audioPlays: { count: number } }).__audioPlays
}

const frames: FrameRequestCallback[] = []

const flushFrames = (): void => {
  const now = performance.now() + 20000
  act(() => {
    let guard = 0
    while (frames.length > 0 && guard < 8) {
      const batch = frames.splice(0, frames.length)
      batch.forEach((callback) => {
        callback(now)
      })
      guard += 1
    }
  })
}

const resetPage = (): void => {
  localStorage.clear()
  window.history.replaceState({}, '', window.location.pathname)
  delete document.body.dataset.spinning
  delete document.body.dataset.unfair
  document.body.classList.remove('is-locked')
  delete document.documentElement.dataset.theme
  Object.keys(media()).forEach((key) => {
    media()[key] = false
  })
  audioPlays().count = 0
  ;(window as unknown as { __writes: string[] }).__writes.length = 0
  frames.length = 0
  window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
    frames.push(callback)
    return frames.length
  }
  window.cancelAnimationFrame = () => undefined
}

const openResult = async (): Promise<void> => {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Spin the wheel' }))
  flushFrames()
  await waitFor(() => {
    expect(screen.getByRole('dialog', { name: 'Congratulations!' })).toBeInTheDocument()
  }, { timeout: 2000 })
}

describe('pages:home', () => {
  beforeEach(() => {
    resetPage()
  })

  it('renders the default names and writes them to the URL', () => {
    render(<Home />)

    expect(screen.getByRole('heading', { name: 'Wheel of Names' })).toBeInTheDocument()
    expect(screen.getByText('john')).toBeInTheDocument()
    expect(screen.getByText('joe')).toBeInTheDocument()
    expect(window.location.search).toBe('?names=john,mario,willy,frank,anna,joe')
    expect(screen.getByRole('button', { name: 'Spin the wheel, 6 names' })).toBeInTheDocument()
  })

  it('uses the provided class name', () => {
    const { container } = render(<Home className="test-class" />)

    expect(container.firstChild).toHaveClass('page-home', 'test-class')
  })

  it('reads names from the query string', () => {
    window.history.replaceState({}, '', `${window.location.pathname}?names=ada,grace`)
    render(<Home />)

    expect(screen.getByText('ada')).toBeInTheDocument()
    expect(screen.getByText('grace')).toBeInTheDocument()
    expect(screen.queryByText('john')).not.toBeInTheDocument()
  })

  it('keeps an empty names param empty', () => {
    window.history.replaceState({}, '', `${window.location.pathname}?names=`)
    render(<Home />)

    expect(screen.getByText('Add names to get started')).toBeInTheDocument()
    expect(window.location.search).toBe('?names=')
    expect(screen.getByRole('button', { name: 'Spin, add a name first' })).toHaveAttribute('aria-disabled', 'true')
  })

  it('round-trips names that contain reserved characters', () => {
    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}?names=${encodeURIComponent('a&b')},${encodeURIComponent('c d')}`
    )
    render(<Home />)

    expect(screen.getByText('a&b')).toBeInTheDocument()
    expect(screen.getByText('c d')).toBeInTheDocument()
    expect(window.location.search).toBe('?names=a%26b,c%20d')
  })

  it('adds a name and rejects an empty add', async () => {
    const user = userEvent.setup()
    render(<Home />)

    await user.type(screen.getByLabelText('Add a name'), 'Zoë Smith{Enter}')

    expect(decodeURIComponent(window.location.search)).toContain('Zoë Smith')
    expect(screen.getByText('Zoë Smith')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByText('Type a name first.')).toBeInTheDocument()
  })

  it('does not mute while typing, and M mutes', async () => {
    const user = userEvent.setup()
    render(<Home />)
    const sound = screen.getByRole('button', { name: 'Mute sounds' })

    await user.type(screen.getByLabelText('Add a name'), 'm')
    expect(sound).toHaveAttribute('aria-pressed', 'false')

    fireEvent.keyDown(document.body, { key: 'm' })
    expect(screen.getByRole('button', { name: 'Unmute sounds' })).toHaveAttribute('aria-pressed', 'true')
    expect(localStorage.getItem('wheel.muted')).toBe('1')
  })

  it('removes a name and restores it from the toast', async () => {
    const user = userEvent.setup()
    render(<Home />)

    await user.click(screen.getByRole('button', { name: 'Remove john' }))
    await waitFor(() => {
      expect(screen.queryByText('john')).not.toBeInTheDocument()
    })
    expect(window.location.search).not.toContain('john')

    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(screen.getByText('john')).toBeInTheDocument()
    expect(window.location.search).toContain('john')
  })

  it('toggles unfair mode, shows chances, and rerolls', async () => {
    const user = userEvent.setup()
    render(<Home />)

    await user.click(screen.getByRole('switch', { name: 'Unfair mode' }))

    expect(screen.getByRole('heading', { name: 'Unfair Wheel of Names' })).toBeInTheDocument()
    expect(window.location.search).toContain('unfairMode=true')
    expect(screen.getAllByTitle('Chance to win')).toHaveLength(6)
    expect(document.title).toBe('Unfair Wheel of Names')

    await user.click(screen.getByRole('button', { name: 'Re-roll sizes' }))
    expect(screen.getByRole('status')).toHaveTextContent('New slice sizes and odds')
  })

  it('plays the toggle sound only while sound is on', async () => {
    const user = userEvent.setup()
    render(<Home />)

    await user.click(screen.getByRole('switch', { name: 'Unfair mode' }))
    expect(audioPlays().count).toBe(1)

    await user.click(screen.getByRole('button', { name: 'Mute sounds' }))
    const before = audioPlays().count
    await user.click(screen.getByRole('switch', { name: 'Unfair mode' }))
    expect(audioPlays().count).toBe(before)
  })

  it('edits the list as text', async () => {
    const user = userEvent.setup()
    render(<Home />)

    await user.click(screen.getByRole('button', { name: 'Edit list' }))
    fireEvent.change(screen.getByLabelText('Edit the whole list'), {
      target: { value: 'a\nb, c\n\n d ' }
    })
    await user.click(screen.getByRole('button', { name: 'Save list' }))

    expect(window.location.search).toBe('?names=a,b,c,d')
  })

  it('clears the list, blocks an empty spin, and restores the examples', async () => {
    const user = userEvent.setup()
    render(<Home />)

    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(screen.getByText('Add names to get started')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Spin, add a name first' }))
    expect(document.body).not.toHaveAttribute('data-spinning')

    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(screen.getByText('john')).toBeInTheDocument()
  })

  it('locks editing during a spin and opens the result', async () => {
    const user = userEvent.setup()
    render(<Home />)

    await user.click(screen.getByRole('button', { name: 'Spin the wheel' }))
    expect(screen.getByLabelText('Add a name')).toBeDisabled()
    expect(document.body).toHaveAttribute('data-spinning', 'true')

    flushFrames()
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Congratulations!' })).toBeInTheDocument()
    }, { timeout: 2000 })
    expect(document.querySelector('.confetti')).not.toBeNull()
  })

  it('skips with Escape and closes the result the same way', async () => {
    render(<Home />)
    fireEvent.keyDown(document.body, { key: ' ' })
    expect(document.body).toHaveAttribute('data-spinning', 'true')

    fireEvent.keyDown(document, { key: 'Escape' })
    flushFrames()
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Congratulations!' })).toBeInTheDocument()
    }, { timeout: 2000 })

    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('copies the host message and can remove the winner', async () => {
    const user = userEvent.setup()
    window.history.replaceState({}, '', `${window.location.pathname}?names=ada,grace`)
    render(<Home />)
    await openResult()

    const winner = document.getElementById('result-name')?.textContent ?? ''
    const preview = document.getElementById('copy-preview')?.textContent ?? ''
    expect(preview.startsWith(`@${winner} will be the next host!`)).toBe(true)
    expect(preview).toContain("The day after tomorrow's winner is")

    const writes: string[] = []
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          writes.push(text)
        }
      }
    })
    await user.click(screen.getByRole('button', { name: 'Copy message' }))
    expect(writes[0]?.startsWith(`@${winner} will be the next host!`)).toBe(true)

    await user.click(screen.getByRole('button', { name: /& spin again/ }))
    await waitFor(() => {
      expect(screen.getByRole('list', { name: 'Names on the wheel' })).not.toHaveTextContent(winner)
    })
  })

  it('skips confetti when motion is reduced', async () => {
    media()['(prefers-reduced-motion: reduce)'] = true
    render(<Home />)
    await openResult()

    expect(document.querySelector('.confetti')).toBeNull()
  })

  it('remembers an explicit theme', () => {
    localStorage.setItem('wheel.theme', 'dark')
    render(<Home />)

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument()
  })
})
