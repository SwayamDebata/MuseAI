'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Send, Image, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { fileToBase64 } from '../../lib/utils'
import { MessageFormData, messageSchema } from '../../lib/validations'
import { useChatStore } from '../../stores/chatStore'

export default function MessageInput() {
  const { sendMessage } = useChatStore()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
    reset,
    watch,
  } = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
  })

  const messageContent = watch('content', '')

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    setUploading(true)
    try {
      const base64 = await fileToBase64(file)
      setSelectedImage(base64)
      toast.success('Image selected')
    } catch (error) {
      toast.error('Failed to process image')
      console.error('Image processing error:', error)
    } finally {
      setUploading(false)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFormSubmit = (data: MessageFormData) => {
    if (!data.content.trim() && !selectedImage) {
      return
    }

    sendMessage(data.content.trim(), selectedImage || undefined)
    reset()
    setSelectedImage(null)
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(handleFormSubmit)()
    }
  }

  return (
    <div className="p-4">
      {selectedImage && (
        <div className="mb-3 relative inline-block">
          <img
            src={selectedImage}
            alt="Preview"
            className="max-w-xs max-h-32 rounded-lg border border-gray-200 dark:border-gray-600"
          />
          <button
            onClick={removeImage}
            className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
            title="Remove image"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            {...register('content')}
            placeholder="Type a message..."
            onKeyDown={handleKeyPress}
            className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 max-h-32"
            rows={1}
            style={{
              height: 'auto',
              minHeight: '48px',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = 'auto'
              target.style.height = target.scrollHeight + 'px'
            }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
            title="Attach image"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Image className="w-5 h-5" />
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || (!messageContent.trim() && !selectedImage)}
          className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white rounded-2xl transition-colors disabled:cursor-not-allowed flex-shrink-0"
          title="Send message"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>

      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  )
}
