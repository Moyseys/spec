import React from 'react'
import { motion } from 'framer-motion'

interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, description, icon }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-center justify-center h-full text-center space-y-6 py-12"
    >
      <motion.div
        whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
        transition={{ duration: 0.5 }}
        className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center"
      >
        {icon || (
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )}
      </motion.div>
      <div className="space-y-2 max-w-md">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <p className="text-sm text-ghost-text-secondary leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  )
}

export default EmptyState
