import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const APP_KEY = process.env.ALIEXPRESS_APP_KEY!
const APP_SECRET = process.env.ALIEXPRESS_APP_SECRET!

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

/* ─── Fonctions de signature ─── */
function signWith(params: Record<string, string>, method: 'sha256' | 'md5'): string {
  const sorted = Object.keys(params).sort()
  const str = APP_SECRET + sorted.map(k => k + params[k]).join('') + APP_SECRET
  return crypto.createHash(method).update(str, 'utf8').digest('hex').toUpperCase()
}

/* ─── Sauvegarde settings Supabase ─── */
async function saveSetting(key: string, value: string) {
  await supabase
    .from('settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
}

/* ─── Une tentative d'échange code → token ─── */
interface Attempt {
  url: string
  method: 'GET' | 'POST'
  sign: 'sha256' | 'md5'
  includeRedirectUri: boolean
  includeAppSecret: boolean   // certains endpoints AliExpress exigent app_secret en clair
}

async function tryExchange(
  code: string,
  callbackUrl: string,
  timestamp: string,
  attempt: Attempt,
): Promise<{ status: number; text: string }> {
  const params: Record<string, string> = {
    app_key: APP_KEY,
    code,
    sign_method: attempt.sign,
    timestamp,
  }
  if (attempt.includeRedirectUri) params.redirect_uri = callbackUrl
  if (attempt.includeAppSecret)  params.app_secret = APP_SECRET

  params.sign = signWith(params, attempt.sign)

  let res: Response
  if (attempt.method === 'GET') {
    res = await fetch(`${attempt.url}?${new URLSearchParams(params)}`, {
      method: 'GET',
      cache: 'no-store',
    })
  } else {
    res = await fetch(attempt.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params).toString(),
      cache: 'no-store',
    })
  }
  const text = await res.text()
  return { status: res.status, text }
}

/**
 * GET /api/auth/aliexpress/callback
 * Reçoit le code OAuth depuis AliExpress, tente toutes les combinaisons connues
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  const origin = req.headers.get('x-forwarded-host')
    ? `https://${req.headers.get('x-forwarded-host')}`
    : new URL(req.url).origin

  if (error || !code) {
    return NextResponse.redirect(
      `${origin}/admin?ae_error=${encodeURIComponent(error ?? 'code manquant')}`,
    )
  }

  const callbackUrl = `${origin}/api/auth/aliexpress/callback`
  const timestamp = String(Date.now())

  // Matrice complète de tentatives
  const ENDPOINTS = [
    'https://api-sg.aliexpress.com/auth/token/security/create',
    'https://api-sg.aliexpress.com/auth/token/create',
    'https://api.aliexpress.com/auth/token/security/create',
    'https://api.aliexpress.com/auth/token/create',
  ]
  const attempts: Attempt[] = []
  for (const url of ENDPOINTS) {
    for (const method of ['POST', 'GET'] as const) {
      for (const sign of ['sha256', 'md5'] as const) {
        for (const includeAppSecret of [true, false]) {
          attempts.push({ url, method, sign, includeRedirectUri: false, includeAppSecret })
          attempts.push({ url, method, sign, includeRedirectUri: true,  includeAppSecret })
        }
      }
    }
  }

  let lastStatus = 0
  let lastText = ''

  for (const attempt of attempts) {
    try {
      const { status, text } = await tryExchange(code, callbackUrl, timestamp, attempt)
      lastStatus = status
      lastText = text

      const label = `${attempt.method} ${attempt.url.split('/').pop()} sign=${attempt.sign} secret=${attempt.includeAppSecret} redirect=${attempt.includeRedirectUri}`
      console.log(`[AE OAuth] ${label} → HTTP ${status}: ${text.slice(0, 150)}`)

      // Ignore les pages HTML (maintenance, 404...)
      if (!text || text.trim() === '' || text.trim().startsWith('<')) continue

      let data: Record<string, unknown>
      try { data = JSON.parse(text) } catch { continue }

      // ✅ Succès
      if (data.access_token) {
        await Promise.all([
          saveSetting('ae_access_token', data.access_token as string),
          saveSetting('ae_refresh_token', (data.refresh_token as string) ?? ''),
          saveSetting('ae_token_expiry', String(data.expire_time ?? Date.now() + 30 * 24 * 3600 * 1000)),
          saveSetting('ae_account_id', String(data.account_id ?? '')),
          saveSetting('ae_connected_at', new Date().toISOString()),
        ])
        console.log('[AE OAuth] ✅ Succès ! account_id:', data.account_id)
        return NextResponse.redirect(`${origin}/admin?ae_connected=1`)
      }

      // Erreur explicite AliExpress → inutile de continuer
      if (data.error || data.code) {
        const errMsg = String(data.error_description ?? data.error ?? data.message ?? JSON.stringify(data).slice(0, 300))
        console.error('[AE OAuth] Erreur AliExpress:', errMsg)
        return NextResponse.redirect(`${origin}/admin?ae_error=${encodeURIComponent(errMsg)}`)
      }

    } catch (fetchErr) {
      console.error('[AE OAuth] fetch error:', fetchErr)
    }
  }

  // Tous les essais ont échoué
  const debugMsg = `HTTP ${lastStatus} — ${lastText ? lastText.slice(0, 200) : 'réponse vide'}`
  return NextResponse.redirect(`${origin}/admin?ae_error=${encodeURIComponent(debugMsg)}`)
}
