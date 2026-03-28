import { NextResponse } from 'next/server';

export async function GET() {
  // We expose the publishable_key from the user's .env file to the client-side UI
  return NextResponse.json({ publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.publishable_key });
}