'use client'

import { useState, useEffect } from 'react'
import { useChatStore } from '@/stores/chatStore'
import OTPForm from './OTPForm'
import PhoneForm from './PhoneForm'


export type AuthStep = 'phone' | 'otp'

interface AuthData {
  countryCode: string
  phoneNumber: string
  generatedOTP?: string
}

export default function AuthPage() {
  const [step, setStep] = useState<AuthStep>('phone')
  const [authData, setAuthData] = useState<AuthData>({
    countryCode: '',
    phoneNumber: '',
  })
  const { initializeCometChat } = useChatStore()

  useEffect(() => {
    const initChat = async () => {
      try {
        await initializeCometChat()
        console.log('CometChat initialized successfully')
      } catch (error) {
        console.error('Failed to initialize CometChat:', error)
      }
    }
    
    initChat()
  }, [initializeCometChat])

  const handlePhoneSubmit = (data: { countryCode: string; phoneNumber: string }, otp: string) => {
    setAuthData({ ...data, generatedOTP: otp })
    setStep('otp')
  }

  const handleBackToPhone = () => {
    setStep('phone')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              MuseAI
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {step === 'phone' ? 'Enter your phone number to get started' : 'Enter the verification code'}
            </p>
          </div>

          {step === 'phone' && (
            <PhoneForm onSubmit={handlePhoneSubmit} />
          )}

          {step === 'otp' && (
            <OTPForm
              authData={authData}
              onBack={handleBackToPhone}
            />
          )}
        </div>
      </div>
    </div>
  )
}
