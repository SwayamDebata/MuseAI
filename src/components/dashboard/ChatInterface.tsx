'use client'

import { useState, useRef, useEffect } from 'react'
import { useChatStore } from '../../stores/chatStore'
import MessageInput from './MessageInput'
import MessageList from './MessageList'
import TypingIndicator from './TypingIndicator'


export default function ChatInterface() {
  const { currentChatroom, isTyping } = useChatStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [currentChatroom?.messages, isTyping])

  if (!currentChatroom) {
    return null
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {currentChatroom.title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {currentChatroom.messages.length} messages
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Online</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <MessageList />
        
        {isTyping && (
          <div className="absolute bottom-4 left-6">
            <TypingIndicator />
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <MessageInput />
      </div>
    </div>
  )
}
