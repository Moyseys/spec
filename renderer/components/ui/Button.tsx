import React from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '../../utils/cn'

type MotionButtonProps = Omit<
  HTMLMotionProps<'button'>,
  'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'
>

export interface ButtonProps extends MotionButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
  loading?: boolean
  children?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', icon, loading, children, className, disabled, ...props }, ref) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2
      font-medium rounded-lg
      transition-all duration-150
      focus:outline-none focus:ring-2 focus:ring-ghost-accent-primary/50
      disabled:opacity-50 disabled:cursor-not-allowed
    `

    const variants = {
      primary: `
        bg-blue-600 hover:bg-blue-500 active:bg-blue-700
        text-white
      `,
      secondary: `
        bg-white/[0.05] hover:bg-white/[0.08] active:bg-white/[0.10]
        text-white border border-white/[0.08]
      `,
      ghost: `
        bg-transparent hover:bg-white/[0.05] active:bg-white/[0.08]
        text-ghost-text-secondary hover:text-white
      `,
      danger: `
        bg-red-600 hover:bg-red-500 active:bg-red-700
        text-white
      `
    }

    const sizes = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-base',
      lg: 'h-12 px-6 text-lg'
    }

    return (
      <motion.button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        whileHover={{ scale: disabled || loading ? 1 : 1.01 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.99 }}
        transition={{ duration: 0.1 }}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {!loading && icon}
        {children}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export default Button
