import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '../components/providers/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MuseAI - AI Conversational Assistant',
  description: 'A modern AI chat application with OTP authentication, chatroom management, and real-time messaging',
  keywords: ['AI chat', 'Gemini', 'Next.js', 'React', 'TypeScript', 'Tailwind CSS'],
  authors: [{ name: 'MuseAI Team' }],
  robots: 'index, follow',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'hsl(var(--card))',
                color: 'hsl(var(--card-foreground))',
                border: '1px solid hsl(var(--border))',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
