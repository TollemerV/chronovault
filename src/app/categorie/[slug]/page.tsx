'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCart } from '@/context/CartContext'

/* ──────────────────────────────────────
   Produits statiques (déclarés EN PREMIER pour éviter le TDZ)
────────────────────────────────────── */
const ITEMS_ALL = [
  // Automatique
  { id: 'a1', cat: 'automatique', name: 'Prestige Automatique Bleu', price: 249, priceOld: null as number | null, badge: null as string | null, variants: 3, img: '/wc1.jpg' },
  { id: 'a2', cat: 'automatique', name: 'Héritage 1921 Automatique', price: 189, priceOld: null as number | null, badge: null as string | null, variants: 2, img: '/watch_1.jpg' },
  { id: 'a3', cat: 'automatique', name: 'Calibre RW-101 Squelette', price: 389, priceOld: 520 as number | null, badge: 'Soldes' as string | null, variants: 1, img: '/movement.jpg' },
  { id: 'a4', cat: 'automatique', name: 'Grand Classique Or Rose', price: 319, priceOld: null as number | null, badge: 'Nouveau' as string | null, variants: 2, img: '/watch_hero.jpg' },
  { id: 'a5', cat: 'automatique', name: 'Prestige Automatique Ivoire', price: 269, priceOld: null as number | null, badge: null as string | null, variants: 3, img: '/watch_3.jpg' },
  { id: 'a6', cat: 'automatique', name: 'Automatique Édition Limitée', price: 459, priceOld: null as number | null, badge: 'Nouveau' as string | null, variants: 1, img: '/wc1.jpg' },
  // Chronographe
  { id: 'c1', cat: 'chronographe', name: 'Sport Chronographe Noir', price: 349, priceOld: null as number | null, badge: null as string | null, variants: 2, img: '/wc2.jpg' },
  { id: 'c2', cat: 'chronographe', name: 'Chrono Racing Or Rose', price: 419, priceOld: 560 as number | null, badge: '-25%' as string | null, variants: 1, img: '/wc2.jpg' },
  { id: 'c3', cat: 'chronographe', name: 'Chrono Bicompax Anthracite', price: 299, priceOld: null as number | null, badge: 'Nouveau' as string | null, variants: 3, img: '/wc2.jpg' },
  { id: 'c4', cat: 'chronographe', name: 'Sport Pro Tachymètre', price: 379, priceOld: null as number | null, badge: null as string | null, variants: 2, img: '/wc2.jpg' },
  // Femme
  { id: 'f1', cat: 'femme', name: 'Éclat Rose Gold', price: 289, priceOld: null as number | null, badge: null as string | null, variants: 4, img: '/wc3.jpg' },
  { id: 'f2', cat: 'femme', name: 'Pavé Diamants Mini', price: 349, priceOld: null as number | null, badge: 'Nouveau' as string | null, variants: 2, img: '/wc3.jpg' },
  { id: 'f3', cat: 'femme', name: 'Moonphase Femme Ivoire', price: 259, priceOld: 340 as number | null, badge: 'Soldes' as string | null, variants: 3, img: '/wc3.jpg' },
  { id: 'f4', cat: 'femme', name: 'Dresswatch Nacre Rose', price: 219, priceOld: null as number | null, badge: null as string | null, variants: 2, img: '/wc3.jpg' },
  // Héritage
  { id: 'h1', cat: 'heritage', name: 'Héritage 1865 Anthracite', price: 219, priceOld: 312 as number | null, badge: 'Soldes' as string | null, variants: 1, img: '/watch_2.jpg' },
  { id: 'h2', cat: 'heritage', name: 'Héritage 1939 Ivoire', price: 199, priceOld: 260 as number | null, badge: '-30%' as string | null, variants: 3, img: '/watch_3.jpg' },
  { id: 'h3', cat: 'heritage', name: 'Héritage 1921 Or Rose', price: 189, priceOld: null as number | null, badge: null as string | null, variants: 2, img: '/watch_1.jpg' },
  { id: 'h4', cat: 'heritage', name: 'Héritage Grand Millésime', price: 279, priceOld: null as number | null, badge: 'Nouveau' as string | null, variants: 2, img: '/watch_hero.jpg' },
]

/* ──────────────────────────────────────
   Données par catégorie
────────────────────────────────────── */
const CATALOGUE_BY_CAT: Record<string, {
  label: string
  description: string
  heroImg: string
  items: typeof ITEMS_ALL
}> = {
  automatique: {
    label: 'Montres Automatiques',
    description: "La beauté du mécanique. Chaque rotation du rotor alimente un ballet de rouages miniatures — l'horlogerie à son état le plus pur.",
    heroImg: '/watch_1.jpg',
    items: ITEMS_ALL.filter(i => i.cat === 'automatique'),
  },
  chronographe: {
    label: 'Chronographes',
    description: "La précision au service de la performance. Nos chronographes allient technicité et élégance pour les esprits exigeants.",
    heroImg: '/wc2.jpg',
    items: ITEMS_ALL.filter(i => i.cat === 'chronographe'),
  },
  femme: {
    label: 'Collection Femme',
    description: "Des pièces pensées pour elle. Raffinement, délicatesse et caractère — la montre comme expression de personnalité.",
    heroImg: '/wc3.jpg',
    items: ITEMS_ALL.filter(i => i.cat === 'femme'),
  },
  heritage: {
    label: 'Collection Héritage',
    description: "Inspirées des grandes manufactures du XXe siècle, nos montres Héritage perpétuent un savoir-faire centenaire.",
    heroImg: '/watch_3.jpg',
    items: ITEMS_ALL.filter(i => i.cat === 'heritage'),
  },
}

const SORTS = ['Recommandés', 'Prix croissant', 'Prix décroissant', 'Nouveautés']

export default function CategoriePage() {
  const params = useParams()
  const slug = (params?.slug as string) ?? ''
  const { addItem } = useCart()
  const [activeSort, setActiveSort] = useState('Recommandés')
  const [wishlist, setWishlist] = useState<string[]>([])

  const cat = CATALOGUE_BY_CAT[slug]

  if (!cat) {
    return (
      <div className="cat-page-404">
        <h1>Catégorie introuvable</h1>
        <Link href="/boutique" className="btn-gold"><span>Retour à la boutique</span></Link>
      </div>
    )
  }

  const toggleWish = (id: string) =>
    setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const sorted = [...cat.items].sort((a, b) => {
    if (activeSort === 'Prix croissant') return a.price - b.price
    if (activeSort === 'Prix décroissant') return b.price - a.price
    return 0
  })

  return (
    <div className="boutique-page">

      {/* ─── Hero catégorie ─── */}
      <div className="cat-page-hero">
        <div className="cat-page-hero-img">
          <img src={cat.heroImg} alt={cat.label} />
          <div className="cat-page-hero-overlay" />
        </div>
        <div className="cat-page-hero-content">
          <nav className="boutique-breadcrumb">
            <Link href="/">Accueil</Link>
            <span>/</span>
            <Link href="/boutique">Boutique</Link>
            <span>/</span>
            <span>{cat.label}</span>
          </nav>
          <h1 className="boutique-title">{cat.label.split(' ').slice(0, -1).join(' ')} <em>{cat.label.split(' ').slice(-1)}</em></h1>
          <p className="cat-page-desc">{cat.description}</p>
          <p className="boutique-count">{sorted.length} modèles</p>
        </div>
      </div>

      {/* ─── Filtres ─── */}
      <div className="boutique-filters" style={{ marginTop: '40px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Link href="/boutique" className="filter-pill">← Toutes les catégories</Link>
        </div>
        <div className="boutique-sort">
          <span className="sort-label">Trier par</span>
          <select className="sort-select" value={activeSort} onChange={e => setActiveSort(e.target.value)}>
            {SORTS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* ─── Grille produits ─── */}
      <div className="boutique-grid">
        {sorted.map(item => (
          <div key={item.id} className="boutique-card">
            <div className="boutique-card-badges">
              {item.badge && (
                <span className={`boutique-badge ${item.badge === 'Soldes' ? 'badge-soldes' : item.badge === 'Nouveau' ? 'badge-new' : 'badge-promo'}`}>
                  {item.badge}
                </span>
              )}
            </div>

            <button
              className={`boutique-wish ${wishlist.includes(item.id) ? 'wished' : ''}`}
              onClick={() => toggleWish(item.id)}
            >
              {wishlist.includes(item.id) ? '♥' : '♡'}
            </button>

            <Link href={`/product/${item.id}`} className="boutique-card-img-wrap">
              <img src={item.img} alt={item.name} loading="lazy" />
            </Link>

            <div className="boutique-card-body">
              <p className="boutique-brand">ChronoVault</p>
              <Link href={`/product/${item.id}`}>
                <h3 className="boutique-name">{item.name}</h3>
              </Link>
              {item.variants > 1 && (
                <p className="boutique-variants">+ {item.variants - 1} modèle{item.variants > 2 ? 's' : ''}</p>
              )}
            </div>

            <div className="boutique-card-footer">
              <div className="boutique-prices">
                <span className="boutique-price">
                  {item.priceOld ? <span className="price-sale">{item.price} €</span> : <span>{item.price} €</span>}
                </span>
                {item.priceOld && <span className="price-old">{item.priceOld} €</span>}
              </div>
              <button
                className="boutique-add-btn"
                onClick={() => addItem({
                  id: item.id,
                  title: item.name,
                  description: '',
                  images: [item.img],
                  price: item.price * 0.4,
                  selling_price: item.price,
                  stock: 10,
                  rating: 4.5,
                  review_count: 24,
                  category: slug,
                  variants: [],
                  aliexpress_id: item.id,
                  created_at: new Date().toISOString(),
                })}
                title="Ajouter au panier"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 01-8 0"/>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


