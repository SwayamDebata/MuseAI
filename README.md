# MuseAI - AI Conversational Chat Application

A fully functional, responsive, and visually appealing frontend for a Gemini-style conversational AI chat application built with Next.js 15, TypeScript, Tailwind CSS, and Zustand.

## 🚀 Features

### Authentication
- **OTP-based Login/Signup** with country code selection
- **Country Data Integration** from REST Countries API
- **Form Validation** using React Hook Form + Zod
- **Simulated OTP** generation and validation

### Dashboard
- **Chatroom Management** - Create, delete, and manage chatrooms
- **Search Functionality** - Debounced search to filter chatrooms
- **Toast Notifications** for user feedback
- **Responsive Design** for mobile and desktop

### Chat Interface
- **Real-time Messaging** with simulated AI responses
- **Message Features**:
  - Timestamps and message grouping
  - Copy-to-clipboard on hover
  - Image upload support (base64)
  - Typing indicator ("Gemini is typing...")
- **Infinite Scroll** for loading older messages
- **Auto-scroll** to latest messages

### UX Features
- **Dark Mode Toggle** with persistent theme
- **Mobile Responsive** design
- **Loading Skeletons** for better UX
- **Keyboard Accessibility** for all interactions
- **LocalStorage Persistence** for auth and chat data

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Form Validation**: React Hook Form + Zod
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd gemini-chat
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/
│   ├── auth/              # Authentication components
│   │   ├── AuthPage.tsx
│   │   ├── PhoneForm.tsx
│   │   └── OTPForm.tsx
│   ├── dashboard/         # Dashboard components
│   │   ├── Dashboard.tsx
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── ChatInterface.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── MessageInput.tsx
│   │   └── TypingIndicator.tsx
│   ├── providers/         # Context providers
│   │   └── ThemeProvider.tsx
│   └── ui/               # Reusable UI components
│       └── LoadingSkeleton.tsx
├── lib/                   # Utilities and configurations
│   ├── utils.ts          # Helper functions
│   └── validations.ts    # Zod schemas
└── stores/               # Zustand stores
    ├── authStore.ts      # Authentication state
    ├── chatStore.ts      # Chat state
    └── themeStore.ts     # Theme state
```

## 🎯 Key Features Demonstrated

### Authentication Flow
1. **Phone Number Entry** with country selection
2. **OTP Generation** and display (for demo purposes)
3. **OTP Validation** with error handling
4. **Persistent Login** state

### Chat Functionality
1. **Chatroom Creation** with validation
2. **Message Sending** with image support
3. **AI Response Simulation** with throttling
4. **Message History** with pagination
5. **Real-time UI Updates**

### User Experience
1. **Responsive Design** for all screen sizes
2. **Dark/Light Mode** toggle
3. **Loading States** and skeletons
4. **Error Handling** with user feedback
5. **Keyboard Navigation** support

## 🤖 Gemini AI Integration

The application now features real AI integration with Google's Gemini AI API for intelligent responses instead of hardcoded messages.

### Setting up Gemini AI (Optional)

1. **Get a Gemini API Key**:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Create a new API key

2. **Configure the API Key**:
   ```bash
   # Create a .env.local file in the root directory
   cp .env.example .env.local
   
   # Add your API key to .env.local
   GEMINI_API_KEY=your_actual_api_key_here
   ```

3. **Restart the development server**:
   ```bash
   npm run dev
   ```

### AI Features

- **Contextual Responses**: The AI considers conversation history for more natural interactions
- **Intelligent Conversations**: Responses are generated based on the actual content of your messages
- **Fallback System**: If the API is unavailable, the app gracefully falls back to enhanced mock responses
- **Security**: API calls are made server-side to protect your API key

### Without API Key

The application works perfectly without a Gemini API key! It will use enhanced mock responses that simulate intelligent AI behavior, including:
- Context-aware greetings
- Topic-specific responses
- Conversation continuity
- Helpful and engaging interactions

## 📱 Mobile Responsiveness

The application is fully responsive with:
- **Mobile-first Design** approach
- **Touch-friendly** interface elements
- **Collapsible Sidebar** for mobile
- **Optimized Typography** for readability
- **Gesture Support** for navigation

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy with default Next.js settings

### Manual Build
```bash
npm run build
npm start
```

## 🧪 Testing the Application

1. **Authentication**:
   - Enter any phone number with country code
   - Use the displayed OTP (shown in toast notification)
   - Successfully log in to access the dashboard

2. **Chat Features**:
   - Create a new chatroom
   - Send text messages and images
   - Watch for AI responses with typing indicator
   - Test search functionality
   - Try dark mode toggle

3. **Responsive Design**:
   - Test on mobile and desktop
   - Check sidebar behavior
   - Verify touch interactions

## 📄 License

This project is created for demonstration purposes.

## 🤝 Contributing

This is a demo project showcasing modern React/Next.js development practices. Feel free to use it as a reference for your own projects.

## 📞 Support

For questions or issues, please refer to the code comments and implementation details within the source files.
