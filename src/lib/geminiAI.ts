// AI Service for Gemini Integration
export interface AIResponse {
  content: string
  error?: string
  fallback?: boolean
}

export class GeminiAIService {
  async generateResponse(message: string, conversationHistory: Array<{role: string, content: string}> = []): Promise<AIResponse> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationHistory
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      
      return {
        content: data.content,
        fallback: data.fallback || false
      }

    } catch (error) {
      console.error('Gemini AI Service Error:', error)
      
      return {
        content: "I apologize, but I'm having trouble generating a response right now. Please try again in a moment.",
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Singleton instance
export const geminiAI = new GeminiAIService()
