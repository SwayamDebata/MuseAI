import { NextRequest, NextResponse } from 'next/server'

interface ChatRequest {
  message: string
  conversationHistory?: Array<{role: string, content: string}>
}

export async function POST(request: Request) {
  console.log('Gemini API endpoint called');
  
  try {
    const { message } = await request.json();
    console.log('Received message:', message);
    
    console.log('Environment check:');
    console.log('- GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
    console.log('- NEXT_PUBLIC_GEMINI_API_KEY exists:', !!process.env.NEXT_PUBLIC_GEMINI_API_KEY);
    
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not found in environment variables');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const requestPayload = {
      contents: [{
        parts: [{
          text: message
        }]
      }]
    };

    console.log('Request payload:', JSON.stringify(requestPayload, null, 2));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      }
    );

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error response:', errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Response data structure:', JSON.stringify(data, null, 2));

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      console.error('No generated text found in response:', data);
      throw new Error('No text generated');
    }

    console.log('Generated text preview:', generatedText.substring(0, 100) + '...');

    return NextResponse.json({
      content: generatedText,
      error: null,
      fallback: false
    });

  } catch (error) {
    console.error('Gemini API error:', error);
    
    // Return a fallback response
    const fallbackResponse = generateEnhancedMockResponse(
      request.body ? await request.json().then(body => body.message) : 'Hello',
      []
    );
    
    return NextResponse.json({
      content: fallbackResponse,
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback: true
    });
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
