import { Button } from './Button'
import { FormError } from './FormError'
import { Modal } from './Modal'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  pending?: boolean
  error?: Error | null
  onConfirm: () => void
  onClose: () => void
}

/** Confirmation step before a destructive action. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  pending,
  error = null,
  onConfirm,
  onClose,
}: Props) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="mb-4 text-slate-700">{message}</p>
      <FormError error={error} />
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="danger" onClick={onConfirm} disabled={pending}>
          {confirmLabel}
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  )
}
