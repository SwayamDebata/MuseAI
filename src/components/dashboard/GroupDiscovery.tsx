'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, Plus, Loader2, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { useChatStore } from '../../stores/chatStore'

interface GroupDiscoveryProps {
  onClose: () => void
}

export default function GroupDiscovery({ onClose }: GroupDiscoveryProps) {
  const { 
    chatrooms, 
    discoverPublicGroups, 
    joinExistingGroup,
    isCometChatInitialized 
  } = useChatStore()
  
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  const discoveredGroups = chatrooms.filter(room => 
    room.id.startsWith('discovered-') && 
    room.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDiscoverGroups = useCallback(async () => {
    setLoading(true)
    try {
      await discoverPublicGroups()
    } catch (error) {
      console.error('Failed to discover groups:', error)
      toast.error('Failed to discover groups')
    } finally {
      setLoading(false)
    }
  }, [discoverPublicGroups])

  useEffect(() => {
    if (isCometChatInitialized) {
      handleDiscoverGroups()
    }
  }, [isCometChatInitialized, handleDiscoverGroups])

  const handleJoinGroup = async (groupGuid: string, groupName: string) => {
    try {
      const success = await joinExistingGroup(groupGuid, groupName)
      if (success) {
        toast.success(`Joined "${groupName}" successfully!`)
        onClose()
      } else {
        toast.error('Failed to join group')
      }
    } catch (error) {
      console.error('Failed to join group:', error)
      toast.error('Failed to join group')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Join a Group
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          
          <button
            onClick={handleDiscoverGroups}
            disabled={loading || !isCometChatInitialized}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            {loading ? 'Discovering...' : 'Refresh Groups'}
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {discoveredGroups.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                {loading ? 'Discovering groups...' : 'No public groups found'}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Ask friends to share their group names or create a new one!
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {discoveredGroups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {group.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Public group
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleJoinGroup(group.cometChatGuid!, group.title)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Join
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {!isCometChatInitialized && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Group discovery requires CometChat to be initialized. Please try again in a moment.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
