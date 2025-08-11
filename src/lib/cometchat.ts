import type { CometChat } from "@cometchat/chat-sdk-javascript";

// Debug environment variables before using them
if (typeof window !== 'undefined') {
  console.log('🔍 Environment Debug:', {
    NODE_ENV: process.env.NODE_ENV,
    APP_ID_RAW: process.env.NEXT_PUBLIC_COMETCHAT_APP_ID,
    REGION_RAW: process.env.NEXT_PUBLIC_COMETCHAT_REGION,
    AUTH_KEY_RAW: process.env.NEXT_PUBLIC_COMETCHAT_AUTH_KEY ? 'SET' : 'NOT_SET',
    ALL_ENV_KEYS: Object.keys(process.env).filter(key => key.includes('COMETCHAT'))
  });
}

export const COMETCHAT_CONFIG = {
  APP_ID: process.env.NEXT_PUBLIC_COMETCHAT_APP_ID || 
          process.env.COMETCHAT_APP_ID || 
          "2799742cbcb5084f", // Fallback to your actual app ID
  REGION: process.env.NEXT_PUBLIC_COMETCHAT_REGION || 
          process.env.COMETCHAT_REGION || 
          "in", // Fallback to your actual region
  AUTH_KEY: process.env.NEXT_PUBLIC_COMETCHAT_AUTH_KEY || 
            process.env.COMETCHAT_AUTH_KEY || 
            "48254eed861a489fafdd93a03d176e38d684a627", // Fallback to your actual auth key
};

export const createValidUID = (phoneNumber: string): string => {
  const sanitized = phoneNumber
    .replace(/[^a-zA-Z0-9]/g, '_') 
    .replace(/^_+|_+$/g, '') 
    .replace(/_+/g, '_');
  
  const uid = sanitized.match(/^[a-zA-Z0-9]/) ? sanitized : `user_${sanitized}`;
  
  console.log(`Phone: ${phoneNumber} -> UID: ${uid}`);
  return uid;
};

if (typeof window !== 'undefined') {
  console.log('✅ CometChat Config Loaded:', {
    APP_ID: COMETCHAT_CONFIG.APP_ID,
    REGION: COMETCHAT_CONFIG.REGION,
    AUTH_KEY: COMETCHAT_CONFIG.AUTH_KEY ? '***' + COMETCHAT_CONFIG.AUTH_KEY.slice(-4) : 'NOT_SET',
    IS_PRODUCTION: process.env.NODE_ENV === 'production'
  });
  
  // Validate configuration
  if (COMETCHAT_CONFIG.APP_ID === "YOUR_APP_ID" || 
      COMETCHAT_CONFIG.REGION === "YOUR_REGION" || 
      COMETCHAT_CONFIG.AUTH_KEY === "YOUR_AUTH_KEY") {
    console.error('❌ CometChat environment variables not properly configured!');
    console.error('Please check your Vercel environment variables');
  }
}

export class CometChatManager {
  private static instance: CometChatManager;
  private initialized = false;
  private CometChat: typeof CometChat | null = null;

  static getInstance(): CometChatManager {
    if (!CometChatManager.instance) {
      CometChatManager.instance = new CometChatManager();
    }
    return CometChatManager.instance;
  }

  private async loadCometChat() {
    if (typeof window === 'undefined') {
      return null;
    }
    
    if (!this.CometChat) {
      const { CometChat } = await import("@cometchat/chat-sdk-javascript");
      this.CometChat = CometChat;
    }
    return this.CometChat;
  }

  async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    try {
      const CometChat = await this.loadCometChat();
      if (!CometChat) {
        console.error("CometChat not available in server environment");
        return false;
      }

      // Validate configuration before attempting to initialize
      if (COMETCHAT_CONFIG.APP_ID === "YOUR_APP_ID" || 
          COMETCHAT_CONFIG.REGION === "YOUR_REGION" || 
          COMETCHAT_CONFIG.AUTH_KEY === "YOUR_AUTH_KEY") {
        console.error("❌ CometChat configuration invalid - environment variables not set properly");
        console.error("Current config:", {
          APP_ID: COMETCHAT_CONFIG.APP_ID,
          REGION: COMETCHAT_CONFIG.REGION,
          AUTH_KEY_SET: COMETCHAT_CONFIG.AUTH_KEY !== "YOUR_AUTH_KEY"
        });
        return false;
      }

      console.log("Initializing CometChat with:", {
        APP_ID: COMETCHAT_CONFIG.APP_ID,
        REGION: COMETCHAT_CONFIG.REGION,
        AUTH_KEY: COMETCHAT_CONFIG.AUTH_KEY ? `${COMETCHAT_CONFIG.AUTH_KEY.substring(0, 8)}...` : 'NOT_SET'
      });

      const appSetting = new CometChat.AppSettingsBuilder()
        .subscribePresenceForAllUsers()
        .setRegion(COMETCHAT_CONFIG.REGION)
        .autoEstablishSocketConnection(true)
        .build();

      await CometChat.init(COMETCHAT_CONFIG.APP_ID, appSetting);
      this.initialized = true;
      console.log("✅ CometChat initialized successfully");
      return true;
    } catch (error) {
      console.error("❌ CometChat initialization failed:", error);
      
      // Provide helpful error messages
      if (error && typeof error === 'object') {
        const errorMessage = (error as any).message || '';
        if (errorMessage.includes('APP_ID')) {
          console.error("💡 Check your NEXT_PUBLIC_COMETCHAT_APP_ID environment variable");
        } else if (errorMessage.includes('region')) {
          console.error("💡 Check your NEXT_PUBLIC_COMETCHAT_REGION environment variable");
        }
      }
      
      return false;
    }
  }

  async userExists(uid: string): Promise<boolean> {
    try {
      const CometChat = await this.loadCometChat();
      if (!CometChat) return false;

      const user = await CometChat.getUser(uid);
      console.log("User exists:", uid, user);
      return !!user;
    } catch (error: any) {
      console.log("User does not exist:", uid);
      return false;
    }
  }

  async createUser(uid: string, name: string): Promise<any | null> {
    try {
      const CometChat = await this.loadCometChat();
      if (!CometChat) return null;

      const user = new CometChat.User(uid);
      user.setName(name);
      
      const createdUser = await CometChat.createUser(user, COMETCHAT_CONFIG.AUTH_KEY);
      console.log("User created successfully:", createdUser);
      return createdUser;
    } catch (error: any) {
      console.log("Create user error:", error);
      
      const errorCode = error?.code || error?.error?.code || error?.details?.code;
      if (errorCode === 'ERR_UID_ALREADY_EXISTS' || 
          error?.message?.includes('already exists') ||
          error?.error?.message?.includes('already exists')) {
        console.log("User already exists, proceeding with login:", uid);
        return { uid, name };
      }
      
      console.error("User creation failed:", error);
      return { uid, name };
    }
  }

  async loginUser(uid: string): Promise<any | null> {
    try {
      const CometChat = await this.loadCometChat();
      if (!CometChat) return null;

      const loggedInUser = await CometChat.getLoggedinUser();
      if (loggedInUser?.getUid() === uid) {
        return loggedInUser;
      }

      if (loggedInUser) {
        await this.logoutUser();
      }

      const user = await CometChat.login(uid, COMETCHAT_CONFIG.AUTH_KEY);
      console.log("User logged in successfully:", user);
      return user;
    } catch (error) {
      console.error("User login failed:", error);
      return null;
    }
  }

  async logoutUser(): Promise<boolean> {
    try {
      const CometChat = await this.loadCometChat();
      if (!CometChat) return false;

      await CometChat.logout();
      console.log("User logged out successfully");
      return true;
    } catch (error) {
      console.error("User logout failed:", error);
      return false;
    }
  }

  async createGroup(guid: string, name: string): Promise<any | null> {
    try {
      const CometChat = await this.loadCometChat();
      if (!CometChat) return null;

      const group = new CometChat.Group(
        guid,
        name,
        CometChat.GROUP_TYPE.PUBLIC as any,
        ""
      );
      
      const createdGroup = await CometChat.createGroup(group);
      console.log("Group created successfully:", createdGroup);
      return createdGroup;
    } catch (error) {
      console.error("Group creation failed:", error);
      return null;
    }
  }

  async joinGroup(guid: string): Promise<any | null> {
    try {
      const CometChat = await this.loadCometChat();
      if (!CometChat) {
        console.error('CometChat not loaded');
        return null;
      }

      console.log('Attempting to join group:', guid);
      
      const currentUser = await CometChat.getLoggedinUser();
      if (!currentUser) {
        console.error('No user logged in');
        return null;
      }
      console.log('Current user:', currentUser.getUid());

      try {
        console.log('Calling CometChat.joinGroup...');
        const group = await CometChat.joinGroup(
          guid,
          CometChat.GROUP_TYPE.PUBLIC as any,
          ""
        );
        console.log('✅ Group joined successfully:', group.getGuid());
        return group;
      } catch (joinError: any) {
        console.log('Join error:', joinError);
        
        const errorCode = joinError?.code || joinError?.error?.code;
        const errorMessage = joinError?.message || joinError?.error?.message || '';
        
        if (errorCode === 'ERR_ALREADY_JOINED' || 
            errorMessage.includes('already joined') ||
            errorMessage.includes('already a member')) {
          console.log('✅ User already in group:', guid);
          
          try {
            const existingGroup = await CometChat.getGroup(guid);
            console.log('Got existing group info:', existingGroup.getGuid());
            return existingGroup;
          } catch (getError) {
            console.log('Could not get group info, returning basic object');
            return { guid, joined: true, getGuid: () => guid };
          }
        }
        
        console.error('❌ Group join failed with error:', errorCode, errorMessage);
        throw joinError;
      }
    } catch (error: any) {
      console.error('❌ Group join failed:', error);
      return null;
    }
  }

  async checkAuthStatus(): Promise<{ isLoggedIn: boolean; user?: any; error?: string }> {
    try {
      const CometChat = await this.loadCometChat();
      if (!CometChat) {
        return { isLoggedIn: false, error: 'CometChat not loaded' };
      }

      const user = await CometChat.getLoggedinUser();
      return { 
        isLoggedIn: !!user, 
        user: user ? { uid: user.getUid(), name: user.getName() } : null 
      };
    } catch (error) {
      console.error('Error checking auth status:', error);
      return { isLoggedIn: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendGroupMessage(guid: string, messageText: string, metadata: any = {}): Promise<any> {
    try {
      const CometChat = await this.loadCometChat();
      if (!CometChat) {
        console.error('CometChat not loaded for sending message');
        return null;
      }
      
      console.log('Sending message to group:', guid);
      console.log('Message:', messageText.substring(0, 50) + '...');
      
      const message = new CometChat.TextMessage(
        guid,
        messageText,
        CometChat.RECEIVER_TYPE.GROUP
      );
      
      if (Object.keys(metadata).length > 0) {
        message.setMetadata(metadata);
        console.log('Message metadata:', metadata);
      }
      
      const sentMessage = await CometChat.sendMessage(message);
      console.log('Message sent successfully');
      return sentMessage;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<any> {
    try {
      const CometChat = await this.loadCometChat();
      if (!CometChat) return null;
      
      const user = await CometChat.getLoggedinUser();
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  }

  async fetchGroupMessages(guid: string, limit: number = 30): Promise<any[]> {
    try {
      const CometChat = await this.loadCometChat();
      if (!CometChat) {
        console.error('CometChat not loaded');
        return [];
      }
      
      console.log('Fetching messages for group:', guid);
      
      const messagesRequest = new CometChat.MessagesRequestBuilder()
        .setGUID(guid)
        .setLimit(limit)
        .build();

      try {
        const messages = await messagesRequest.fetchPrevious();
        console.log('Messages fetched successfully:', messages.length);
        return messages;
      } catch (fetchError: any) {
        console.log('Fetch error:', fetchError);
        
        const errorCode = fetchError?.code || fetchError?.error?.code;
        const errorMessage = fetchError?.message || fetchError?.error?.message || '';
        
        if (errorCode === 'USER_NOT_LOGED_IN' || errorMessage.includes('USER_NOT_LOGED_IN')) {
          console.error('User not logged in to CometChat, cannot fetch messages');
          throw new Error('USER_NOT_LOGED_IN');
        }
        
        if (errorCode === 'ERR_GROUP_NOT_JOINED') {
          console.log('User not in group, attempting to join first...');
          
          const joinResult = await this.joinGroup(guid);
          if (joinResult) {
            console.log('Successfully joined group, retrying message fetch...');
            
            const retryRequest = new CometChat.MessagesRequestBuilder()
              .setGUID(guid)
              .setLimit(limit)
              .build();
              
            const retryMessages = await retryRequest.fetchPrevious();
            console.log('Messages fetched after joining:', retryMessages.length);
            return retryMessages;
          } else {
            console.error('Failed to join group for message fetching');
            throw fetchError;
          }
        } else {
          console.error('Other fetch error:', errorCode, errorMessage);
          throw fetchError;
        }
      }
    } catch (error) {
      console.error('Error fetching group messages:', error);
      throw error;
    }
  }

  async getPublicGroups(limit: number = 30): Promise<any[]> {
    try {
      const CometChat = await this.loadCometChat();
      if (!CometChat) return [];

      const groupsRequest = new CometChat.GroupsRequestBuilder()
        .setLimit(limit)
        .joinedOnly(false) 
        .build();

      const groups = await groupsRequest.fetchNext();
      console.log("Public groups fetched:", groups);
      return groups;
    } catch (error) {
      console.error("Failed to fetch public groups:", error);
      return [];
    }
  }

  async searchGroups(searchTerm: string, limit: number = 30): Promise<any[]> {
    try {
      const CometChat = await this.loadCometChat();
      if (!CometChat) return [];

      const groupsRequest = new CometChat.GroupsRequestBuilder()
        .setLimit(limit)
        .setSearchKeyword(searchTerm)
        .build();

      const groups = await groupsRequest.fetchNext();
      console.log("Groups search results:", groups);
      return groups;
    } catch (error) {
      console.error("Failed to search groups:", error);
      return [];
    }
  }

  async getJoinedGroups(limit: number = 30): Promise<any[]> {
    try {
      const CometChat = await this.loadCometChat();
      if (!CometChat) return [];

      const groupsRequest = new CometChat.GroupsRequestBuilder()
        .setLimit(limit)
        .joinedOnly(true)
        .build();

      const groups = await groupsRequest.fetchNext();
      return groups;
    } catch (error) {
      console.error("Failed to fetch joined groups:", error);
      return [];
    }
  }

  async getGroupMessages(guid: string, limit: number = 30): Promise<any[]> {
    try {
      const CometChat = await this.loadCometChat();
      if (!CometChat) return [];

      const messagesRequest = new CometChat.MessagesRequestBuilder()
        .setGUID(guid)
        .setLimit(limit)
        .build();

      const messages = await messagesRequest.fetchPrevious();
      return messages;
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      return [];
    }
  }

  async setupMessageListener(listenerId: string, onMessageReceived: (message: any) => void): Promise<void> {
    try {
      const CometChat = await this.loadCometChat();
      if (!CometChat) return;

      try {
        CometChat.removeMessageListener(listenerId);
      } catch (removeError) {
      }

      console.log('Setting up message listener:', listenerId);

      CometChat.addMessageListener(
        listenerId,
        new CometChat.MessageListener({
          onTextMessageReceived: (message: any) => {
            console.log('Text message received in listener:', message.getId());
            onMessageReceived(message);
          },
          onMediaMessageReceived: (message: any) => {
            console.log('Media message received in listener:', message.getId());
            onMessageReceived(message);
          },
        })
      );

      console.log('Message listener setup complete:', listenerId);
    } catch (error) {
      console.error("Failed to setup message listener:", error);
    }
  }

  async removeMessageListener(listenerId: string): Promise<void> {
    try {
      const CometChat = await this.loadCometChat();
      if (!CometChat) return;

      CometChat.removeMessageListener(listenerId);
    } catch (error) {
      console.error("Failed to remove message listener:", error);
    }
  }

  async getLoggedInUser(): Promise<any | null> {
    try {
      const CometChat = await this.loadCometChat();
      if (!CometChat) return null;

      const user = await CometChat.getLoggedinUser();
      return user;
    } catch (error) {
      console.error("Failed to get logged in user:", error);
      return null;
    }
  }
}

export default CometChatManager;
