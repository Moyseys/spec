import React from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '../../utils/cn'

type MotionCardProps = Omit<
  HTMLMotionProps<'div'>,
  'style' | 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'
> & {
  style?: React.CSSProperties
}

export interface CardProps extends MotionCardProps {
  variant?: 'default' | 'glass' | 'solid'
  hover?: boolean
  children: React.ReactNode
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', hover = false, children, className, ...props }, ref) => {
    const variants = {
      default: `
        bg-white/[0.03] backdrop-blur-xl
        border border-white/[0.06]
        rounded-xl
      `,
      glass: `
        bg-white/[0.05] backdrop-blur-2xl
        border border-white/[0.08]
        rounded-xl
      `,
      solid: `
        bg-black
        border border-white/[0.06]
        rounded-xl
      `
    }

    const Component = hover ? motion.div : 'div'
    const motionProps = hover
      ? {
          whileHover: { scale: 1.005, y: -1 },
          transition: { duration: 0.15 },
        }
      : {}

    return (
      <Component
        ref={ref}
        className={cn(variants[variant], hover && 'cursor-pointer', className)}
        {...(hover ? motionProps : {})}
        {...props}
      >
        {children}
      </Component>
    )
  }
)

Card.displayName = 'Card'

// Subcomponents for compound pattern
const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={cn('px-6 py-4 border-b border-white/10', className)} {...props}>
    {children}
  </div>
)

const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className, ...props }) => (
  <h3 className={cn('text-lg font-semibold text-white', className)} {...props}>
    {children}
  </h3>
)

const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ children, className, ...props }) => (
  <p className={cn('text-sm text-ghost-text-secondary mt-1', className)} {...props}>
    {children}
  </p>
)

const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={cn('px-6 py-4', className)} {...props}>
    {children}
  </div>
)

const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={cn('px-6 py-4 border-t border-white/10', className)} {...props}>
    {children}
  </div>
)

export default Object.assign(Card, {
  Header: CardHeader,
  Title: CardTitle,
  Description: CardDescription,
  Content: CardContent,
  Footer: CardFooter,
})
