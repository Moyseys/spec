import React from 'react'
import Modal from './Modal'
import Button from './Button'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  onConfirm: () => void
  onCancel?: () => void
  loading?: boolean
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const handleConfirm = () => {
    onConfirm()
    if (!loading) {
      onOpenChange(false)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
    onOpenChange(false)
  }

  const getIconColor = () => {
    switch (variant) {
      case 'danger':
        return 'text-red-500'
      case 'warning':
        return 'text-yellow-500'
      case 'info':
        return 'text-blue-500'
      default:
        return 'text-zinc-400'
    }
  }

  const getConfirmVariant = () => {
    switch (variant) {
      case 'danger':
      case 'warning':
        return 'danger' as const
      case 'info':
        return 'primary' as const
      default:
        return 'primary' as const
    }
  }

  return (
    <Modal 
      isOpen={open} 
      onClose={() => onOpenChange(false)}
      size="sm"
    >
      <div className="w-full">
        <div className="flex items-start gap-4 mb-6">
          <div className={`flex-shrink-0 w-12 h-12 rounded-full bg-white/5 flex items-center justify-center ${getIconColor()}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-white mb-2">
              {title}
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={getConfirmVariant()}
            onClick={handleConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
