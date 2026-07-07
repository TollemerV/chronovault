import { NextRequest, NextResponse } from 'next/server'

/* ─────────────────────────────────────────
   Scrape une page produit AliExpress et extrait
   les données structurées (JSON-LD + window.runParams)
───────────────────────────────────────── */

function extractProductId(url: string): string | null {
  const m = url.match(/\/item\/(\d+)/)
  return m ? m[1] : null
}

function tryParseJSON(str: string): Record<string, unknown> | null {
  try { return JSON.parse(str) } catch { return null }
}

/* Extrait le JSON-LD (schema.org Product) */
function extractJsonLd(html: string) {
  const matches = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
  for (const m of matches) {
    const data = tryParseJSON(m[1].trim())
    if (data && (data['@type'] === 'Product' || data['@type'] === 'http://schema.org/Product')) {
      return data
    }
  }
  return null
}

/* Extrait window.runParams — contient images, SKUs, prix */
function extractRunParams(html: string) {
  // Pattern 1
  let m = html.match(/window\.runParams\s*=\s*(\{[\s\S]*?\});\s*\n/)
  if (m) return tryParseJSON(m[1])
  // Pattern 2 (minifié)
  m = html.match(/runParams":(\{[\s\S]{100,10000}?\})/)
  if (m) return tryParseJSON(m[1])
  return null
}

/* Extrait data-spm ou meta og: */
function extractMeta(html: string): { title?: string; image?: string; price?: string } {
  const title = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)?.[1]
    ?? html.match(/<title>([^<]+)<\/title>/i)?.[1]?.replace(/ - AliExpress.*$/i, '').trim()

  const image = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)?.[1]

  const price = html.match(/<meta[^>]+itemprop="price"[^>]+content="([^"]+)"/i)?.[1]
    ?? html.match(/"price"\s*:\s*"([\d.]+)"/)?.[1]

  return { title, image, price }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Paramètre url requis' }, { status: 400 })
  }

  const productId = extractProductId(url)
  if (!productId) {
    return NextResponse.json({ error: "URL AliExpress invalide (format attendu : /item/1234567890.html)" }, { status: 400 })
  }

  /* ── Fetch de la page ── */
  const targetUrl = `https://fr.aliexpress.com/item/${productId}.html`

  let html = ''
  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Referer': 'https://fr.aliexpress.com/',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      return NextResponse.json({ error: `AliExpress a retourné ${res.status}` }, { status: 502 })
    }

    html = await res.text()
  } catch (err) {
    return NextResponse.json({ error: `Erreur réseau : ${err}` }, { status: 502 })
  }

  /* ── Extraction des données ── */
  const meta = extractMeta(html)
  const jsonLd = extractJsonLd(html)
  const runParams = extractRunParams(html)

  /* Titre */
  const title: string =
    (jsonLd?.name as string)
    ?? meta.title
    ?? `Produit AliExpress ${productId}`

  /* Images */
  let images: string[] = []
  // JSON-LD
  if (jsonLd?.image) {
    images = Array.isArray(jsonLd.image) ? jsonLd.image as string[] : [jsonLd.image as string]
  }
  // runParams → imageModule
  if (images.length === 0 && runParams) {
    const imgData = (runParams as Record<string, unknown>)?.data as Record<string, unknown>
    const imgModule = imgData?.imageModule as Record<string, unknown>
    const imagePathList = imgModule?.imagePathList as string[]
    if (Array.isArray(imagePathList)) images = imagePathList.map((p: string) => p.startsWith('http') ? p : `https:${p}`)
  }
  // og:image
  if (images.length === 0 && meta.image) images = [meta.image]

  /* Prix */
  let price = 0
  // JSON-LD offers
  if (jsonLd?.offers) {
    const offers = jsonLd.offers as Record<string, unknown>
    price = parseFloat(String(Array.isArray(offers) ? (offers[0] as Record<string, unknown>)?.price : offers.price)) || 0
  }
  // runParams
  if (!price && runParams) {
    const priceData = ((runParams as Record<string, unknown>)?.data as Record<string, unknown>)?.priceModule as Record<string, unknown>
    price = parseFloat(String(priceData?.minAmount ?? priceData?.formatedActivityPrice ?? '0')) || 0
  }
  if (!price && meta.price) price = parseFloat(meta.price) || 0

  /* Rating */
  let rating = 4.5
  if (jsonLd?.aggregateRating) {
    const r = jsonLd.aggregateRating as Record<string, unknown>
    rating = parseFloat(String(r.ratingValue)) || 4.5
  }

  /* Review count */
  let reviewCount = 0
  if (jsonLd?.aggregateRating) {
    const r = jsonLd.aggregateRating as Record<string, unknown>
    reviewCount = parseInt(String(r.reviewCount ?? r.ratingCount ?? '0')) || 0
  }

  /* Vérification que la page contient bien des données produit */
  if (!title && images.length === 0 && price === 0) {
    return NextResponse.json({
      error: "AliExpress a retourné une page vide ou de vérification. Essaie avec une URL directe vers un produit.",
      productId,
      debug: { hasMeta: !!meta.title, hasJsonLd: !!jsonLd, hasRunParams: !!runParams }
    }, { status: 422 })
  }

  return NextResponse.json({
    ok: true,
    productId,
    title,
    images,
    price,
    rating,
    reviewCount,
    sourceUrl: targetUrl,
  })
}
