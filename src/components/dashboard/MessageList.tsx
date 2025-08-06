'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useChatStore, type Message } from '@/stores/chatStore'
import MessageBubble from './MessageBubble'
import { ChevronUp } from 'lucide-react'

export default function MessageList() {
  const { currentChatroom, loadMoreMessages } = useChatStore()
  const [loading, setLoading] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const topRef = useRef<HTMLDivElement>(null)

  const messages = currentChatroom?.messages || []

  const handleScroll = useCallback(async () => {
    const container = scrollContainerRef.current
    if (!container || loading) return

    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100
    setShowScrollButton(!isNearBottom)

    if (container.scrollTop < 100 && messages.length > 0) {
      setLoading(true)
      const previousScrollHeight = container.scrollHeight
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      loadMoreMessages()
      
      setTimeout(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - previousScrollHeight
        }
        setLoading(false)
      }, 100)
    }
  }, [loading, messages.length, loadMoreMessages])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    let timeoutId: NodeJS.Timeout
    const debouncedHandleScroll = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(handleScroll, 100)
    }

    container.addEventListener('scroll', debouncedHandleScroll)
    return () => {
      container.removeEventListener('scroll', debouncedHandleScroll)
      clearTimeout(timeoutId)
    }
  }, [handleScroll])

  const scrollToBottom = () => {
    const container = scrollContainerRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }

  const groupedMessages = messages.reduce((groups: { [key: string]: Message[] }, message) => {
    const date = new Date(message.timestamp).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(message)
    return groups
  }, {})

  return (
    <div className="relative h-full">
      <div
        ref={scrollContainerRef}
        className="h-full overflow-y-auto custom-scrollbar px-6 py-4"
      >
        {loading && (
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-600 dark:text-gray-400">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              Loading older messages...
            </div>
          </div>
        )}

        <div ref={topRef} className="h-1" />

        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Start the conversation
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Send a message to begin chatting with Gemini
              </p>
            </div>
          </div>
        )}

        {Object.entries(groupedMessages).map(([date, messagesInDate]) => (
          <div key={date} className="mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-400">
                {new Date(date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>

            <div className="space-y-4">
              {messagesInDate.map((message, index) => {
                const previousMessage = messagesInDate[index - 1]
                const nextMessage = messagesInDate[index + 1]
                
                const showAvatar = !nextMessage || nextMessage.sender !== message.sender
                const showTimestamp = !previousMessage || 
                  previousMessage.sender !== message.sender ||
                  new Date(message.timestamp).getTime() - new Date(previousMessage.timestamp).getTime() > 300000 // 5 minutes

                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    showAvatar={showAvatar}
                    showTimestamp={showTimestamp}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors"
          title="Scroll to bottom"
        >
          <ChevronUp className="w-5 h-5 rotate-180" />
        </button>
      )}
    </div>
  )
}
