import { useEffect, useState } from 'react'
import { DefaultAvatar } from './AvatarDisplay'
import clsx from 'clsx'
import type { Archetype, Lineage } from '../types'
import AvatarDisplay from './AvatarDisplay'

interface ChatBubbleProps {
  message: string
  isTyping?: boolean
  archetype?: Archetype
  lineage?: Lineage
  delay?: number
  className?: string
}

export default function ChatBubble({
  message,
  isTyping = false,
  archetype,
  lineage,
  delay = 0,
  className,
}: ChatBubbleProps) {
  const [visible, setVisible] = useState(delay === 0)
  const [showText, setShowText] = useState(false)
  const [displayedText, setDisplayedText] = useState('')

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setVisible(true), delay)
      return () => clearTimeout(timer)
    }
  }, [delay])

  useEffect(() => {
    if (visible && !isTyping) {
      // Typewriter effect
      let i = 0
      setDisplayedText('')
      const interval = setInterval(() => {
        if (i < message.length) {
          setDisplayedText(message.slice(0, i + 1))
          i++
        } else {
          clearInterval(interval)
          setShowText(true)
        }
      }, 18)
      return () => clearInterval(interval)
    }
  }, [visible, message, isTyping])

  if (!visible) return null

  return (
    <div className={clsx('flex items-start gap-3 animate-slide-up', className)}>
      <div className="flex-shrink-0 mt-1">
        {archetype && lineage ? (
          <AvatarDisplay archetype={archetype} lineage={lineage} size="sm" />
        ) : (
          <DefaultAvatar size="sm" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div
          className="rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs"
          style={{
            background: 'linear-gradient(135deg, #1C1F28, #252933)',
            border: '1px solid rgba(206,255,60,0.15)',
          }}
        >
          {isTyping ? (
            <div className="flex gap-1.5 items-center h-5">
              <div className="typing-dot w-2 h-2 rounded-full bg-volt" />
              <div className="typing-dot w-2 h-2 rounded-full bg-volt" />
              <div className="typing-dot w-2 h-2 rounded-full bg-volt" />
            </div>
          ) : (
            <p className="text-white text-sm leading-relaxed font-body">
              {displayedText}
              {!showText && (
                <span className="inline-block w-0.5 h-4 bg-volt ml-0.5 animate-pulse" />
              )}
            </p>
          )}
        </div>
        <p className="text-xs text-gray-600 mt-1 ml-1 font-mono">COACH MM</p>
      </div>
    </div>
  )
}

// User response bubble
export function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end animate-slide-up">
      <div
        className="rounded-2xl rounded-tr-sm px-4 py-3 max-w-xs"
        style={{
          background: 'linear-gradient(135deg, rgba(206,255,60,0.15), rgba(206,255,60,0.08))',
          border: '1px solid rgba(206,255,60,0.3)',
        }}
      >
        <p className="text-volt text-sm font-medium">{text}</p>
      </div>
    </div>
  )
}
