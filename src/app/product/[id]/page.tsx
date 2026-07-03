'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'

/* ────────────────────────────────────── */
const PRODUCT = {
  id: 'p1',
  brand: 'ChronoVault',
  collection: 'Collection Prestige',
  name: 'HÉRITAGE 1921',
  subname: 'Or Rose · Cadran Blanc',
  price: 340,
  salePrice: 189,
  stock: 4,
  rating: 4.8,
  reviews: 247,
  images: ['/watch_1.jpg', '/watch_hero.jpg', '/movement.jpg', '/watch_3.jpg'],
  description: `Incarnation de l'élégance intemporelle, la Héritage 1921 allie la précision d'un mouvement automatique Swiss Made à l'esthétique raffinée des grandes maisons horlogères.`,
  specs: [
    { label: 'Mouvement', value: 'Automatique — 28 800 alt/h' },
    { label: 'Réserve de marche', value: '42 heures' },
    { label: 'Boîtier', value: 'Or rose PVD — 40 mm' },
    { label: 'Verre', value: 'Saphir anti-reflet' },
    { label: 'Étanchéité', value: '5 ATM — 50 mètres' },
    { label: 'Bracelet', value: 'Cuir Vachetta brun' },
  ],
  variants: [
    { label: 'VERSION', options: ['Automatique · Or Rose', 'Automatique · Acier', 'Quartz · Or Rose'] },
    { label: 'BRACELET', options: ['Cuir Brun', 'Bracelet Acier', 'Cuir Noir'] },
  ],
}

const DEADLINE = Date.now() + 24 * 60 * 60 * 1000
function pad(n: number) { return String(n).padStart(2, '0') }

const RELATED = [
  { id: 'r1', name: 'Héritage 1865', price: 219, img: '/watch_2.jpg' },
  { id: 'r2', name: 'Héritage 1939', price: 199, img: '/watch_3.jpg' },
  { id: 'r3', name: 'Prestige Bleu', price: 249, img: '/wc1.jpg' },
  { id: 'r4', name: 'Chrono Sport', price: 349, img: '/wc2.jpg' },
]

/* ── SVG Icons (line-art, brand DA) ─── */
const IconGear = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
  </svg>
)
const IconShield = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)
const IconLock = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
)
const IconTruck = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
)
const IconBox = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
)
const IconRotate = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>
  </svg>
)

const ENGAGEMENTS = [
  { icon: <IconGear />, label: 'Savoir-faire', desc: 'Assemblage par nos horlogers' },
  { icon: <IconLock />, label: 'Paiement', desc: 'Paiement en ligne sécurisé' },
  { icon: <IconShield />, label: 'Garantie', desc: "Couverture d'assurance incluse" },
  { icon: <IconTruck />, label: 'Livraison & expédition', desc: 'Expédition internationale offerte' },
  { icon: <IconBox />, label: 'Écrin', desc: 'Emballage luxe inclus' },
  { icon: <IconRotate />, label: 'Satisfait ou remboursé', desc: 'Retour gratuit sous 14 jours' },
]

export default function ProductPage() {
  const { addItem } = useCart()
  const [activeImg, setActiveImg] = useState(0)
  const [selections, setSelections] = useState<string[]>(PRODUCT.variants.map(v => v.options[0]))
  const [openVariant, setOpenVariant] = useState<number | null>(null)
  const [added, setAdded] = useState(false)
  const [timeLeft, setTimeLeft] = useState({ h: 24, m: 0, s: 0 })
  const [engOpen, setEngOpen] = useState(true)

  const discount = Math.round(((PRODUCT.price - PRODUCT.salePrice) / PRODUCT.price) * 100)

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, DEADLINE - Date.now())
      setTimeLeft({
        h: Math.floor(diff / 3_600_000),
        m: Math.floor((diff % 3_600_000) / 60_000),
        s: Math.floor((diff % 60_000) / 1_000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const handleAdd = () => {
    addItem({
      id: PRODUCT.id,
      title: PRODUCT.name,
      description: PRODUCT.description,
      images: PRODUCT.images,
      price: PRODUCT.salePrice * 0.4,
      selling_price: PRODUCT.salePrice,
      stock: PRODUCT.stock,
      rating: PRODUCT.rating,
      review_count: PRODUCT.reviews,
      category: 'montres',
      variants: [],
      aliexpress_id: 'CV-1921',
      created_at: new Date().toISOString(),
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2500)
  }

  return (
    <div className="pdp2-page">

      {/* ─── Breadcrumb ─── */}
      <nav className="pdp2-breadcrumb">
        <Link href="/">Accueil</Link>
        <span>/</span>
        <Link href="/boutique">Boutique</Link>
        <span>/</span>
        <span>{PRODUCT.name}</span>
      </nav>

      {/* ─── Main layout ─── */}
      <div className="pdp2-layout">

        {/* Galerie */}
        <div className="pdp2-gallery">
          <div className="pdp2-thumbs">
            {PRODUCT.images.map((img, i) => (
              <button
                key={i}
                className={`pdp2-thumb ${i === activeImg ? 'active' : ''}`}
                onClick={() => setActiveImg(i)}
              >
                <img src={img} alt={`Vue ${i + 1}`} />
              </button>
            ))}
          </div>

          <div className="pdp2-main-img">
            {/* Badge réduction */}
            <div className="pdp2-img-badge">-{discount}%</div>
            <img src={PRODUCT.images[activeImg]} alt={PRODUCT.name} />
            {/* Nav flèches */}
            <button className="pdp2-arrow pdp2-arrow-l" onClick={() => setActiveImg(i => Math.max(0, i - 1))}>‹</button>
            <button className="pdp2-arrow pdp2-arrow-r" onClick={() => setActiveImg(i => Math.min(PRODUCT.images.length - 1, i + 1))}>›</button>
          </div>
        </div>

        {/* Infos */}
        <div className="pdp2-info">
          <p className="pdp2-brand">{PRODUCT.brand}</p>
          <h1 className="pdp2-title">{PRODUCT.name}</h1>

          {/* Prix + badge */}
          <div className="pdp2-price-row">
            <span className="pdp2-price-sale">{PRODUCT.salePrice}€</span>
            <span className="pdp2-price-orig">{PRODUCT.price}€</span>
            <span className="pdp2-collection-badge">{PRODUCT.collection}</span>
          </div>

          {/* Rating + social proof */}
          <div className="pdp2-meta-row">
            <div className="pdp2-stars">
              {'★'.repeat(Math.round(PRODUCT.rating))}{'☆'.repeat(5 - Math.round(PRODUCT.rating))}
            </div>
            <span className="pdp2-rating-val">{PRODUCT.rating}/5</span>
            <span className="pdp2-sep">·</span>
            <span className="pdp2-collectors">{PRODUCT.reviews}+ COLLECTIONNEURS</span>
          </div>

          {/* Scarcity — discret */}
          <div className="pdp2-demand">
            <span className="pdp2-demand-dot" />
            <span>En forte demande · <strong>Plus que {PRODUCT.stock} exemplaires</strong> · Offre expire dans <strong>{pad(timeLeft.h)}:{pad(timeLeft.m)}:{pad(timeLeft.s)}</strong></span>
          </div>

          {/* Variantes */}
          <div className="pdp2-variants">
            {PRODUCT.variants.map((v, vi) => (
              <div key={v.label} className="pdp2-variant-row">
                <button
                  className="pdp2-variant-trigger"
                  onClick={() => setOpenVariant(openVariant === vi ? null : vi)}
                >
                  <span className="pdp2-variant-label">{v.label}</span>
                  <span className="pdp2-variant-value">{selections[vi]}</span>
                  <svg className={`pdp2-chevron ${openVariant === vi ? 'open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 9l6 6 6-6"/></svg>
                </button>
                {openVariant === vi && (
                  <div className="pdp2-variant-options">
                    {v.options.map(opt => (
                      <button
                        key={opt}
                        className={`pdp2-option ${selections[vi] === opt ? 'active' : ''}`}
                        onClick={() => { setSelections(s => { const n = [...s]; n[vi] = opt; return n }); setOpenVariant(null) }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA */}
          <button className={`pdp2-cta ${added ? 'added' : ''}`} onClick={handleAdd}>
            {added ? '✓ Ajouté au panier' : `AJOUTER AU PANIER — ${PRODUCT.salePrice}€`}
          </button>

          {/* NOS ENGAGEMENTS */}
          <div className="pdp2-engagements">
            <button className="pdp2-eng-header" onClick={() => setEngOpen(o => !o)}>
              <span>NOS ENGAGEMENTS</span>
              <svg className={`pdp2-chevron ${engOpen ? 'open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            {engOpen && (
              <div className="pdp2-eng-grid">
                {ENGAGEMENTS.map(e => (
                  <div key={e.label} className="pdp2-eng-item">
                    <div className="pdp2-eng-icon">{e.icon}</div>
                    <div>
                      <p className="pdp2-eng-label">{e.label}</p>
                      <p className="pdp2-eng-desc">{e.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Description + Specs ─── */}
      <div className="pdp2-details">
        <div>
          <h2 className="pdp2-section-h">À propos</h2>
          <p className="pdp2-desc-text">{PRODUCT.description}</p>
        </div>
        <div>
          <h2 className="pdp2-section-h">Spécifications</h2>
          {PRODUCT.specs.map(s => (
            <div key={s.label} className="pdp2-spec-row">
              <span>{s.label}</span>
              <span>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Articles similaires ─── */}
      <div className="pdp2-related">
        <h2 className="pdp2-section-h" style={{ marginBottom: '28px' }}>Vous aimerez aussi</h2>
        <div className="pdp2-related-grid">
          {RELATED.map(r => (
            <Link key={r.id} href={`/product/${r.id}`} className="pdp2-related-card">
              <div className="pdp2-related-img">
                <img src={r.img} alt={r.name} loading="lazy" />
              </div>
              <p className="pdp2-related-brand">ChronoVault</p>
              <h3 className="pdp2-related-name">{r.name}</h3>
              <p className="pdp2-related-price">{r.price} €</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
