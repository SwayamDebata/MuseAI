'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { ChevronDown, Phone, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { generateOTP } from '../../lib/utils'
import { PhoneFormData, phoneSchema } from '../../lib/validations'

interface Country {
  name: { common: string }
  cca2: string
  idd: { root: string; suffixes: string[] }
  flag: string
}

interface PhoneFormProps {
  onSubmit: (data: PhoneFormData, otp: string) => void
}

export default function PhoneForm({ onSubmit }: PhoneFormProps) {
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
  })

  const selectedCountryCode = watch('countryCode')

  useEffect(() => {
    fetchCountries()
  }, [])

  const fetchCountries = async () => {
    try {
      const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,idd,flag')
      const data: Country[] = await response.json()
      
      const filteredCountries = data
        .filter(country => country.idd?.root && country.idd?.suffixes?.length > 0)
        .sort((a, b) => a.name.common.localeCompare(b.name.common))
      
      setCountries(filteredCountries)
      
      const us = filteredCountries.find(c => c.cca2 === 'US')
      if (us) {
        setValue('countryCode', `${us.idd.root}${us.idd.suffixes[0]}`)
      }
    } catch (error) {
      toast.error('Failed to load countries')
      console.error('Error fetching countries:', error)
    }
  }

  const getCountryCode = (country: Country): string => {
    return `${country.idd.root}${country.idd.suffixes[0]}`
  }

  const selectedCountry = countries.find(c => getCountryCode(c) === selectedCountryCode)

  const filteredCountries = countries.filter(country =>
    country.name.common.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getCountryCode(country).includes(searchQuery)
  )

  const handleFormSubmit = async (data: PhoneFormData) => {
    setLoading(true)
    
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const otp = generateOTP()
    toast.success(`OTP sent to ${data.countryCode} ${data.phoneNumber}`)
    toast.success(`Your OTP is: ${otp}`, { duration: 10000 }) 
    
    onSubmit(data, otp)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Country & Phone Number
        </label>
        
        <div className="flex gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[120px]"
            >
              <span className="text-lg">{selectedCountry?.flag || '🌍'}</span>
              <span className="text-sm">{selectedCountryCode || '+1'}</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-hidden">
                <div className="p-2">
                  <input
                    type="text"
                    placeholder="Search countries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {filteredCountries.map((country) => (
                    <button
                      key={country.cca2}
                      type="button"
                      onClick={() => {
                        setValue('countryCode', getCountryCode(country))
                        setShowDropdown(false)
                        setSearchQuery('')
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-left text-sm"
                    >
                      <span className="text-lg">{country.flag}</span>
                      <span className="flex-1 truncate">{country.name.common}</span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {getCountryCode(country)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="tel"
                placeholder="Phone number"
                {...register('phoneNumber')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {errors.countryCode && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.countryCode.message}
          </p>
        )}
        {errors.phoneNumber && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.phoneNumber.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting || loading}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {(isSubmitting || loading) && (
          <Loader2 className="w-4 h-4 animate-spin" />
        )}
        {loading ? 'Sending OTP...' : 'Send OTP'}
      </button>

      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowDropdown(false)
            setSearchQuery('')
          }}
        />
      )}
    </form>
  )
}
