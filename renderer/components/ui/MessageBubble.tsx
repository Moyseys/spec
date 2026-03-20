import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ role, content, isStreaming = false }) => {
  const isUser = role === 'user'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-2 group"
    >
      {/* Avatar + Label */}
      <div className="flex items-center gap-2">
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className={cn(
            'w-6 h-6 rounded-lg flex items-center justify-center text-xs font-semibold',
            isUser
              ? 'bg-gradient-accent text-white shadow-accent'
              : 'bg-white/10 text-ghost-accent-tertiary border border-white/20'
          )}
        >
          {isUser ? 'U' : 'G'}
        </motion.div>
        <div className="text-xs font-semibold text-ghost-text-tertiary uppercase tracking-wider">
          {isUser ? 'Você' : 'Ghost'}
        </div>
      </div>

      {/* Message Content */}
      <motion.div
        whileHover={{ x: 4 }}
        className={cn(
          'text-sm leading-relaxed whitespace-pre-wrap pl-8 transition-transform',
          isUser ? 'text-white font-medium' : 'text-ghost-text-secondary'
        )}
      >
        {content}
        {isStreaming && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="inline-block w-1 h-4 bg-blue-500 ml-0.5"
          />
        )}
      </motion.div>
    </motion.div>
  )
}

export default MessageBubble
