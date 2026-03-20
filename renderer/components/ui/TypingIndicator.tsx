import React from 'react'
import { motion } from 'framer-motion'

const TypingIndicator: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-3 pl-8"
    >
      <div className="flex gap-1">
        {[0, 150, 300].map((delay) => (
          <motion.div
            key={delay}
            animate={{
              y: [0, -8, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: delay / 1000,
              ease: 'easeInOut',
            }}
            className="w-2 h-2 bg-blue-500 rounded-full"
          />
        ))}
      </div>
      <span className="text-xs text-ghost-text-tertiary">Ghost está pensando...</span>
    </motion.div>
  )
}

export default TypingIndicator
