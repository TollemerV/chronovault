import { NextResponse } from 'next/server'

/**
 * GET /api/auth/aliexpress
 * Redirige vers la page d'autorisation AliExpress OAuth 2.0
 */
export async function GET() {
  const APP_KEY = process.env.ALIEXPRESS_APP_KEY!
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

  const callbackUrl = `${BASE_URL}/api/auth/aliexpress/callback`

  const authUrl = new URL('https://api-sg.aliexpress.com/oauth/authorize')
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('client_id', APP_KEY)
  authUrl.searchParams.set('redirect_uri', callbackUrl)
  authUrl.searchParams.set('state', `chronovault-${Date.now()}`)

  return NextResponse.redirect(authUrl.toString())
}
