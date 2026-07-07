import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const APP_KEY = process.env.ALIEXPRESS_APP_KEY!
const APP_SECRET = process.env.ALIEXPRESS_APP_SECRET!

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

/**
 * Signature SHA256 — utilisée par les endpoints "security" AliExpress
 * Format: SHA256(APP_SECRET + sorted_params + APP_SECRET)
 */
function signSha256(params: Record<string, string>): string {
  const sorted = Object.keys(params).sort()
  const str = APP_SECRET + sorted.map(k => k + params[k]).join('') + APP_SECRET
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex').toUpperCase()
}

/** Signature MD5 — fallback pour les endpoints classiques */
function signMd5(params: Record<string, string>): string {
  const sorted = Object.keys(params).sort()
  const str = APP_SECRET + sorted.map(k => k + params[k]).join('') + APP_SECRET
  return crypto.createHash('md5').update(str).digest('hex').toUpperCase()
}

/** Sauvegarde une valeur dans la table settings */
async function saveSetting(key: string, value: string) {
  await supabase
    .from('settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
}

/**
 * Tente l'échange code → token avec une configuration donnée
 */
async function tryTokenExchange(
  code: string,
  callbackUrl: string,
  timestamp: string,
  useRedirectUri: boolean,
  signMethod: 'sha256' | 'md5',
): Promise<{ status: number; text: string }> {
  const params: Record<string, string> = {
    app_key: APP_KEY,
    code,
    sign_method: signMethod,
    timestamp,
  }
  if (useRedirectUri) params.redirect_uri = callbackUrl

  params.sign = signMethod === 'sha256' ? signSha256(params) : signMd5(params)

  const body = new URLSearchParams(params)

  const res = await fetch('https://api-sg.aliexpress.com/auth/token/security/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    cache: 'no-store',
  })
  const text = await res.text()
  return { status: res.status, text }
}

/**
 * GET /api/auth/aliexpress/callback
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  // Dérive l'origine depuis la requête — fiable sur Vercel et localhost
  const origin = req.headers.get('x-forwarded-host')
    ? `https://${req.headers.get('x-forwarded-host')}`
    : new URL(req.url).origin

  /* ── Erreur d'autorisation ── */
  if (error || !code) {
    const msg = error ?? 'code manquant'
    return NextResponse.redirect(`${origin}/admin?ae_error=${encodeURIComponent(msg)}`)
  }

  const callbackUrl = `${origin}/api/auth/aliexpress/callback`
  const timestamp = String(Date.now())

  /* ── Essaie 4 combinaisons dans l'ordre ── */
  const attempts: Array<[boolean, 'sha256' | 'md5']> = [
    [false, 'sha256'],   // SHA256 sans redirect_uri (le plus courant)
    [true,  'sha256'],   // SHA256 avec redirect_uri
    [false, 'md5'],      // MD5 sans redirect_uri
    [true,  'md5'],      // MD5 avec redirect_uri
  ]

  let lastStatus = 0
  let lastText = ''

  for (const [useRedirectUri, signMethod] of attempts) {
    try {
      const { status, text } = await tryTokenExchange(code, callbackUrl, timestamp, useRedirectUri, signMethod)
      lastStatus = status
      lastText = text

      console.log(`[AliExpress OAuth] Attempt ${signMethod}+redirect=${useRedirectUri} → HTTP ${status}: ${text.slice(0, 300)}`)

      if (!text || text.trim() === '') continue // réponse vide → essai suivant

      let data: Record<string, unknown>
      try {
        data = JSON.parse(text)
      } catch {
        continue // non-JSON → essai suivant
      }

      // Succès si access_token présent
      if (data.access_token) {
        await Promise.all([
          saveSetting('ae_access_token', data.access_token as string),
          saveSetting('ae_refresh_token', (data.refresh_token as string) ?? ''),
          saveSetting('ae_token_expiry', String(data.expire_time ?? Date.now() + 30 * 24 * 3600 * 1000)),
          saveSetting('ae_account_id', String(data.account_id ?? '')),
          saveSetting('ae_connected_at', new Date().toISOString()),
        ])
        console.log('[AliExpress OAuth] ✅ Token sauvegardé, account_id:', data.account_id)
        return NextResponse.redirect(`${origin}/admin?ae_connected=1`)
      }

      // Erreur explicite d'AliExpress
      if (data.error || data.error_response) {
        const errMsg = String(data.error_description ?? data.error ?? JSON.stringify(data).slice(0, 200))
        console.error('[AliExpress OAuth] Erreur API:', errMsg)
        return NextResponse.redirect(`${origin}/admin?ae_error=${encodeURIComponent(errMsg)}`)
      }

    } catch (fetchErr) {
      console.error('[AliExpress OAuth] fetch error:', fetchErr)
    }
  }

  // Tous les essais ont échoué
  const debugMsg = `HTTP ${lastStatus} — ${lastText ? lastText.slice(0, 200) : 'réponse vide'}`
  return NextResponse.redirect(`${origin}/admin?ae_error=${encodeURIComponent(debugMsg)}`)
}
