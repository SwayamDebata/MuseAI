'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Search, Plus, Trash2, MessageCircle, X, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { debounce, formatDate, formatTime } from '../../lib/utils'
import { ChatroomFormData, chatroomSchema } from '../../lib/validations'
import { useChatStore } from '../../stores/chatStore'
import GroupDiscovery from './GroupDiscovery'

interface SidebarProps {
  onClose: () => void
}

export default function Sidebar({ onClose }: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [showDiscovery, setShowDiscovery] = useState(false)

  const {
    chatrooms,
    currentChatroom,
    createChatroom,
    selectChatroom,
    deleteChatroom,
    isCometChatInitialized
  } = useChatStore()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ChatroomFormData>({
    resolver: zodResolver(chatroomSchema)
  })

  const debouncedSearch = useMemo(
    () => debounce((term: string) => setSearchTerm(term), 300),
    []
  )

  const filteredChatrooms = useMemo(() => {
    if (!searchTerm) return chatrooms
    return chatrooms.filter(room =>
      room.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [chatrooms, searchTerm])

  const handleCreateChatroom = async (data: ChatroomFormData) => {
    try {
      console.log('Creating chatroom:', data.title)
      await createChatroom(data.title, true) 
      reset()
      setIsCreating(false)
      toast.success('Chatroom created successfully!')
    } catch (error) {
      console.error('Error creating chatroom:', error)
      toast.error('Failed to create chatroom')
    }
  }

  const handleDeleteChatroom = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await deleteChatroom(id)
        toast.success('Chatroom deleted')
      } catch (error) {
        console.error('Error deleting chatroom:', error)
        toast.error('Failed to delete chatroom')
      }
    }
  }

  const formatLastMessage = (room: any) => {
    if (!room.lastMessage) return 'No messages yet'
    
    const time = formatTime(room.lastMessage.timestamp)
    const isAI = room.lastMessage.sender === 'AI'
    const prefix = isAI ? '🤖 ' : ''
    const messageText = room.lastMessage.text || room.lastMessage.content || 'No message content'
    
    return `${prefix}${messageText.substring(0, 30)}${
      messageText.length > 30 ? '...' : ''
    } • ${time}`
  }

  return (
    <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Chatrooms
          </h2>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search chatrooms..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => debouncedSearch(e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setIsCreating(true)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Group
          </button>
          
          {isCometChatInitialized && (
            <button
              onClick={() => setShowDiscovery(true)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Users className="w-4 h-4" />
              Join Group
            </button>
          )}
        </div>
      </div>

      {/* Create Form */}
      {isCreating && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <form onSubmit={handleSubmit(handleCreateChatroom)} className="space-y-3">
            <div>
              <input
                {...register('title')}
                type="text"
                placeholder="Enter chatroom name..."
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>
            
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
              >
                {isSubmitting ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false)
                  reset()
                }}
                className="px-3 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Group Discovery Modal */}
      {showDiscovery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-96 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Discover Groups
              </h3>
              <button
                onClick={() => setShowDiscovery(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <GroupDiscovery onClose={() => setShowDiscovery(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Chatrooms List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChatrooms.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            {searchTerm ? 'No chatrooms found' : 'No chatrooms yet. Create your first one!'}
          </div>
        ) : (
          <div className="p-2">
            {filteredChatrooms.map((room) => (
              <div
                key={room.id}
                className={`group relative p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  currentChatroom?.id === room.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                    : ''
                }`}
                onClick={() => selectChatroom(room.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {room.title}
                      </h3>
                      {room.isGroupChat && (
                        <Users className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {formatLastMessage(room)}
                    </p>
                    
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Created {formatDate(room.createdAt)}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteChatroom(room.id, room.title)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
