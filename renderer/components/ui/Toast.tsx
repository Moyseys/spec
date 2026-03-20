import React from 'react'
import { Toaster as HotToaster, resolveValue, toast as hotToast } from 'react-hot-toast'
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Renderable } from 'react-hot-toast'

export const Toaster: React.FC = () => {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 5000,
        style: {
          background: 'transparent',
          padding: 0,
          boxShadow: 'none',
        },
      }}
    >
      {(t) => (
        <AnimatePresence>
          {t.visible && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative"
            >
              <div className="glass-strong rounded-lg p-4 pr-12 min-w-[320px] max-w-md border border-white/10 shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(t.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    {resolveValue(t.message, t)}
                  </div>
                </div>
                <button
                  onClick={() => hotToast.dismiss(t.id)}
                  className="absolute top-3 right-3 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                
                {/* Progress bar */}
                {t.duration && (
                  <motion.div
                    initial={{ scaleX: 1 }}
                    animate={{ scaleX: 0 }}
                    transition={{ duration: t.duration / 1000, ease: 'linear' }}
                    className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500/50 rounded-b-lg origin-left"
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </HotToaster>
  )
}

function getIcon(type: string) {
  const iconClass = "w-5 h-5"
  
  switch (type) {
    case 'success':
      return <CheckCircle2 className={`${iconClass} text-green-500`} />
    case 'error':
      return <XCircle className={`${iconClass} text-red-500`} />
    case 'warning':
      return <AlertCircle className={`${iconClass} text-yellow-500`} />
    default:
      return <Info className={`${iconClass} text-blue-500`} />
  }
}

// Toast helper functions
export const toast = {
  success: (message: Renderable) => {
    hotToast.success(message)
  },
  error: (message: Renderable) => {
    hotToast.error(message)
  },
  warning: (message: Renderable) => {
    hotToast(message, { icon: '⚠️' })
  },
  info: (message: Renderable) => {
    hotToast(message)
  },
  promise: <T,>(
    promise: Promise<T>,
    msgs: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((err: Error) => string)
    }
  ) => {
    return hotToast.promise(promise, msgs)
  },
}
