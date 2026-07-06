import crypto from 'crypto'

const APP_KEY = process.env.ALIEXPRESS_APP_KEY!
const APP_SECRET = process.env.ALIEXPRESS_APP_SECRET!
const API_URL = 'https://api-sg.aliexpress.com/sync'

/* ─────────────────────────────────────────
   Génère la signature HMAC-MD5 requise par AliExpress
   Doc: https://developers.aliexpress.com/doc.htm
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

async function call<T>(method: string, extra: Record<string, string>): Promise<T> {
  const params = buildParams(method, extra)
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`${API_URL}?${qs}`, { next: { revalidate: 300 } })
  if (!res.ok) throw new Error(`AliExpress HTTP ${res.status}`)
  const json = await res.json()
  // Toutes les réponses sont wrappées dans une clé dynamique
  const root = Object.values(json)[0] as { result?: T; error_response?: unknown }
  if (root?.error_response) throw new Error(JSON.stringify(root.error_response))
  return root?.result as T
}

/* ─────────────────────────────────────────
   Méthodes DS publiques (mode Test)
───────────────────────────────────────── */

export interface DSProduct {
  product_id: string
  subject: string
  product_main_image_url: string
  product_detail_url: string
  sale_price: string
  original_price: string
  discount: string
  evaluate_rate: string
  lastest_volume: number
  first_level_category_id: number
  second_level_category_id: number
}

export interface DSProductDetail {
  product_id: string
  subject: string
  product_main_image_url: string
  image_u_r_ls: string
  sale_price: string
  original_price: string
  currency_code: string
  product_detail_url: string
  aeop_ae_product_s_k_us: {
    aeop_ae_product_sku: Array<{
      sku_stock: boolean
      sku_price: string
      sku_id: string
      ipm_sku_stock: number
      sku_code: string
    }>
  }
  package_type: string
  package_height: string
  package_length: string
  package_width: string
  package_weight: string
  detail: string
}

/**
 * Recherche de produits DS par mot-clé
 */
export async function searchProducts(
  keyword: string,
  page = 1,
  pageSize = 20,
): Promise<{ products: DSProduct[]; total: number }> {
  const result = await call<{
    products: { product: DSProduct[] }
    total_record_count: number
  }>('aliexpress.ds.product.search', {
    keywords: keyword,
    page_no: String(page),
    page_size: String(pageSize),
    sort: 'SALE_PRICE_ASC',
    currency: 'EUR',
    locale: 'fr_FR',
    country: 'FR',
  })

  return {
    products: result?.products?.product ?? [],
    total: result?.total_record_count ?? 0,
  }
}

/**
 * Détail complet d'un produit DS
 */
export async function getProductDetail(productId: string): Promise<DSProductDetail | null> {
  const result = await call<DSProductDetail>(
    'aliexpress.ds.product.get',
    {
      product_id: productId,
      currency: 'EUR',
      locale: 'fr_FR',
      country: 'FR',
    },
  )
  return result ?? null
}

/**
 * Calcule le prix de vente avec marge
 * @param costPrice  prix AliExpress en €
 * @param margin     marge souhaitée (défaut 2.5× = 150%)
 */
export function calcSellingPrice(costPrice: number, margin = 2.5): number {
  return Math.ceil(costPrice * margin / 5) * 5 - 0.01
}
