import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const APP_KEY = process.env.ALIEXPRESS_APP_KEY!
const APP_SECRET = process.env.ALIEXPRESS_APP_SECRET!
const API_URL = 'https://api-sg.aliexpress.com/sync'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

/* ─────────────────────────────────────────
   Signature HMAC-MD5 standard AliExpress IOP
───────────────────────────────────────── */
function sign(params: Record<string, string>): string {
  const sorted = Object.keys(params).sort()
  const str = APP_SECRET + sorted.map(k => k + params[k]).join('') + APP_SECRET
  return crypto.createHash('md5').update(str).digest('hex').toUpperCase()
}

/* ─────────────────────────────────────────
   Récupère l'access_token stocké en Supabase
───────────────────────────────────────── */
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'ae_access_token')
    .single()
  return data?.value ?? null
}

export async function getConnectionStatus(): Promise<{
  connected: boolean
  connectedAt?: string
  accountId?: string
}> {
  const { data } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['ae_access_token', 'ae_connected_at', 'ae_account_id'])

  const map = Object.fromEntries((data ?? []).map(r => [r.key, r.value]))
  return {
    connected: !!map.ae_access_token,
    connectedAt: map.ae_connected_at,
    accountId: map.ae_account_id,
  }
}

/* ─────────────────────────────────────────
   Appel API signé (avec ou sans access_token)
───────────────────────────────────────── */
async function call(
  method: string,
  extra: Record<string, string>,
  accessToken?: string,
) {
  const base: Record<string, string> = {
    method,
    app_key: APP_KEY,
    timestamp: String(Date.now()),
    format: 'json',
    v: '2.0',
    sign_method: 'md5',
    ...extra,
  }
  if (accessToken) base.session = accessToken
  base.sign = sign(base)

  const qs = new URLSearchParams(base).toString()
  const res = await fetch(`${API_URL}?${qs}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

/* ─────────────────────────────────────────
   Types
───────────────────────────────────────── */
export interface DSProduct {
  product_id: string
  product_title: string
  product_main_image_url: string
  product_detail_url: string
  target_sale_price: string
  target_original_price: string
  target_sale_price_currency: string
  evaluate_rate: string
  lastest_volume: number
  second_level_category_name?: string
}

/* ─────────────────────────────────────────
   Recherche produits DS (nécessite access_token)
───────────────────────────────────────── */
export async function searchProducts(
  keyword: string,
  page = 1,
  pageSize = 20,
): Promise<{ products: DSProduct[]; total: number; needsAuth: boolean }> {
  const accessToken = await getAccessToken()

  if (!accessToken) {
    return { products: [], total: 0, needsAuth: true }
  }

  try {
    const raw = await call(
      'aliexpress.ds.product.search',
      {
        keywords: keyword,
        page_no: String(page),
        page_size: String(pageSize),
        sort: 'LAST_VOLUME_DESC',
        currency: 'EUR',
        locale: 'fr_FR',
        country: 'FR',
      },
      accessToken,
    )

    // Essaie la réponse DS
    const dsWrapper = raw?.aliexpress_ds_product_search_response
    if (dsWrapper?.result) {
      const result = dsWrapper.result
      return {
        products: result?.products?.product ?? [],
        total: result?.total_record_count ?? 0,
        needsAuth: false,
      }
    }

    console.error('[AliExpress DS search] Réponse inattendue:', JSON.stringify(raw).slice(0, 400))
    return { products: [], total: 0, needsAuth: false }
  } catch (err) {
    console.error('[AliExpress DS search] Erreur:', err)
    return { products: [], total: 0, needsAuth: false }
  }
}

/* ─────────────────────────────────────────
   Détail produit DS
───────────────────────────────────────── */
export async function getProductDetail(productId: string) {
  const accessToken = await getAccessToken()
  if (!accessToken) return null

  try {
    const raw = await call(
      'aliexpress.ds.product.get',
      { product_id: productId, currency: 'EUR', locale: 'fr_FR', country: 'FR' },
      accessToken,
    )
    return raw?.aliexpress_ds_product_get_response?.result ?? null
  } catch {
    return null
  }
}

/* ─────────────────────────────────────────
   Calcul prix de vente avec marge
───────────────────────────────────────── */
export function calcSellingPrice(costPrice: number, margin = 2.5): number {
  return Math.ceil((costPrice * margin) / 5) * 5 - 0.01
}
