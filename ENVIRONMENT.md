# Environment Variables Setup

This document explains how to set up the required environment variables for the MuseAI application.

## Required Environment Variables

### Gemini AI Configuration

```bash
# Required for both client and server-side API calls
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

**How to get:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key
5. Use the same key for both variables

### CometChat Configuration

```bash
# CometChat real-time messaging service
NEXT_PUBLIC_COMETCHAT_APP_ID=your_cometchat_app_id
NEXT_PUBLIC_COMETCHAT_REGION=your_cometchat_region  # e.g., 'us' or 'in'
NEXT_PUBLIC_COMETCHAT_AUTH_KEY=your_cometchat_auth_key
```

**How to get:**
1. Sign up at [CometChat](https://www.cometchat.com/)
2. Create a new app in the CometChat dashboard
3. Go to "API Keys" section
4. Copy the following:
   - App ID
   - Region (usually 'us' or 'in')
   - Auth Key

## Setting Up .env.local

1. Create a `.env.local` file in the root directory of your project
2. Copy the template above and replace the placeholder values with your actual keys
3. Make sure `.env.local` is listed in your `.gitignore` file (it should be by default)

## Security Notes

- **Never commit environment files to Git**
- **Never share your API keys publicly**
- **Use different keys for development and production**
- **Rotate your keys regularly for security**

## Environment File Structure

```bash
# Root directory
MuseAI/
├── .env.local              # Your local environment variables (DO NOT COMMIT)
├── .gitignore              # Should include .env* files
└── ENVIRONMENT.md          # This documentation file
```

## Troubleshooting

### Common Issues:

1. **"API key not configured" error**
   - Make sure both `GEMINI_API_KEY` and `NEXT_PUBLIC_GEMINI_API_KEY` are set
   - Restart your development server after adding environment variables

2. **CometChat initialization failures**
   - Verify your CometChat credentials are correct
   - Check that the region matches your CometChat app configuration

3. **Environment variables not loading**
   - Ensure the file is named exactly `.env.local`
   - Restart your development server
   - Check for typos in variable names

### Verification

To verify your environment setup is working:

1. Check the browser console for any API key errors
2. Test the AI chat functionality with `/askAI` commands
3. Try creating and joining group chats
4. Monitor the console for CometChat connection status

## Production Deployment

For production deployments (Vercel, Netlify, etc.):

1. Add environment variables through your hosting platform's dashboard
2. Use the same variable names as in your `.env.local`
3. Ensure production API keys are different from development keys
4. Test all functionality after deployment
