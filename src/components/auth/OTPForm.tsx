'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { ArrowLeft, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { OTPFormData, otpSchema } from '../../lib/validations'
import { useAuthStore } from '../../stores/authStore'
import { useChatStore } from '../../stores/chatStore'

interface OTPFormProps {
  authData: {
    countryCode: string
    phoneNumber: string
    generatedOTP?: string
  }
  onBack: () => void
}

export default function OTPForm({ authData, onBack }: OTPFormProps) {
  const [otp, setOTP] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const { login } = useAuthStore()
  const { loginToCometChat } = useChatStore()

  const {
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    setValue,
    watch,
  } = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  })

  const currentOtpValue = watch('otp')

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    setValue('otp', otp.join(''))
  }, [otp, setValue])

  const handleOTPChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pastedOTP = value.slice(0, 6).split('')
      const newOTP = [...otp]
      pastedOTP.forEach((digit, i) => {
        if (index + i < 6 && /^\d$/.test(digit)) {
          newOTP[index + i] = digit
        }
      })
      setOTP(newOTP)
      
      const nextIndex = Math.min(index + pastedOTP.length, 5)
      inputRefs.current[nextIndex]?.focus()
      return
    }

    if (!/^\d*$/.test(value)) return

    const newOTP = [...otp]
    newOTP[index] = value
    setOTP(newOTP)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    if (errors.otp) {
      clearErrors('otp')
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleFormSubmit = async (data: OTPFormData) => {
    const otpValue = data.otp
    
    setLoading(true)

    await new Promise(resolve => setTimeout(resolve, 1000))

    if (otpValue === authData.generatedOTP) {
      const user = {
        id: `user-${Date.now()}`,
        phone: authData.phoneNumber,
        countryCode: authData.countryCode,
      }

      login(user)
      
      try {
        console.log('OTP form CometChat login starting...');
        const fullPhoneNumber = `${authData.countryCode}${authData.phoneNumber}`;
        console.log('Full phone number for CometChat:', fullPhoneNumber);
        
        const { initializeCometChat } = useChatStore.getState();
        await initializeCometChat();
        
        const cometChatSuccess = await loginToCometChat(fullPhoneNumber, `User ${authData.phoneNumber}`);
        
        if (cometChatSuccess) {
          console.log('✅ CometChat login successful');
          toast.success('Successfully logged in!');
        } else {
          console.log('❌ CometChat login failed');
          toast.success('Logged in, but some features may be limited');
        }
      } catch (error) {
        console.error('❌ CometChat login error:', error);
        toast.success('Logged in, but some features may be limited');
      }
    } else {
      setError('otp', { message: 'Invalid OTP. Please try again.' })
      toast.error('Invalid OTP')
    }

    setLoading(false)
  }

  const resendOTP = () => {
    setOTP(['', '', '', '', '', ''])
    inputRefs.current[0]?.focus()
    
    toast.success(`New OTP sent to ${authData.countryCode} ${authData.phoneNumber}`)
    if (authData.generatedOTP) {
      toast.success(`Your new OTP is: ${authData.generatedOTP}`, { duration: 10000 })
    }
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to phone number
      </button>

      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          We sent a verification code to
        </p>
        <p className="font-medium text-gray-900 dark:text-white">
          {authData.countryCode} {authData.phoneNumber}
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Enter verification code
            </label>
            
            <div className="flex gap-2 justify-center">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleOTPChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ))}
            </div>

            {errors.otp && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 text-center">
                {errors.otp.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || otp.join('').length !== 6}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </form>

      <div className="text-center">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Didn't receive the code?{' '}
        </span>
        <button
          type="button"
          onClick={resendOTP}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
        >
          Resend
        </button>
      </div>
    </div>
  )
}
