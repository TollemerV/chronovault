import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const APP_KEY = process.env.ALIEXPRESS_APP_KEY!
const APP_SECRET = process.env.ALIEXPRESS_APP_SECRET!

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

/** Signature HMAC-MD5 standard AliExpress IOP */
function sign(params: Record<string, string>): string {
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
 * GET /api/auth/aliexpress/callback
 * AliExpress redirige ici après autorisation avec un ?code=xxx
 * On échange ce code contre un access_token et on le stocke en Supabase
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

  /* ── Échange du code contre un token ── */
  const callbackUrl = `${origin}/api/auth/aliexpress/callback`
  const timestamp = String(Date.now())

  const params: Record<string, string> = {
    app_key: APP_KEY,
    code,
    sign_method: 'md5',
    timestamp,
  }
  params.sign = sign(params)

  const body = new URLSearchParams({ ...params, redirect_uri: callbackUrl })

  let tokenData: Record<string, unknown>
  try {
    const res = await fetch('https://api-sg.aliexpress.com/auth/token/security/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      cache: 'no-store',
    })
    tokenData = await res.json()
  } catch (err) {
    return NextResponse.redirect(
      `${origin}/admin?ae_error=${encodeURIComponent(`Erreur réseau: ${err}`)}`,
    )
  }

  /* ── Vérification de la réponse ── */
  if (tokenData.error || !tokenData.access_token) {
    const errMsg = (tokenData.error_description ?? tokenData.error ?? JSON.stringify(tokenData)) as string
    console.error('[AliExpress OAuth] Erreur token:', tokenData)
    return NextResponse.redirect(
      `${origin}/admin?ae_error=${encodeURIComponent(errMsg)}`,
    )
  }

  /* ── Stockage sécurisé en Supabase ── */
  await Promise.all([
    saveSetting('ae_access_token', tokenData.access_token as string),
    saveSetting('ae_refresh_token', tokenData.refresh_token as string ?? ''),
    saveSetting('ae_token_expiry', String(tokenData.expire_time ?? Date.now() + 30 * 24 * 3600 * 1000)),
    saveSetting('ae_account_id', String(tokenData.account_id ?? '')),
    saveSetting('ae_connected_at', new Date().toISOString()),
  ])

  console.log('[AliExpress OAuth] ✅ Token sauvegardé, account_id:', tokenData.account_id)

  /* ── Redirection vers l'admin avec succès ── */
  return NextResponse.redirect(`${origin}/admin?ae_connected=1`)
}
