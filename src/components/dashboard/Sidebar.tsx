'use client'

import { useState, useMemo } from 'react'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Search, Plus, Trash2, MessageCircle, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { debounce, formatDate, formatTime } from '../../lib/utils'
import { ChatroomFormData, chatroomSchema } from '../../lib/validations'
import { useChatStore } from '../../stores/chatStore'

interface SidebarProps {
  onClose: () => void
}

export default function Sidebar({ onClose }: SidebarProps) {
  const {
    chatrooms,
    currentChatroom,
    searchQuery,
    createChatroom,
    deleteChatroom,
    selectChatroom,
    setSearchQuery,
    filteredChatrooms,
  } = useChatStore()

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [chatroomToDelete, setChatroomToDelete] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChatroomFormData>({
    resolver: zodResolver(chatroomSchema),
  })

  const debouncedSetSearchQuery = useMemo(
    () => debounce((query: string) => setSearchQuery(query), 300),
    [setSearchQuery]
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSetSearchQuery(e.target.value)
  }

  const handleCreateChatroom = (data: ChatroomFormData) => {
    const newChatroom = createChatroom(data.title)
    setShowCreateForm(false)
    reset()
    toast.success(`Chatroom "${data.title}" created`)
    
    if (window.innerWidth < 1024) {
      onClose()
    }
  }

  const handleDeleteChatroom = (id: string) => {
    const chatroom = chatrooms.find(c => c.id === id)
    if (chatroom) {
      deleteChatroom(id)
      setChatroomToDelete(null)
      toast.success(`Chatroom "${chatroom.title}" deleted`)
    }
  }

  const handleSelectChatroom = (id: string) => {
    selectChatroom(id)
    
    if (window.innerWidth < 1024) {
      onClose()
    }
  }

  const filtered = filteredChatrooms()

  return (
    <div className="h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Chatrooms
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateForm(true)}
              className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              title="Create new chatroom"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search chatrooms..."
            defaultValue={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {showCreateForm && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <form onSubmit={handleSubmit(handleCreateChatroom)} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Chatroom Title
              </label>
              <input
                type="text"
                placeholder="Enter chatroom title..."
                {...register('title')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.title.message}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false)
                  reset()
                }}
                className="flex-1 py-2 px-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filtered.length === 0 ? (
          <div className="p-4 text-center">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {searchQuery ? 'No chatrooms found' : 'No chatrooms yet'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
              >
                Create your first chatroom
              </button>
            )}
          </div>
        ) : (
          <div className="p-2">
            {filtered.map((chatroom) => (
              <div
                key={chatroom.id}
                className={`
                  group relative p-3 rounded-lg cursor-pointer transition-colors mb-1
                  ${currentChatroom?.id === chatroom.id
                    ? 'bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }
                `}
                onClick={() => handleSelectChatroom(chatroom.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {chatroom.title}
                    </h3>
                    {chatroom.lastMessage && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                        {chatroom.lastMessage.sender === 'ai' ? 'Gemini: ' : 'You: '}
                        {chatroom.lastMessage.content}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-400">
                        {formatDate(chatroom.createdAt)}
                      </span>
                      {chatroom.lastMessage && (
                        <>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-400">
                            {formatTime(chatroom.lastMessage.timestamp)}
                          </span>
                        </>
                      )}
                      <span className="text-xs text-gray-400">
                        • {chatroom.messages.length} messages
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setChatroomToDelete(chatroom.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition-all"
                    title="Delete chatroom"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {chatroomToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Delete Chatroom
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
              Are you sure you want to delete this chatroom? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDeleteChatroom(chatroomToDelete)}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setChatroomToDelete(null)}
                className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
