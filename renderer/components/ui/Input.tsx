import React from 'react'
import { cn } from '../../utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ icon, error, className, onChange, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ghost-text-tertiary">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              `w-full h-11 px-4 
              bg-white/5 border border-white/10 
              rounded-lg
              text-white placeholder-zinc-600
              focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05]
              transition-all duration-150
              disabled:opacity-50 disabled:cursor-not-allowed`,
              icon && 'pl-10',
              error && 'border-ghost-status-error focus:border-ghost-status-error',
              className
            )}
            onChange={(e) => onChange && onChange(e)}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-ghost-status-error">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
