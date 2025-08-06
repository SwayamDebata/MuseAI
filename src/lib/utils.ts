import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(date: Date | string | number): string {
  const dateObj = date instanceof Date ? date : new Date(date)
  
  if (isNaN(dateObj.getTime())) {
    return '--:--'
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj)
}

export function formatDate(date: Date | string | number): string {
  const dateObj = date instanceof Date ? date : new Date(date)
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date'
  }

  const now = new Date()
  const diff = now.getTime() - dateObj.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return 'Today'
  } else if (days === 1) {
    return 'Yesterday'
  } else if (days < 7) {
    return `${days} days ago`
  } else {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(dateObj)
  }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    try {
      document.execCommand('copy')
      return true
    } catch (err) {
      return false
    } finally {
      document.body.removeChild(textArea)
    }
  }
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

export function ensureDate(date: Date | string | number | undefined | null): Date {
  if (!date) {
    return new Date()
  }
  
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? new Date() : date
  }
  
  const converted = new Date(date)
  return isNaN(converted.getTime()) ? new Date() : converted
}

export function safeFormatDate(date: any): string {
  return formatDate(ensureDate(date))
}

export function safeFormatTime(date: any): string {
  return formatTime(ensureDate(date))
}
