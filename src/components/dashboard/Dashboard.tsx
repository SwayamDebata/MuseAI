'use client'

import { useState } from 'react'
import { useChatStore } from '../../stores/chatStore'
import ChatInterface from './ChatInterface'
import Header from './Header'
import Sidebar from './Sidebar'


export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const { currentChatroom } = useChatStore()

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50">
        <Header
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      </div>

      <div className={`
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40
        w-80 transition-transform duration-300 ease-in-out
        lg:pt-0 pt-16
      `}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col lg:pt-0 pt-16">
        <div className="hidden lg:block">
          <Header
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          />
        </div>

        <div className="flex-1 overflow-hidden">
          {currentChatroom ? (
            <ChatInterface />
          ) : (
            <div className="h-full flex items-center justify-center">
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
                  No chat selected
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Choose a chatroom from the sidebar or create a new one to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  )
}
