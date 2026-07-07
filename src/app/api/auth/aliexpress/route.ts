import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/auth/aliexpress
 * Redirige vers la page d'autorisation AliExpress OAuth 2.0
 */
export async function GET(req: NextRequest) {
  const APP_KEY = process.env.ALIEXPRESS_APP_KEY!

  // On dérive l'origine depuis la requête elle-même — fiable sur Vercel et localhost
  const origin = req.headers.get('x-forwarded-host')
    ? `https://${req.headers.get('x-forwarded-host')}`
    : new URL(req.url).origin

  const callbackUrl = `${origin}/api/auth/aliexpress/callback`

  const authUrl = new URL('https://api-sg.aliexpress.com/oauth/authorize')
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('client_id', APP_KEY)
  authUrl.searchParams.set('redirect_uri', callbackUrl)
  authUrl.searchParams.set('state', `chronovault-${Date.now()}`)

  return NextResponse.redirect(authUrl.toString())
}
