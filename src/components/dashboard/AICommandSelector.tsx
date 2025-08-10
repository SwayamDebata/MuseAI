'use client'

import { useState, useEffect, useRef } from 'react'

interface AICommandSelectorProps {
  onSelectCommand: (command: string) => void
  onClose: () => void
  position: { top: number; left: number }
}

const AI_COMMANDS = [
  {
    command: 'askAI',
    label: '🤖 Ask AI',
    description: 'Ask AI assistant a question'
  },
]

export default function AICommandSelector({ onSelectCommand, onClose, position }: AICommandSelectorProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % AI_COMMANDS.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + AI_COMMANDS.length) % AI_COMMANDS.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        onSelectCommand(AI_COMMANDS[selectedIndex].command)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [selectedIndex, onSelectCommand, onClose])

  return (
    <div
      ref={containerRef}
      className="absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-2 min-w-64"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {AI_COMMANDS.map((cmd, index) => (
        <button
          key={cmd.command}
          className={`w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
            selectedIndex === index ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''
          }`}
          onClick={() => onSelectCommand(cmd.command)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">{cmd.label}</span>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {cmd.description}
          </div>
        </button>
      ))}
      
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-600 mt-2">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Use ↑↓ to navigate, Enter to select, Esc to close
        </p>
      </div>
    </div>
  )
}
