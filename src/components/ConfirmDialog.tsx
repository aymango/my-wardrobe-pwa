import { Modal } from './Modal'

export function ConfirmDialog({ open, onClose, onConfirm, title, text, confirmText = 'Удалить', busy = false }: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  text: string
  confirmText?: string
  busy?: boolean
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="dialog-text">{text}</p>
      <div className="dialog-actions">
        <button className="button button--secondary" onClick={onClose} disabled={busy}>Отмена</button>
        <button className="button button--danger" onClick={onConfirm} disabled={busy}>{busy ? 'Удаление…' : confirmText}</button>
      </div>
    </Modal>
  )
}
