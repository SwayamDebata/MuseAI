'use client'


import { Menu, Sun, Moon, LogOut } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useThemeStore } from '../../stores/themeStore'

interface HeaderProps {
  isSidebarOpen: boolean
  onToggleSidebar: () => void
}

export default function Header({ isSidebarOpen, onToggleSidebar }: HeaderProps) {
  const { user, logout } = useAuthStore()
  const { isDark, toggleTheme } = useThemeStore()

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          
          <div className="hidden lg:block">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              MuseAI
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>

          <div className="hidden sm:flex items-center gap-3 px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.phone?.slice(-2) || 'U'}
              </span>
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {user?.countryCode} {user?.phone}
            </span>
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-red-600 dark:text-red-400"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
