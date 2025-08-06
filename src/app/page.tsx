'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../stores/authStore'
import AuthPage from '../components/auth/AuthPage'
import Dashboard from '../components/dashboard/Dashboard'


export default function Home() {
  const { isAuthenticated, checkAuth } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (!isAuthenticated) {
    return <AuthPage />
  }

  return <Dashboard />
}
