import { useEffect, type ReactNode } from 'react'

export function Modal({ open, onClose, title, children, variant = 'center' }: {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  variant?: 'center' | 'sheet'
}) {
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [open])

  if (!open) return null

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className={`modal modal--${variant}`} role="dialog" aria-modal="true" aria-label={title || 'Диалог'}>
        <div className="modal__handle" />
        <div className="modal__header">
          {title && <h2>{title}</h2>}
          <button className="icon-button" onClick={onClose} aria-label="Закрыть">✕</button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  )
}
