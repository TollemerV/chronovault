import crypto from 'crypto'

const APP_KEY = process.env.ALIEXPRESS_APP_KEY!
const APP_SECRET = process.env.ALIEXPRESS_APP_SECRET!
const API_URL = 'https://api-sg.aliexpress.com/sync'

/* ─────────────────────────────────────────
   Signature HMAC-MD5 obligatoire AliExpress
───────────────────────────────────────── */
function sign(params: Record<string, string>): string {
  const sorted = Object.keys(params).sort()
  const str = APP_SECRET + sorted.map(k => k + params[k]).join('') + APP_SECRET
  return crypto.createHash('md5').update(str).digest('hex').toUpperCase()
}

function buildParams(method: string, extra: Record<string, string>) {
  const base: Record<string, string> = {
    method,
    app_key: APP_KEY,
    timestamp: String(Date.now()),
    format: 'json',
    v: '2.0',
    sign_method: 'md5',
    ...extra,
  }
  base.sign = sign(base)
  return base
}

async function call(method: string, extra: Record<string, string>) {
  const params = buildParams(method, extra)
  const qs = new URLSearchParams(params).toString()
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
  target_sale_price: string        // prix avec promo
  target_original_price: string    // prix original
  target_sale_price_currency: string
  evaluate_rate: string            // ex: "95.3%"
  lastest_volume: number           // ventes récentes
  second_level_category_name?: string
}

/**
 * Recherche via l'API Affiliate (ne nécessite pas de token OAuth)
 * Méthode : aliexpress.affiliate.product.query
 */
export async function searchProducts(
  keyword: string,
  page = 1,
  pageSize = 20,
): Promise<{ products: DSProduct[]; total: number }> {
  const raw = await call('aliexpress.affiliate.product.query', {
    keywords: keyword,
    page_no: String(page),
    page_size: String(pageSize),
    sort: 'LAST_VOLUME_DESC',
    currency: 'EUR',
    language: 'FR',
    ship_to_country: 'FR',
    fields: 'product_id,product_title,product_main_image_url,product_detail_url,target_sale_price,target_original_price,target_sale_price_currency,evaluate_rate,lastest_volume,second_level_category_name',
  })

  // La réponse est wrappée dans une clé dynamique
  const wrapper = raw?.aliexpress_affiliate_product_query_response
  if (!wrapper) {
    console.error('[AliExpress] Réponse inattendue:', JSON.stringify(raw).slice(0, 400))
    return { products: [], total: 0 }
  }

  const resp = wrapper.resp_result
  if (resp?.resp_code !== 200) {
    console.error('[AliExpress] Erreur API:', resp?.resp_msg)
    return { products: [], total: 0 }
  }

  const result = resp.result
  const list = result?.products?.product ?? []
  return {
    products: list,
    total: result?.total_record_count ?? 0,
  }
}

/**
 * Calcule le prix de vente avec marge
 * margin = 2.5 → ×2.5, arrondi au .99€ le plus proche
 */
export function calcSellingPrice(costPrice: number, margin = 2.5): number {
  return Math.ceil((costPrice * margin) / 5) * 5 - 0.01
}
