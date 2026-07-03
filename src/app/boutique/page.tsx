'use client'

import React from 'react'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'

/* ─────────────────────────────────────
   DONNÉES STATIQUES (à brancher sur Supabase après)
───────────────────────────────────── */
const CATALOGUE = [
  {
    id: 'b1',
    brand: 'ChronoVault',
    name: 'Prestige Automatique Bleu',
    ref: 'CV-1021-BL',
    variants: 3,
    price: 249,
    priceOld: null,
    badge: null,
    img: '/wc1.jpg',
  },
  {
    id: 'b2',
    brand: 'ChronoVault',
    name: 'Sport Chronographe Noir',
    ref: 'CV-2045-BK',
    variants: 2,
    price: 349,
    priceOld: null,
    badge: null,
    img: '/wc2.jpg',
  },
  {
    id: 'b3',
    brand: 'ChronoVault',
    name: 'Éclat Rose Gold',
    ref: 'CV-3012-RG',
    variants: 4,
    price: 289,
    priceOld: null,
    badge: null,
    img: '/wc3.jpg',
  },
  // Bannière promo à la position 4 (index 3) — gérée dans le render
  {
    id: 'b4',
    brand: 'ChronoVault',
    name: 'Héritage 1921',
    ref: 'CV-1921-WH',
    variants: 2,
    price: 189,
    priceOld: null,
    badge: null,
    img: '/watch_1.jpg',
  },
  {
    id: 'b5',
    brand: 'ChronoVault',
    name: 'Héritage 1865 Anthracite',
    ref: 'CV-1865-AN',
    variants: 1,
    price: 219,
    priceOld: 312,
    badge: 'Soldes',
    img: '/watch_2.jpg',
  },
  {
    id: 'b6',
    brand: 'ChronoVault',
    name: 'Héritage 1939 Ivoire',
    ref: 'CV-1939-IV',
    variants: 3,
    price: 199,
    priceOld: 260,
    badge: '-30%',
    img: '/watch_3.jpg',
  },
  {
    id: 'b7',
    brand: 'ChronoVault',
    name: 'Prestige Automatique Bleu II',
    ref: 'CV-1022-BL',
    variants: 2,
    price: 279,
    priceOld: null,
    badge: null,
    img: '/wc1.jpg',
  },
  {
    id: 'b8',
    brand: 'ChronoVault',
    name: 'Sport Chronographe Pro',
    ref: 'CV-2046-BK',
    variants: 3,
    price: 389,
    priceOld: null,
    badge: 'Nouveau',
    img: '/wc2.jpg',
  },
]

const SORTS = ['Recommandés', 'Prix croissant', 'Prix décroissant', 'Nouveautés']
const FILTERS = ['Tous', 'Automatique', 'Chronographe', 'Femme', 'Homme', 'Soldes']

export default function BoutiquePage() {
  const { addItem } = useCart()
  const [activeFilter, setActiveFilter] = useState('Tous')
  const [activeSort, setActiveSort] = useState('Recommandés')
  const [wishlist, setWishlist] = useState<string[]>([])

  const toggleWish = (id: string) =>
    setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  return (
    <div className="boutique-page">
      {/* ─── Header ─── */}
      <div className="boutique-header">
        <div>
          {/* Breadcrumb */}
          <nav className="boutique-breadcrumb">
            <Link href="/">Accueil</Link>
            <span>/</span>
            <span>Boutique</span>
          </nav>
          <h1 className="boutique-title">Collection <em>Prestige</em></h1>
          <p className="boutique-count">{CATALOGUE.length} montres</p>
        </div>
      </div>

      {/* ─── Filtres ─── */}
      <div className="boutique-filters">
        <div className="boutique-filter-pills">
          {FILTERS.map(f => (
            <button
              key={f}
              className={`filter-pill ${activeFilter === f ? 'active' : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="boutique-sort">
          <span className="sort-label">Trier par</span>
          <select
            className="sort-select"
            value={activeSort}
            onChange={e => setActiveSort(e.target.value)}
          >
            {SORTS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* ─── Grille ─── */}
      <div className="boutique-grid">
        {CATALOGUE.map((item, idx) => (
          <React.Fragment key={item.id}>
            {/* Bannière promo insérée après le 3e produit */}
            {idx === 3 && (
              <div key="promo" className="boutique-promo-card">
                <div className="promo-inner">
                  <p className="promo-eyebrow">Offre limitée</p>
                  <h2 className="promo-title">2ÈME<br />DÉMARQUE</h2>
                  <div className="promo-divider" />
                  <p className="promo-sub">Notre sélection à</p>
                  <p className="promo-pct">-30%</p>
                  <a href="#" className="promo-btn">Découvrir →</a>
                </div>
              </div>
            )}

            <div key={item.id} className="boutique-card">
              {/* Badges */}
              <div className="boutique-card-badges">
                {item.badge && (
                  <span className={`boutique-badge ${item.badge === 'Soldes' ? 'badge-soldes' : item.badge === 'Nouveau' ? 'badge-new' : 'badge-promo'}`}>
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Wishlist */}
              <button
                className={`boutique-wish ${wishlist.includes(item.id) ? 'wished' : ''}`}
                onClick={() => toggleWish(item.id)}
                title="Coup de cœur"
              >
                {wishlist.includes(item.id) ? '♥' : '♡'}
              </button>

              {/* Image */}
              <Link href={`/product/${item.id}`} className="boutique-card-img-wrap">
                <img src={item.img} alt={item.name} loading="lazy" />
              </Link>

              {/* Info */}
              <div className="boutique-card-body">
                <p className="boutique-brand">{item.brand}</p>
                <Link href={`/product/${item.id}`}>
                  <h3 className="boutique-name">{item.name}</h3>
                </Link>
                {item.variants > 1 && (
                  <p className="boutique-variants">+ {item.variants - 1} modèle{item.variants > 2 ? 's' : ''}</p>
                )}
              </div>

              {/* Footer */}
              <div className="boutique-card-footer">
                <div className="boutique-prices">
                  <span className="boutique-price">
                    {item.priceOld ? (
                      <span className="price-sale">{item.price} €</span>
                    ) : (
                      <span>{item.price} €</span>
                    )}
                  </span>
                  {item.priceOld && (
                    <span className="price-old">{item.priceOld} €</span>
                  )}
                </div>
                <button
                  className="boutique-add-btn"
                  onClick={() => addItem(
                    {
                      id: item.id,
                      title: item.name,
                      description: '',
                      images: [item.img],
                      price: item.price * 0.4,
                      selling_price: item.price,
                      stock: 10,
                      rating: 4.5,
                      review_count: 24,
                      category: 'montres',
                      variants: [],
                      aliexpress_id: item.ref,
                      created_at: new Date().toISOString(),
                    }
                  )}
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
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
