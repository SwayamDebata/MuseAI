'use client'

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-2xl rounded-bl-md max-w-fit mb-4">
      <div className="w-6 h-6 rounded-full bg-purple-200 dark:bg-purple-600 flex items-center justify-center">
        <span className="text-sm">🤖</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-sm text-purple-600 dark:text-purple-300">AI is thinking</span>
        <div className="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  )
}
