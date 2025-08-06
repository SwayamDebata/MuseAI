import { NextRequest, NextResponse } from 'next/server'

interface ChatRequest {
  message: string
  conversationHistory?: Array<{role: string, content: string}>
}

export async function POST(request: NextRequest) {
  let requestBody: ChatRequest
  
  try {
    requestBody = await request.json()
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    )
  }

  const { message, conversationHistory = [] } = requestBody

  if (!message || typeof message !== 'string') {
    return NextResponse.json(
      { error: 'Message is required and must be a string' },
      { status: 400 }
    )
  }

  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    console.log('No API key found, using mock response')
    const mockResponse = generateEnhancedMockResponse(message, conversationHistory)
    return NextResponse.json({ content: mockResponse })
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            ...conversationHistory.map(msg => ({
              role: msg.role === 'user' ? 'user' : 'model',
              parts: [{ text: msg.content }]
            })),
            {
              role: 'user',
              parts: [{ text: message }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            }
          ]
        })
      }
    )

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return NextResponse.json({
        content: data.candidates[0].content.parts[0].text
      })
    } else {
      throw new Error('No valid response from Gemini API')
    }

  } catch (error) {
    console.error('Gemini API Error:', error)
    
    const { message, conversationHistory = [] }: ChatRequest = await request.json()
    const mockResponse = generateEnhancedMockResponse(message, conversationHistory)
    
    return NextResponse.json({ 
      content: mockResponse,
      fallback: true 
    })
  }
}

function generateEnhancedMockResponse(message: string, conversationHistory: Array<{role: string, content: string}>): string {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    const greetings = [
      "Hello! I'm Gemini, your AI assistant. I'm here to help you with questions, creative tasks, learning, and engaging conversations. What would you like to explore today?",
      "Hi there! I'm excited to chat with you. I can help with a wide range of topics - from answering questions to brainstorming ideas. What's on your mind?",
      "Hey! Great to meet you. As your AI assistant, I'm ready to help with whatever you'd like to discuss or work on together.",
    ]
    return greetings[Math.floor(Math.random() * greetings.length)]
  }

  if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
    return "I'm here to assist you with a wide variety of tasks! I can help with:\n\n• Answering questions and explaining concepts\n• Creative writing and brainstorming\n• Problem-solving and analysis\n• Learning and education\n• Programming and technical topics\n• General conversation and discussion\n\nWhat specific area would you like help with?"
  }

  if (lowerMessage.includes('code') || lowerMessage.includes('programming') || lowerMessage.includes('develop')) {
    return "I'd be happy to help with programming! I can assist with code review, debugging, explaining concepts, suggesting best practices, or helping you learn new technologies. What programming challenge are you working on?"
  }

  if (lowerMessage.includes('creative') || lowerMessage.includes('write') || lowerMessage.includes('story')) {
    return "I love helping with creative projects! Whether it's writing, brainstorming ideas, storytelling, or artistic concepts, I'm here to collaborate with you. What kind of creative work are you interested in?"
  }

  if (lowerMessage.includes('learn') || lowerMessage.includes('study') || lowerMessage.includes('explain')) {
    return "Learning is one of my favorite topics to help with! I can break down complex concepts, provide explanations, suggest study strategies, and help you understand new subjects. What would you like to learn about?"
  }

  if (conversationHistory.length > 0) {
    const lastMessages = conversationHistory.slice(-3)
    const hasAskedFollowUp = lastMessages.some(msg => 
      msg.content.includes('more') || msg.content.includes('continue') || msg.content.includes('tell me')
    )
    
    if (hasAskedFollowUp) {
      return "Absolutely! I'd be happy to dive deeper into that topic. Let me provide more detailed insights and explore different aspects of what we've been discussing..."
    }
  }

  const thoughtfulResponses = [
    "That's a really interesting perspective! Let me share some thoughts on that and explore different angles we could consider together.",
    "I find that topic fascinating! There are several ways we could approach this, and I'd love to explore the possibilities with you.",
    "That's a great question that touches on some important concepts. Let me break this down and provide some insights that might be helpful.",
    "I appreciate you bringing this up! It's the kind of topic that can lead to really engaging discussions. Here's how I see it...",
    "That's worth exploring further! There are some interesting implications and considerations we should discuss.",
  ]

  const elaborations = [
    "What aspects of this are you most curious about?",
    "I'd love to hear your thoughts on this approach.",
    "What questions does this raise for you?",
    "How does this connect to your experience or interests?",
    "What direction would you like to take this conversation?",
  ]

  const response = thoughtfulResponses[Math.floor(Math.random() * thoughtfulResponses.length)]
  const elaboration = elaborations[Math.floor(Math.random() * elaborations.length)]

  return `${response} ${elaboration}`
}
