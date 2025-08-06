import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { geminiAI } from '../lib/geminiAI'

export interface Message {
  id: string
  content: string
  sender: 'user' | 'ai'
  timestamp: Date
  image?: string
}

export interface Chatroom {
  id: string
  title: string
  createdAt: Date
  messages: Message[]
  lastMessage?: Message
}

interface ChatState {
  chatrooms: Chatroom[]
  currentChatroom: Chatroom | null
  isTyping: boolean
  searchQuery: string
  
  createChatroom: (title: string) => Chatroom
  deleteChatroom: (id: string) => void
  selectChatroom: (id: string) => void
  sendMessage: (content: string, image?: string) => void
  setTyping: (typing: boolean) => void
  setSearchQuery: (query: string) => void
  loadMoreMessages: () => void
  generateAIResponse: (userMessage: string, chatroomId: string) => Promise<void>
  
  filteredChatrooms: () => Chatroom[]
}

const generateDummyMessages = (count: number, chatroomId: string): Message[] => {
  const messages: Message[] = []
  const now = new Date()
  
  for (let i = 0; i < count; i++) {
    messages.push({
      id: `${chatroomId}-msg-${Date.now()}-${i}`,
      content: `This is a dummy message ${i + 1} for testing pagination.`,
      sender: i % 2 === 0 ? 'user' : 'ai',
      timestamp: new Date(now.getTime() - (count - i) * 60000), 
    })
  }
  
  return messages
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chatrooms: [],
      currentChatroom: null,
      isTyping: false,
      searchQuery: '',
      
      createChatroom: (title: string) => {
        const newChatroom: Chatroom = {
          id: `chatroom-${Date.now()}`,
          title,
          createdAt: new Date(),
          messages: [],
        }
        
        set((state) => ({
          chatrooms: [newChatroom, ...state.chatrooms],
          currentChatroom: newChatroom,
        }))
        
        return newChatroom
      },
      
      deleteChatroom: (id: string) => {
        set((state) => ({
          chatrooms: state.chatrooms.filter((room) => room.id !== id),
          currentChatroom: state.currentChatroom?.id === id ? null : state.currentChatroom,
        }))
      },
      
      selectChatroom: (id: string) => {
        const chatroom = get().chatrooms.find((room) => room.id === id)
        if (chatroom) {
          set({ currentChatroom: chatroom })
        }
      },
      
      sendMessage: (content: string, image?: string) => {
        const { currentChatroom } = get()
        if (!currentChatroom) return
        
        const newMessage: Message = {
          id: `msg-${Date.now()}`,
          content,
          sender: 'user',
          timestamp: new Date(),
          image,
        }
        
        set((state) => {
          const updatedChatrooms = state.chatrooms.map((room) => {
            if (room.id === currentChatroom.id) {
              const updatedRoom = {
                ...room,
                messages: [...room.messages, newMessage],
                lastMessage: newMessage,
              }
              return updatedRoom
            }
            return room
          })
          
          return {
            chatrooms: updatedChatrooms,
            currentChatroom: {
              ...currentChatroom,
              messages: [...currentChatroom.messages, newMessage],
              lastMessage: newMessage,
            },
          }
        })
        
        get().generateAIResponse(content, currentChatroom.id)
      },
      
      setTyping: (typing: boolean) => {
        set({ isTyping: typing })
      },
      
      setSearchQuery: (query: string) => {
        set({ searchQuery: query })
      },
      
      loadMoreMessages: () => {
        const { currentChatroom } = get()
        if (!currentChatroom) return
        
        const dummyMessages = generateDummyMessages(20, currentChatroom.id)
        
        set((state) => {
          const updatedChatrooms = state.chatrooms.map((room) => {
            if (room.id === currentChatroom.id) {
              return {
                ...room,
                messages: [...dummyMessages, ...room.messages],
              }
            }
            return room
          })
          
          return {
            chatrooms: updatedChatrooms,
            currentChatroom: {
              ...currentChatroom,
              messages: [...dummyMessages, ...currentChatroom.messages],
            },
          }
        })
      },

      generateAIResponse: async (userMessage: string, chatroomId: string) => {
        set({ isTyping: true })
        
        try {
          const { chatrooms } = get()
          const chatroom = chatrooms.find(room => room.id === chatroomId)
          if (!chatroom) return
          
          const recentMessages = chatroom.messages.slice(-10)
          const conversationHistory = recentMessages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content
          }))
          
          const typingDelay = 1000 + Math.random() * 2000 
          await new Promise(resolve => setTimeout(resolve, typingDelay))
          
          const aiResponse = await geminiAI.generateResponse(userMessage, conversationHistory)
          
          if (aiResponse.content) {
            const aiMessage: Message = {
              id: `msg-${Date.now()}-ai`,
              content: aiResponse.content,
              sender: 'ai',
              timestamp: new Date(),
            }
            
            set((state) => {
              const updatedChatrooms = state.chatrooms.map((room) => {
                if (room.id === chatroomId) {
                  const updatedRoom = {
                    ...room,
                    messages: [...room.messages, aiMessage],
                    lastMessage: aiMessage,
                  }
                  return updatedRoom
                }
                return room
              })
              
              return {
                chatrooms: updatedChatrooms,
                currentChatroom: state.currentChatroom?.id === chatroomId 
                  ? {
                      ...state.currentChatroom,
                      messages: [...state.currentChatroom.messages, aiMessage],
                      lastMessage: aiMessage,
                    }
                  : state.currentChatroom,
                isTyping: false,
              }
            })
          } else {
            throw new Error('No response from AI')
          }
        } catch (error) {
          console.error('AI Response Error:', error)
          
          const errorMessage: Message = {
            id: `msg-${Date.now()}-ai-error`,
            content: "I apologize, but I'm having trouble generating a response right now. Please try again.",
            sender: 'ai',
            timestamp: new Date(),
          }
          
          set((state) => {
            const updatedChatrooms = state.chatrooms.map((room) => {
              if (room.id === chatroomId) {
                const updatedRoom = {
                  ...room,
                  messages: [...room.messages, errorMessage],
                  lastMessage: errorMessage,
                }
                return updatedRoom
              }
              return room
            })
            
            return {
              chatrooms: updatedChatrooms,
              currentChatroom: state.currentChatroom?.id === chatroomId 
                ? {
                    ...state.currentChatroom,
                    messages: [...state.currentChatroom.messages, errorMessage],
                    lastMessage: errorMessage,
                  }
                : state.currentChatroom,
              isTyping: false,
            }
          })
        }
      },
      
      filteredChatrooms: () => {
        const { chatrooms, searchQuery } = get()
        if (!searchQuery.trim()) return chatrooms
        
        return chatrooms.filter((room) =>
          room.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      },
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
