import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { geminiAI } from '../lib/geminiAI'
import CometChatManager, { createValidUID } from '../lib/cometchat'

export interface Message {
  id: string
  content: string
  sender: 'user' | 'ai'
  timestamp: Date
  senderName?: string
  senderId?: string
  isAI?: boolean
  type?: string
  image?: string
  isAICommand?: boolean
}

export interface Chatroom {
  id: string
  title: string
  createdAt: Date
  messages: Message[]
  lastMessage?: Message
  isGroupChat?: boolean
  cometChatGuid?: string
}

interface ChatState {
  chatrooms: Chatroom[]
  currentChatroom: Chatroom | null
  isTyping: boolean
  searchQuery: string
  isCometChatInitialized: boolean
  currentUser: any | null
  
  createChatroom: (title: string, isGroupChat?: boolean) => Promise<Chatroom>
  deleteChatroom: (id: string) => void
  selectChatroom: (id: string) => Promise<void>
  sendMessage: (content: string, image?: string) => Promise<void>
  setTyping: (typing: boolean) => void
  setSearchQuery: (query: string) => void
  loadMoreMessages: () => void
  generateAIResponse: (userMessage: string, chatroomId: string) => Promise<void>
  
  initializeCometChat: () => Promise<boolean>
  loginToCometChat: (phoneNumber: string, name?: string) => Promise<boolean>
  logoutFromCometChat: () => Promise<void>
  joinChatroom: (chatroomId: string) => Promise<boolean>
  sendCometChatMessage: (message: string) => Promise<void>
  loadCometChatMessages: (chatroomId: string) => Promise<void>
  setCurrentUser: (user: any) => void
  handleIncomingCometChatMessage: (message: any) => void
  checkCometChatAuth: () => Promise<void>
  
  discoverPublicGroups: () => Promise<void>
  joinExistingGroup: (groupGuid: string, groupName: string) => Promise<boolean>
  
  filteredChatrooms: () => Chatroom[]
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chatrooms: [],
      currentChatroom: null,
      isTyping: false,
      searchQuery: '',
      isCometChatInitialized: false,
      currentUser: null,
      
      createChatroom: async (title: string, isGroupChat: boolean = true): Promise<Chatroom> => {
        const chatroomId = `chatroom-${Date.now()}`;
        const cometChatGuid = isGroupChat ? `group-${Date.now()}` : chatroomId;
        
        const newChatroom: Chatroom = {
          id: chatroomId,
          title,
          createdAt: new Date(),
          messages: [],
          isGroupChat,
          cometChatGuid,
        };
        
        // Create group in CometChat if it's a group chat
        if (isGroupChat && get().isCometChatInitialized) {
          const cometChatManager = CometChatManager.getInstance();
          await cometChatManager.createGroup(cometChatGuid, title);
        }
        
        set((state) => ({
          chatrooms: [newChatroom, ...state.chatrooms],
          currentChatroom: newChatroom,
        }));
        
        return newChatroom;
      },
      
      deleteChatroom: (id: string) => {
        set((state) => ({
          chatrooms: state.chatrooms.filter((room) => room.id !== id),
          currentChatroom: state.currentChatroom?.id === id ? null : state.currentChatroom,
        }));
      },
      
      selectChatroom: async (id: string) => {
        const chatroom = get().chatrooms.find((room) => room.id === id);
        if (chatroom) {
          console.log('Selecting chatroom:', chatroom.title);
          
          set({ currentChatroom: chatroom });
          
          // Load CometChat messages and ensure user is joined to the group
          if (chatroom.isGroupChat && get().isCometChatInitialized && chatroom.cometChatGuid) {
            console.log('Checking authentication before loading messages...');
            
            // First check if user is authenticated
            const { currentUser } = get();
            if (!currentUser) {
              console.log('No current user, checking authentication status...');
              await get().checkCometChatAuth();
              
              // Check again after auth check
              const { currentUser: updatedUser } = get();
              if (!updatedUser) {
                console.log('User not authenticated to CometChat, skipping message loading');
                return;
              }
            }
            
            console.log('User authenticated, ensuring user is joined to group and loading messages...');
            
            // First ensure user is joined to the group, then load messages
            get().joinChatroom(id).then((joinSuccess) => {
              console.log('Join chatroom result:', joinSuccess);
              
              // Always try to load messages regardless of join result
              // (join might "fail" if user is already joined)
              console.log('Loading messages for chatroom...');
              get().loadCometChatMessages(id).catch((loadError) => {
                console.error('Failed to load messages:', loadError);
              });
            }).catch((joinError) => {
              console.error('Join chatroom error:', joinError);
              
              // Still try to load messages even if join fails
              console.log('Still attempting to load messages despite join error...');
              get().loadCometChatMessages(id).catch((loadError) => {
                console.error('Failed to load messages after join error:', loadError);
              });
            });
          }
        }
      },
      
      // Legacy sendMessage - now use sendCometChatMessage instead
      sendMessage: async (content: string, image?: string): Promise<void> => {
        console.warn('sendMessage is deprecated. Use sendCometChatMessage instead.');
        // Fallback to CometChat message sending
        await get().sendCometChatMessage(content);
      },
      
      setTyping: (typing: boolean) => {
        set({ isTyping: typing })
      },
      
      setSearchQuery: (query: string) => {
        set({ searchQuery: query })
      },
      
      loadMoreMessages: async () => {
        const { currentChatroom } = get()
        if (!currentChatroom?.cometChatGuid) {
          console.log('No current chatroom or CometChat GUID available for loading more messages')
          return
        }
        
        try {
          const cometChatManager = CometChatManager.getInstance()
          // In a real implementation, you'd track the last message ID for pagination
          const messages = await cometChatManager.fetchGroupMessages(currentChatroom.cometChatGuid, 20)
          
          // For now, just log that we're trying to load more
          console.log('Loading more messages from CometChat for:', currentChatroom.title)
          
          // Real pagination implementation would go here
          // This would require tracking message cursors/pagination tokens
        } catch (error) {
          console.error('Failed to load more messages:', error)
        }
      },

      // Legacy generateAIResponse - now handled within sendCometChatMessage
      generateAIResponse: async (userMessage: string, chatroomId: string) => {
        console.warn('generateAIResponse is deprecated. AI responses are now handled automatically in sendCometChatMessage.');
        // This method is kept for backward compatibility but does nothing
        // since AI responses are now sent through CometChat in sendCometChatMessage
      },
      
      filteredChatrooms: () => {
        const { chatrooms, searchQuery } = get()
        if (!searchQuery) return chatrooms
        
        return chatrooms.filter(room => 
          room.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          room.messages.some(msg => 
            msg.content.toLowerCase().includes(searchQuery.toLowerCase())
          )
        )
      },
      
      // CometChat methods
      initializeCometChat: async (): Promise<boolean> => {
        try {
          const cometChatManager = CometChatManager.getInstance();
          
          console.log('Attempting to initialize CometChat...');
          const initialized = await cometChatManager.initialize();
          
          console.log('CometChat initialization result:', initialized);
          set({ isCometChatInitialized: initialized });
          
          return initialized;
        } catch (error) {
          console.error('CometChat initialization error:', error);
          set({ isCometChatInitialized: false });
          return false;
        }
      },
      
      loginToCometChat: async (phoneNumber: string, name: string = 'User'): Promise<boolean> => {
        try {
          const cometChatManager = CometChatManager.getInstance();
          
          // First ensure CometChat is initialized
          if (!get().isCometChatInitialized) {
            console.log('CometChat not initialized, initializing now...');
            const initSuccess = await get().initializeCometChat();
            if (!initSuccess) {
              console.error('Failed to initialize CometChat');
              return false;
            }
          }
          
          // Create a valid UID from phone number
          const validUID = createValidUID(phoneNumber);
          console.log('Attempting to login user:', validUID);
          
          // First check if user is already logged in with the same UID
          const existingUser = await cometChatManager.getCurrentUser();
          if (existingUser && existingUser.getUid() === validUID) {
            console.log('User already logged in with same UID:', validUID);
            set({ currentUser: { uid: validUID, name: existingUser.getName(), originalPhone: phoneNumber } });
            
            // Setup message listener if not already set
            await cometChatManager.setupMessageListener('chat-listener', (message: any) => {
              get().handleIncomingCometChatMessage(message);
            });
            
            return true;
          }
          
          // Logout any existing user first if different UID
          if (existingUser && existingUser.getUid() !== validUID) {
            console.log('Different user logged in, logging out first:', existingUser.getUid());
            await cometChatManager.logoutUser();
          }
          
          // Check if user exists in CometChat
          const userExists = await cometChatManager.userExists(validUID);
          console.log('User exists check result:', { uid: validUID, exists: userExists });
          
          // Create user only if they don't exist
          if (!userExists) {
            console.log('Creating new user in CometChat:', validUID);
            try {
              const createResult = await cometChatManager.createUser(validUID, name);
              console.log('User creation result:', createResult ? 'Success' : 'Failed');
            } catch (createError) {
              console.error('User creation failed:', createError);
              // Continue to login attempt even if creation fails (user might already exist)
            }
          } else {
            console.log('User already exists in CometChat, skipping creation');
          }
          
          // Login the user
          console.log('Attempting to login user:', validUID);
          const user = await cometChatManager.loginUser(validUID);
          
          if (user) {
            console.log('✅ User logged in successfully:', user.getUid());
            set({ currentUser: { uid: validUID, name: user.getName(), originalPhone: phoneNumber } });
            
            // Setup message listener
            console.log('Setting up message listener...');
            await cometChatManager.setupMessageListener('chat-listener', (message: any) => {
              get().handleIncomingCometChatMessage(message);
            });
            
            console.log('✅ Login and message listener setup complete');
            return true;
          }
          
          console.error('❌ Login failed: No user returned');
          return false;
        } catch (error) {
          console.error('❌ CometChat login failed:', error);
          
          // Try to extract more specific error information
          if (error && typeof error === 'object') {
            console.error('Error details:', {
              message: (error as any).message,
              code: (error as any).code,
              details: (error as any).details
            });
          }
          
          return false;
        }
      },
      
      logoutFromCometChat: async (): Promise<void> => {
        try {
          const cometChatManager = CometChatManager.getInstance();
          await cometChatManager.removeMessageListener('chat-listener');
          await cometChatManager.logoutUser();
          set({ currentUser: null, isCometChatInitialized: false });
          console.log('Logged out from CometChat successfully');
        } catch (error) {
          console.error('CometChat logout failed:', error);
        }
      },
      
      joinChatroom: async (chatroomId: string): Promise<boolean> => {
        try {
          const { chatrooms, isCometChatInitialized, currentUser } = get();
          
          console.log('Joining chatroom:', chatroomId);
          console.log('CometChat initialized:', isCometChatInitialized);
          console.log('Current user:', currentUser);
          
          if (!isCometChatInitialized) {
            console.log('CometChat not initialized, attempting to initialize...');
            const initSuccess = await get().initializeCometChat();
            if (!initSuccess) {
              console.error('Failed to initialize CometChat for group join');
              return false;
            }
          }
          
          if (!currentUser) {
            console.error('No current user logged in for group join - checking authentication...');
            await get().checkCometChatAuth();
            
            // Check again after auth check
            const { currentUser: updatedUser } = get();
            if (!updatedUser) {
              console.error('User authentication failed for group join');
              return false;
            }
          }
          
          const chatroom = chatrooms.find(room => room.id === chatroomId);
          if (!chatroom?.cometChatGuid) {
            console.error('No chatroom found or missing CometChat GUID:', chatroomId);
            return false;
          }
          
          console.log('Attempting to join group:', chatroom.cometChatGuid);
          const cometChatManager = CometChatManager.getInstance();
          const group = await cometChatManager.joinGroup(chatroom.cometChatGuid);
          
          const success = !!group;
          console.log('Group join result:', success ? 'Success' : 'Failed');
          
          return success;
        } catch (error) {
          console.error('Failed to join chatroom:', error);
          
          // Check if this is an authentication error
          if (error && typeof error === 'object' && (error as any).message?.includes('USER_NOT_LOGED_IN')) {
            console.log('Authentication error detected, attempting to re-authenticate...');
            await get().checkCometChatAuth();
          }
          
          return false;
        }
      },
      
      sendCometChatMessage: async (message: string): Promise<void> => {
        try {
          const { currentChatroom, currentUser, isCometChatInitialized } = get();
          
          console.log('Sending message:', { message, currentChatroom: currentChatroom?.title, currentUser: currentUser?.uid, isCometChatInitialized });
          
          if (!currentChatroom?.cometChatGuid) {
            console.error('No active chatroom with CometChat GUID');
            throw new Error('No active chatroom');
          }
          
          if (!currentUser) {
            console.error('No current user logged in');
            throw new Error('User not logged in');
          }
          
          if (!isCometChatInitialized) {
            console.error('CometChat not initialized');
            throw new Error('CometChat not initialized');
          }

          const cometChatManager = CometChatManager.getInstance();
          
          // Check if user is still logged in to CometChat
          const loggedInUser = await cometChatManager.getCurrentUser();
          if (!loggedInUser) {
            console.error('User not logged in to CometChat, attempting re-authentication');
            
            // Try to re-authenticate
            const reAuthSuccess = await get().loginToCometChat(currentUser.originalPhone, currentUser.name);
            if (!reAuthSuccess) {
              throw new Error('Re-authentication failed');
            }
            
            // Refresh the logged in user after re-auth
            const reAuthUser = await cometChatManager.getCurrentUser();
            if (!reAuthUser) {
              throw new Error('Still not logged in after re-authentication');
            }
          }
          
          // Check if it's an AI command
          const isAICommand = message.startsWith('/askAI ') || message.startsWith('\\askAI ');
          
          if (isAICommand) {
            // First send the original AI command as a regular user message so everyone can see it
            console.log('Sending AI command as regular message:', message);
            const commandMessage = await cometChatManager.sendGroupMessage(
              currentChatroom.cometChatGuid,
              message,
              { isAICommand: true, type: 'ai_command' }
            );
            
            console.log('AI command sent, message ID:', commandMessage?.getId());
            
            // Immediately add the command message to the sender's view
            if (commandMessage) {
              const commandMessageForSender = {
                id: commandMessage.getId(),
                content: message,
                sender: 'user' as const,
                timestamp: new Date(commandMessage.getSentAt() * 1000),
                senderName: currentUser.name,
                senderId: currentUser.uid,
                isAI: false,
                type: 'ai_command',
                isAICommand: true
              };
              
              // Add to current chatroom immediately for sender
              set((state) => {
                if (state.currentChatroom) {
                  return {
                    ...state,
                    currentChatroom: {
                      ...state.currentChatroom,
                      messages: [...state.currentChatroom.messages, commandMessageForSender],
                      lastMessage: commandMessageForSender,
                    }
                  };
                }
                return state;
              });
            }
            
            // Set typing indicator for AI
            set({ isTyping: true });
            
            // Extract the actual question from the command
            const aiQuestion = message.replace(/^[/\\]askAI\s+/, '');
            
            console.log('Original message:', message);
            console.log('Extracted AI question:', aiQuestion);
            
            // Generate AI response
            try {
              console.log('Calling Gemini AI with question:', aiQuestion);
              const aiResponse = await geminiAI.generateResponse(aiQuestion);
              
              console.log('AI Response received:', {
                content: aiResponse.content.substring(0, 100) + '...',
                error: aiResponse.error,
                fallback: aiResponse.fallback
              });
              
              // Send AI response to CometChat with metadata - this will appear on left for everyone
              const sentAIMessage = await cometChatManager.sendGroupMessage(
                currentChatroom.cometChatGuid,
                `🤖 AI: ${aiResponse.content}`,
                { 
                  isAIResponse: true, 
                  type: 'ai_response', 
                  originalQuestion: aiQuestion,
                  senderName: 'AI Assistant' 
                }
              );
              
              console.log('AI response sent successfully, message ID:', sentAIMessage?.getId());
              
              // Immediately add the AI response to the sender's view
              if (sentAIMessage) {
                const aiMessageForSender = {
                  id: sentAIMessage.getId(),
                  content: `🤖 AI: ${aiResponse.content}`,
                  sender: 'user' as const, // AI messages appear on left for everyone
                  timestamp: new Date(sentAIMessage.getSentAt() * 1000),
                  senderName: 'AI Assistant',
                  senderId: sentAIMessage.getSender().getUid(),
                  isAI: true,
                  type: 'ai_response',
                  isAICommand: false
                };
                
                // Add to current chatroom immediately for sender
                set((state) => {
                  if (state.currentChatroom) {
                    return {
                      ...state,
                      currentChatroom: {
                        ...state.currentChatroom,
                        messages: [...state.currentChatroom.messages, aiMessageForSender],
                        lastMessage: aiMessageForSender,
                      }
                    };
                  }
                  return state;
                });
              }
            } catch (aiError) {
              console.error('AI response generation failed:', aiError);
              // Send error message to CometChat
              const errorMessage = await cometChatManager.sendGroupMessage(
                currentChatroom.cometChatGuid,
                "🤖 AI: Sorry, I couldn't process your request at the moment. Please try again.",
                { 
                  isAIResponse: true, 
                  type: 'ai_error',
                  senderName: 'AI Assistant'
                }
              );
              
              // Add error message to sender's view
              if (errorMessage) {
                const errorMessageForSender = {
                  id: errorMessage.getId(),
                  content: "🤖 AI: Sorry, I couldn't process your request at the moment. Please try again.",
                  sender: 'user' as const,
                  timestamp: new Date(errorMessage.getSentAt() * 1000),
                  senderName: 'AI Assistant',
                  senderId: errorMessage.getSender().getUid(),
                  isAI: true,
                  type: 'ai_error',
                  isAICommand: false
                };
                
                set((state) => {
                  if (state.currentChatroom) {
                    return {
                      ...state,
                      currentChatroom: {
                        ...state.currentChatroom,
                        messages: [...state.currentChatroom.messages, errorMessageForSender],
                        lastMessage: errorMessageForSender,
                      }
                    };
                  }
                  return state;
                });
              }
            } finally {
              // Remove typing indicator
              set({ isTyping: false });
            }
          } else {
            // Send regular message
            console.log('Sending regular message to group:', currentChatroom.cometChatGuid);
            const sentMessage = await cometChatManager.sendGroupMessage(currentChatroom.cometChatGuid, message);
            console.log('Regular message sent successfully, message ID:', sentMessage?.getId());
            
            // Immediately add the message to the sender's view
            if (sentMessage) {
              const messageForSender = {
                id: sentMessage.getId(),
                content: message,
                sender: 'user' as const,
                timestamp: new Date(sentMessage.getSentAt() * 1000),
                senderName: currentUser.name,
                senderId: currentUser.uid,
                isAI: false,
                type: 'text',
                isAICommand: false
              };
              
              // Add to current chatroom immediately for sender
              set((state) => {
                if (state.currentChatroom) {
                  return {
                    ...state,
                    currentChatroom: {
                      ...state.currentChatroom,
                      messages: [...state.currentChatroom.messages, messageForSender],
                      lastMessage: messageForSender,
                    }
                  };
                }
                return state;
              });
              
              // Also check if message appeared via listener after a delay (for duplicate prevention)
              setTimeout(() => {
                const currentState = get();
                const messageCount = currentState.currentChatroom?.messages.filter(msg => msg.id === sentMessage.getId()).length || 0;
                if (messageCount > 1) {
                  // Remove duplicate if listener also added it
                  console.log('Removing duplicate message from listener');
                  set((state) => {
                    if (state.currentChatroom) {
                      const uniqueMessages = state.currentChatroom.messages.filter((msg, index, arr) => 
                        arr.findIndex(m => m.id === msg.id) === index
                      );
                      return {
                        ...state,
                        currentChatroom: {
                          ...state.currentChatroom,
                          messages: uniqueMessages,
                        }
                      };
                    }
                    return state;
                  });
                }
              }, 500);
            }
          }
        } catch (error) {
          console.error('Failed to send CometChat message:', error);
          set({ isTyping: false }); // Make sure to clear typing indicator on error
          throw error;
        }
      },
      
      loadCometChatMessages: async (chatroomId: string): Promise<void> => {
        try {
          const { chatrooms, currentUser } = get();
          
          // Check if user is authenticated before loading messages
          if (!currentUser) {
            console.log('No authenticated user, skipping message loading for chatroom:', chatroomId);
            return;
          }
          
          const chatroom = chatrooms.find(room => room.id === chatroomId);
          if (!chatroom?.cometChatGuid) return;
          
          const cometChatManager = CometChatManager.getInstance();
          const messages = await cometChatManager.fetchGroupMessages(chatroom.cometChatGuid, 50);
          
          // Convert CometChat messages to our format
          const convertedMessages: Message[] = messages.map((msg: any) => {
            const metadata = msg.getMetadata && msg.getMetadata() ? msg.getMetadata() : {};
            const isCurrentUser = msg.getSender().getUid() === currentUser?.uid;
            
            // Special handling for AI responses - they should always appear on the left for everyone
            let messageType: 'user' | 'ai' = 'user';
            let displaySenderName = msg.getSender().getName();
            
            if (metadata.isAIResponse) {
              messageType = 'user'; // AI responses appear on left side for everyone
              displaySenderName = 'AI Assistant';
            } else {
              messageType = 'user'; // All messages appear as user messages (positioning handled by isCurrentUser logic in UI)
            }
            
            return {
              id: msg.getId(),
              content: msg.getText ? msg.getText() : msg.getData?.text || '',
              sender: messageType,
              timestamp: new Date(msg.getSentAt() * 1000),
              senderName: displaySenderName,
              senderId: msg.getSender().getUid(),
              isAI: metadata.isAIResponse || false,
              type: metadata.type || 'text',
              isAICommand: metadata.isAICommand || false
            };
          });
          
          // Sort messages by timestamp
          convertedMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
          
          // Update chatroom with loaded messages
          set((state) => {
            const updatedChatrooms = state.chatrooms.map((room) => {
              if (room.id === chatroomId) {
                return {
                  ...room,
                  messages: convertedMessages,
                  lastMessage: convertedMessages.length > 0 ? convertedMessages[convertedMessages.length - 1] : undefined
                };
              }
              return room;
            });
            
            return {
              chatrooms: updatedChatrooms,
              currentChatroom: state.currentChatroom?.id === chatroomId 
                ? {
                    ...state.currentChatroom,
                    messages: convertedMessages,
                  }
                : state.currentChatroom,
            };
          });
        } catch (error) {
          console.error('Failed to load CometChat messages:', error);
          
          // Check if this is an authentication error
          if (error && typeof error === 'object' && 
              ((error as any).message?.includes('USER_NOT_LOGED_IN') || 
               (error as any).code === 'USER_NOT_LOGED_IN')) {
            console.log('Authentication error while loading messages, checking auth status...');
            await get().checkCometChatAuth();
          }
        }
      },
      
      setCurrentUser: (user: any) => {
        set({ currentUser: user });
      },
      
      checkCometChatAuth: async (): Promise<void> => {
        try {
          const cometChatManager = CometChatManager.getInstance();
          const authStatus = await cometChatManager.checkAuthStatus();
          
          console.log('CometChat Auth Status:', authStatus);
          
          if (!authStatus.isLoggedIn) {
            console.warn('User not logged in to CometChat');
            // Clear the current user state if not logged in
            set({ currentUser: null });
            
            // Optionally try to re-authenticate using stored user data
            const { currentUser } = get();
            if (currentUser?.originalPhone) {
              console.log('Attempting to re-authenticate user:', currentUser.originalPhone);
              const success = await get().loginToCometChat(currentUser.originalPhone, currentUser.name);
              if (success) {
                console.log('Re-authentication successful');
              } else {
                console.error('Re-authentication failed');
                // Clear the stored user data if re-auth fails
                set({ currentUser: null });
              }
            }
          } else {
            console.log('User is logged in to CometChat:', authStatus.user);
            // Update the current user state with the authenticated user info
            const { currentUser } = get();
            if (currentUser && currentUser.uid === authStatus.user.uid) {
              // User state is consistent
            } else {
              // Update user state to match authenticated user
              set({ 
                currentUser: { 
                  uid: authStatus.user.uid, 
                  name: authStatus.user.name,
                  originalPhone: currentUser?.originalPhone || authStatus.user.uid
                } 
              });
            }
          }
        } catch (error) {
          console.error('Error checking CometChat auth:', error);
          // Clear user state on auth check error
          set({ currentUser: null });
        }
      },
      
      handleIncomingCometChatMessage: (message: any) => {
        const { currentChatroom, currentUser, chatrooms } = get();
        
        console.log('Handling incoming CometChat message:', {
          messageId: message.getId(),
          sender: message.getSender().getName(),
          senderUid: message.getSender().getUid(),
          currentUserUid: currentUser?.uid,
          content: message.getText(),
          receiverId: message.getReceiverId(),
          receiverType: message.getReceiverType()
        });
        
        // Find the chatroom for this message
        const messageGuid = message.getReceiverId();
        console.log('Looking for chatroom with GUID:', messageGuid);
        console.log('Available chatrooms:', chatrooms.map(room => ({ id: room.id, title: room.title, guid: room.cometChatGuid })));
        
        const targetChatroom = chatrooms.find(room => room.cometChatGuid === messageGuid);
        
        if (!targetChatroom) {
          console.log('No target chatroom found for message GUID:', messageGuid);
          console.log('Available GUIDs:', chatrooms.map(room => room.cometChatGuid));
          return;
        }
        
        console.log('Found target chatroom:', targetChatroom.title);
        
        // Check if this message already exists (to prevent duplicates from sender)
        const messageExists = targetChatroom.messages.some(existingMsg => existingMsg.id === message.getId());
        if (messageExists) {
          console.log('Message already exists in chatroom, skipping duplicate from listener');
          return;
        }
        
        // Convert CometChat message to our format
        const metadata = message.getMetadata && message.getMetadata() ? message.getMetadata() : {};
        const isCurrentUser = message.getSender().getUid() === currentUser?.uid;
        
        console.log('Message metadata:', metadata);
        console.log('Is current user:', isCurrentUser);
        console.log('Current user UID:', currentUser?.uid);
        console.log('Message sender UID:', message.getSender().getUid());
        
        // Skip messages from current user ONLY if they're regular messages or AI commands
        // (these are already handled by immediate adding in sendCometChatMessage)
        // AI responses should always be processed through the listener for everyone
        if (isCurrentUser && !metadata.isAIResponse) {
          console.log('Skipping own message from listener to prevent duplicate');
          return;
        }
        
        // If it's not from current user, always process the message
        if (!isCurrentUser) {
          console.log('Processing message from other user:', message.getSender().getName());
        }
        
        // Special handling for AI responses - they should always appear on the left for everyone
        let messageType: 'user' | 'ai' = 'user';
        let displaySenderName = message.getSender().getName();
        
        if (metadata.isAIResponse) {
          messageType = 'user'; // AI responses appear on left side for everyone
          displaySenderName = 'AI Assistant';
        } else if (metadata.isAICommand) {
          messageType = isCurrentUser ? 'user' : 'user'; // AI commands appear as regular messages
        } else {
          messageType = isCurrentUser ? 'user' : 'user'; // Regular messages
        }
        
        const newMessage: Message = {
          id: message.getId(),
          content: message.getText ? message.getText() : message.getData?.text || '',
          sender: messageType,
          timestamp: new Date(message.getSentAt() * 1000),
          senderName: displaySenderName,
          senderId: message.getSender().getUid(),
          isAI: metadata.isAIResponse || false,
          type: metadata.type || 'text',
          isAICommand: metadata.isAICommand || false
        };
        
        console.log('Created message object:', newMessage);
        console.log('Will add message to chatroom:', targetChatroom.title);
        
        set((state) => {
          const updatedChatrooms = state.chatrooms.map((room) => {
            if (room.id === targetChatroom.id) {
              // Double-check for duplicates before adding
              const messageExists = room.messages.some(existingMsg => existingMsg.id === newMessage.id);
              if (messageExists) {
                console.log('Message already exists, skipping duplicate');
                return room;
              }
              
              console.log('Adding message to room:', room.title, 'Message count before:', room.messages.length);
              const updatedRoom = {
                ...room,
                messages: [...room.messages, newMessage],
                lastMessage: newMessage,
              };
              console.log('Message count after:', updatedRoom.messages.length);
              return updatedRoom;
            }
            return room;
          });
          
          const updatedCurrentChatroom = state.currentChatroom?.id === targetChatroom.id 
            ? {
                ...state.currentChatroom,
                messages: [...(state.currentChatroom.messages || []), newMessage],
                lastMessage: newMessage,
              }
            : state.currentChatroom;
          
          console.log('Updated chatroom messages count:', updatedCurrentChatroom?.messages?.length);
          console.log('Current chatroom ID:', state.currentChatroom?.id);
          console.log('Target chatroom ID:', targetChatroom.id);
          
          return {
            chatrooms: updatedChatrooms,
            currentChatroom: updatedCurrentChatroom,
          };
        });
      },
      
      // Group discovery methods
      discoverPublicGroups: async (): Promise<void> => {
        try {
          const cometChatManager = CometChatManager.getInstance();
          const publicGroups = await cometChatManager.getPublicGroups();
          
          // Convert CometChat groups to local chatrooms for discovery
          const discoveredChatrooms: Chatroom[] = publicGroups.map((group: any) => ({
            id: `discovered-${group.getGuid()}`,
            title: group.getName(),
            createdAt: new Date(group.getCreatedAt() * 1000),
            messages: [],
            isGroupChat: true,
            cometChatGuid: group.getGuid(),
          }));
          
          // Filter out groups we're already part of
          const existingGuids = get().chatrooms
            .filter(room => room.cometChatGuid)
            .map(room => room.cometChatGuid);
          
          const newGroups = discoveredChatrooms.filter(
            room => !existingGuids.includes(room.cometChatGuid)
          );
          
          // Add discovered groups to the chatrooms list
          if (newGroups.length > 0) {
            set((state) => ({
              chatrooms: [...state.chatrooms, ...newGroups],
            }));
          }
          
          console.log(`Discovered ${newGroups.length} new public groups`);
        } catch (error) {
          console.error('Failed to discover public groups:', error);
        }
      },
      
      joinExistingGroup: async (groupGuid: string, groupName: string): Promise<boolean> => {
        try {
          console.log('Joining existing group:', { groupGuid, groupName });
          
          const { isCometChatInitialized, currentUser } = get();
          
          if (!isCometChatInitialized) {
            console.error('CometChat not initialized');
            return false;
          }
          
          if (!currentUser) {
            console.error('No current user');
            return false;
          }
          
          const cometChatManager = CometChatManager.getInstance();
          console.log('Attempting to join group through CometChat...');
          
          const group = await cometChatManager.joinGroup(groupGuid);
          
          if (group) {
            console.log('✅ Successfully joined group:', group.getGuid ? group.getGuid() : groupGuid);
            
            // Create a proper chatroom entry for the joined group
            const joinedChatroom: Chatroom = {
              id: `joined-${groupGuid}`,
              title: groupName,
              createdAt: new Date(),
              messages: [],
              isGroupChat: true,
              cometChatGuid: groupGuid,
            };
            
            // Remove from discovered and add as a proper chatroom
            set((state) => {
              const filteredChatrooms = state.chatrooms.filter(
                room => room.cometChatGuid !== groupGuid
              );
              
              return {
                chatrooms: [joinedChatroom, ...filteredChatrooms],
                currentChatroom: joinedChatroom,
              };
            });
            
            // Load existing messages
            console.log('Loading existing messages for joined group...');
            await get().loadCometChatMessages(joinedChatroom.id);
            
            return true;
          }
          
          console.error('❌ Failed to join group - no group returned');
          return false;
        } catch (error) {
          console.error('❌ Failed to join existing group:', error);
          return false;
        }
      },
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
