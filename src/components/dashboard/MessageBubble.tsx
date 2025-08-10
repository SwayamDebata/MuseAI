'use client'

import { Message } from '../../stores/chatStore'
import { formatTime } from '../../lib/utils'
import { useChatStore } from '../../stores/chatStore'

interface MessageBubbleProps {
  message: Message
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const { currentUser } = useChatStore()
  
  const isCurrentUser = message.isAI ? false : (message.senderId === currentUser?.uid)
  const isAI = message.isAI || message.sender === 'ai'
  const isAICommand = message.isAICommand || (message.content && (message.content.startsWith('/askAI') || message.content.startsWith('\\askAI')))

  return (
    <div
      className={`flex mb-4 ${
        isCurrentUser ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
          isAI
            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100 border border-purple-200 dark:border-purple-800'
            : isAICommand
            ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100 border border-indigo-200 dark:border-indigo-800'
            : isCurrentUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'
        }`}
      >
        {/* Sender Name - show for others' messages, AI commands, and AI responses */}
        {!isCurrentUser && message.senderName && (
          <div className={`text-xs font-semibold mb-1 ${
            isAI 
              ? 'text-purple-600 dark:text-purple-400'
              : isAICommand
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-blue-600 dark:text-blue-400'
          }`}>
            {message.senderName}
          </div>
        )}

        {/* AI Indicator */}
        {isAI && (
          <div className="flex items-center gap-1 mb-1">
            <span className="text-xs font-semibold">🤖 AI Assistant</span>
          </div>
        )}

        {/* AI Command Indicator */}
        {isAICommand && !isAI && (
          <div className="flex items-center gap-1 mb-1">
            <span className="text-xs font-semibold">💬 AI Command</span>
          </div>
        )}

        {/* Message Content */}
        <div className="whitespace-pre-wrap break-words">
          {message.content}
        </div>

        {message.image && (
          <div className="mt-2">
            <img
              src={message.image}
              alt="Shared image"
              className="max-w-full h-auto rounded-lg"
            />
          </div>
        )}

        {/* Timestamp and Status */}
        <div
          className={`text-xs mt-1 flex items-center justify-end gap-1 ${
            isAI
              ? 'text-purple-600 dark:text-purple-400'
              : isAICommand
              ? 'text-indigo-600 dark:text-indigo-400'
              : isCurrentUser
              ? 'text-blue-100'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <span>{formatTime(message.timestamp)}</span>
          
          {/* Message status for current user */}
          {isCurrentUser && !isAI && (
            <div className="flex">
              {/* Double checkmark for delivered/read */}
              <svg className="w-3 h-3 fill-current" viewBox="0 0 16 16">
                <path d="M2.5 8.5L6 12l7.5-7.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <path d="M5 11L8.5 7.5L13 12" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
