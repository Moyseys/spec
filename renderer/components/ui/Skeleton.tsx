import React from 'react'
import { motion } from 'framer-motion'

interface SkeletonProps {
  variant?: 'message-user' | 'message-assistant' | 'line' | 'circle'
  lines?: number
  className?: string
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'line',
  lines = 1,
  className = '',
}) => {
  if (variant === 'message-user') {
    return (
      <div className="flex justify-end">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-[70%]"
        >
          <div className="flex items-start gap-3 justify-end">
            <div className="space-y-2 flex-1">
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-3/4 rounded ml-auto" />
            </div>
            <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
          </div>
        </motion.div>
      </div>
    )
  }

  if (variant === 'message-assistant') {
    return (
      <div className="flex justify-start">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-[80%]"
        >
          <div className="flex items-start gap-3">
            <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
            <div className="space-y-2 flex-1">
              {Array.from({ length: lines }).map((_, i) => (
                <div
                  key={i}
                  className={`skeleton h-4 rounded ${
                    i === lines - 1 ? 'w-2/3' : 'w-full'
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  if (variant === 'circle') {
    return <div className={`skeleton rounded-full ${className}`} />
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`skeleton h-4 rounded ${
            i === lines - 1 ? 'w-2/3' : 'w-full'
          } ${className}`}
        />
      ))}
    </div>
  )
}
