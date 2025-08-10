'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Mic, Smile } from 'lucide-react'
import { useChatStore } from '../../stores/chatStore'
import AICommandSelector from './AICommandSelector'

export default function MessageInput() {
  const [message, setMessage] = useState('')
  const [showAISelector, setShowAISelector] = useState(false)
  const [aiSelectorPosition, setAISelectorPosition] = useState({ top: 0, left: 0 })
  const [pendingAICommand, setPendingAICommand] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const { sendCometChatMessage, currentChatroom, isTyping, setTyping } = useChatStore()

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [message])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !currentChatroom) return

    const messageToSend = pendingAICommand ? `/${pendingAICommand} ${message.trim()}` : message.trim()
    
    try {
      await sendCometChatMessage(messageToSend)
      setMessage('')
      setPendingAICommand('')
      setTyping(false)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setMessage(value)

    const cursorPosition = e.target.selectionStart
    const textBeforeCursor = value.slice(0, cursorPosition)
    const lastCharacter = textBeforeCursor.slice(-1)
    const secondLastCharacter = textBeforeCursor.slice(-2, -1)

    if ((lastCharacter === '/' || lastCharacter === '\\') && 
        (secondLastCharacter === '' || secondLastCharacter === ' ' || secondLastCharacter === '\n')) {
      const rect = e.target.getBoundingClientRect()
      const containerRect = containerRef.current?.getBoundingClientRect()
      
      if (containerRect) {
        setAISelectorPosition({
          top: rect.top - containerRect.top - 200, 
          left: rect.left - containerRect.left
        })
      }
      setShowAISelector(true)
    } else if (showAISelector && (value.includes(' ') || value === '')) {
      setShowAISelector(false)
    }

    if (value.length > 0 && !isTyping) {
      setTyping(true)
    } else if (value.length === 0 && isTyping) {
      setTyping(false)
    }
  }

  const handleAICommandSelect = (command: string) => {
    setPendingAICommand(command)
    setShowAISelector(false)
    
    const newMessage = message.replace(/[/\\]$/, '')
    setMessage(newMessage)
    
    textareaRef.current?.focus()
  }

  const cancelAICommand = () => {
    setPendingAICommand('')
  }

  return (
    <div ref={containerRef} className="relative">
      {/* AI Command Selector */}
      {showAISelector && (
        <AICommandSelector
          onSelectCommand={handleAICommandSelect}
          onClose={() => setShowAISelector(false)}
          position={aiSelectorPosition}
        />
      )}
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        {/* AI Command Indicator */}
        {pendingAICommand && (
          <div className="mb-2 flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <span className="text-sm text-blue-600 dark:text-blue-400">
              🤖 Asking AI: <strong>{pendingAICommand}</strong>
            </span>
            <button
              onClick={cancelAICommand}
              className="text-blue-500 hover:text-blue-700 text-sm ml-auto"
            >
              Cancel
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          {/* Attachment Button */}
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Message Input Container */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                pendingAICommand 
                  ? "Type your question for AI..." 
                  : "Type a message... (use / or \\ for AI commands)"
              }
              className="w-full px-4 py-3 pr-12 border border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[48px] max-h-[120px]"
              rows={1}
            />
            
            {/* Emoji Button */}
            <button
              type="button"
              className="absolute right-3 bottom-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <Smile className="w-5 h-5" />
            </button>
          </div>

          {/* Send/Voice Button */}
          {message.trim() ? (
            <button
              type="submit"
              className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors disabled:opacity-50"
              disabled={!currentChatroom}
            >
              <Send className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              className="p-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </form>

        {/* Helper Text */}
        <div className="mt-2 text-xs text-gray-400 dark:text-gray-500 text-center">
          Type <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">/</kbd> or{' '}
          <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">\</kbd> for AI commands
        </div>
      </div>
    </div>
  )
}
