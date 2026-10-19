import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormError } from './FormError'
import { QueryState } from './QueryState'

const query = (o: Partial<{ isPending: boolean; isError: boolean }> = {}) => ({
  isPending: false,
  isError: false,
  refetch: vi.fn(),
  ...o,
})

describe('QueryState', () => {
  it('shows a loading status while pending', () => {
    render(
      <QueryState queries={[query({ isPending: true })]}>content</QueryState>,
    )
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText('content')).not.toBeInTheDocument()
  })
  it('offers a retry that refetches failed queries', async () => {
    const failed = query({ isError: true })
    render(<QueryState queries={[failed, query()]}>content</QueryState>)
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(failed.refetch).toHaveBeenCalledOnce()
  })
  it('renders children when loaded', () => {
    render(<QueryState queries={[query()]}>content</QueryState>)
    expect(screen.getByText('content')).toBeInTheDocument()
  })
})

describe('FormError', () => {
  it('renders nothing without an error and an alert with one', () => {
    const { rerender } = render(<FormError error={null} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    rerender(<FormError error={new Error('Not permitted')} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Not permitted')
  })
})
