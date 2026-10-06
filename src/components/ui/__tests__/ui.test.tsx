/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

import UI from '../'

describe('components:ui', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', window.location.pathname)
  })

  it('renders the wheel', () => {
    render(<UI />)

    expect(
      screen.getByRole('heading', { name: 'Wheel of Names' })
    ).toBeInTheDocument()
  })

  it('uses the provided class name', () => {
    const { container } = render(<UI className="test-class" />)

    expect(container.firstChild).toHaveClass('component-ui', 'test-class')
  })
})
