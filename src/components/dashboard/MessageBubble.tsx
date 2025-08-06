'use client'

import { useState } from 'react'

import { Copy, Check, User, Bot } from 'lucide-react'
import toast from 'react-hot-toast'
import { type Message } from '@/stores/chatStore'
import { copyToClipboard, formatTime } from '../../lib/utils'

interface MessageBubbleProps {
  message: Message
  showAvatar: boolean
  showTimestamp: boolean
}

export default function MessageBubble({ message, showAvatar, showTimestamp }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const [imageError, setImageError] = useState(false)

  const isUser = message.sender === 'user'

  const handleCopy = async () => {
    const success = await copyToClipboard(message.content)
    if (success) {
      setCopied(true)
      toast.success('Message copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } else {
      toast.error('Failed to copy message')
    }
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}>
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
        {/* Avatar */}
        {showAvatar && (
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}>
            {isUser ? (
              <User className="w-4 h-4" />
            ) : (
              <Bot className="w-4 h-4" />
            )}
          </div>
        )}

        <div className={`relative ${!showAvatar ? (isUser ? 'mr-10' : 'ml-10') : ''}`}>
          <div
            className={`relative px-4 py-2 rounded-2xl max-w-full break-words ${
              isUser
                ? 'bg-blue-600 text-white rounded-br-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
            }`}
          >
            {message.image && !imageError && (
              <div className="mb-2">
                <img
                  src={message.image}
                  alt="Shared image"
                  className="max-w-full h-auto rounded-lg"
                  onError={() => setImageError(true)}
                  loading="lazy"
                />
              </div>
            )}

            <p className="text-sm whitespace-pre-wrap">{message.content}</p>

            <button
              onClick={handleCopy}
              className={`absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ${
                isUser 
                  ? 'right-2 text-blue-100 hover:text-white hover:bg-blue-700' 
                  : 'right-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="Copy message"
            >
              {copied ? (
                <Check className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>

          {showTimestamp && (
            <div className={`mt-1 text-xs text-gray-500 dark:text-gray-400 ${
              isUser ? 'text-right' : 'text-left'
            }`}>
              {formatTime(new Date(message.timestamp))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
