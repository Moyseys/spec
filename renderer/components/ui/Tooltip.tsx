import React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { motion, AnimatePresence } from 'framer-motion'

interface TooltipProps {
  children: React.ReactElement
  content: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  delay?: number
}

export const TooltipProvider = TooltipPrimitive.Provider

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  side = 'bottom',
  delay = 500,
}) => {
  const [open, setOpen] = React.useState(false)

  return (
    <TooltipPrimitive.Root open={open} onOpenChange={setOpen} delayDuration={delay}>
      <TooltipPrimitive.Trigger asChild>
        {children}
      </TooltipPrimitive.Trigger>
      <AnimatePresence>
        {open && (
          <TooltipPrimitive.Portal forceMount>
            <TooltipPrimitive.Content
              side={side}
              sideOffset={8}
              className="z-50"
              asChild
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: side === 'top' ? 5 : -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: side === 'top' ? 5 : -5 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <div className="glass-strong px-3 py-2 rounded-lg text-xs text-zinc-300 border border-white/10 shadow-lg max-w-xs">
                  {content}
                  <TooltipPrimitive.Arrow className="fill-white/5" />
                </div>
              </motion.div>
            </TooltipPrimitive.Content>
          </TooltipPrimitive.Portal>
        )}
      </AnimatePresence>
    </TooltipPrimitive.Root>
  )
}
