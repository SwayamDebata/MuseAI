import { NextResponse } from 'next/server';

export async function GET() {
  // This endpoint helps debug environment variables in production
  const envDebug = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    
    // CometChat environment variables
    COMETCHAT_APP_ID: process.env.NEXT_PUBLIC_COMETCHAT_APP_ID ? 'SET' : 'NOT_SET',
    COMETCHAT_REGION: process.env.NEXT_PUBLIC_COMETCHAT_REGION ? 'SET' : 'NOT_SET', 
    COMETCHAT_AUTH_KEY: process.env.NEXT_PUBLIC_COMETCHAT_AUTH_KEY ? 'SET' : 'NOT_SET',
    
    // Gemini environment variables
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'SET' : 'NOT_SET',
    NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY ? 'SET' : 'NOT_SET',
    
    // Show actual values (first/last 4 chars only for security)
    APP_ID_PREVIEW: process.env.NEXT_PUBLIC_COMETCHAT_APP_ID ? 
      `${process.env.NEXT_PUBLIC_COMETCHAT_APP_ID.substring(0, 4)}...${process.env.NEXT_PUBLIC_COMETCHAT_APP_ID.slice(-4)}` : 
      'NOT_SET',
    REGION_VALUE: process.env.NEXT_PUBLIC_COMETCHAT_REGION || 'NOT_SET',
    
    // List all environment variables that contain COMETCHAT
    ALL_COMETCHAT_VARS: Object.keys(process.env).filter(key => key.includes('COMETCHAT')),
    ALL_GEMINI_VARS: Object.keys(process.env).filter(key => key.includes('GEMINI')),
  };

  return NextResponse.json(envDebug, { status: 200 });
}
