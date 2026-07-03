'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import type { Product } from '@/lib/types'
import { useCart } from '@/context/CartContext'

type Props = { products: Product[] }

const HERO_WATCHES = [
  { src: '/watch_1.jpg', name: 'Héritage 1921', sub: 'Or Rose · Cadran Blanc' },
  { src: '/watch_2.jpg', name: 'Héritage 1865', sub: 'Or Rose · Cadran Anthracite' },
  { src: '/watch_3.jpg', name: 'Héritage 1939', sub: 'Or Jaune · Cadran Ivoire' },
]

const MARQUEE = [
  'Qualité Certifiée','Livraison Mondiale','Retours 30 Jours',
  'Paiement Sécurisé','Service Premium','Sélection Exclusive',
  'Qualité Certifiée','Livraison Mondiale','Retours 30 Jours',
  'Paiement Sécurisé','Service Premium','Sélection Exclusive',
]

function getStars(r: number) { return '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r)) }
function getDiscount(sell: number, cost: number) { return Math.round(((sell - cost) / sell) * 100) }

export default function HomeClient({ products }: Props) {
  const { addItem } = useCart()
  const revealRefs = useRef<HTMLElement[]>([])

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    )
    revealRefs.current.forEach(el => el && obs.observe(el))
    return () => obs.disconnect()
  }, [products])

  useEffect(() => {
    const glow = document.createElement('div')
    glow.className = 'cursor-glow'
    document.body.appendChild(glow)
    const move = (e: MouseEvent) => {
      glow.style.left = e.clientX + 'px'
      glow.style.top = e.clientY + 'px'
    }
    window.addEventListener('mousemove', move)
    return () => { window.removeEventListener('mousemove', move); glow.remove() }
  }, [])

  const ref = (el: HTMLElement | null) => {
    if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el)
  }

  return (
    <>
      {/* ══════════════════════════════
          HERO — style Ambassador
      ══════════════════════════════ */}
      <section className="amb-hero">

        {/* Lumière radiale centrée */}
        <div className="amb-hero-light" />

        {/* Texte centré */}
        <div className="amb-hero-text">
          <p className="amb-eyebrow">Horlogerie Traditionnelle</p>
          <h1 className="amb-title">
            Incomparable<br />
            <em>Timepieces</em>
          </h1>
          <p className="amb-desc">
            Ambassadeur des artisans de la tradition. Chaque pièce est un témoignage
            de savoir-faire exceptionnel, une part de l'histoire du temps.
          </p>
          <a href="#collection" className="amb-btn">
            <span>Explorer les modèles</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </div>

        {/* Grande montre centrale (hero close-up) */}
        <div className="amb-hero-watch">
          <img src="/watch_hero.jpg" alt="ChronoVault Hero Watch" />
          <div className="amb-hero-watch-glow" />
        </div>

        {/* 3 cards Heritage */}
        <div className="amb-heritage-grid">
          {HERO_WATCHES.map((w, i) => (
            <div key={w.name} className="amb-heritage-card" style={{ animationDelay: `${1.2 + i * 0.15}s` }}>
              <div className="amb-heritage-img-wrap">
                <img src={w.src} alt={w.name} />
              </div>
              <div className="amb-heritage-info">
                <h3 className="amb-heritage-name">{w.name}</h3>
                <p className="amb-heritage-sub">{w.sub}</p>
                <a href="#collection" className="amb-heritage-link">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8l4 4-4 4M8 12h8"/></svg>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="scroll-indicator">
          <div className="scroll-line" />
          <span className="scroll-text">Défiler</span>
        </div>
      </section>

      {/* ══════ MARQUEE ══════ */}
      <div className="marquee-section">
        <div className="marquee-track">
          {MARQUEE.map((item, i) => (
            <div className="marquee-item" key={i}>
              <div className="marquee-dot" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* ══════ COLLECTION ══════ */}
      <section className="collection-section" id="collection">
        <div className="collection-header reveal" ref={ref as React.RefCallback<HTMLDivElement>}>
          <div>
            <p className="section-label">Notre sélection</p>
            <h2 className="section-title">La Collection<br /><em>Prestige</em></h2>
          </div>
          <span className="collection-count">{products.length} pièces</span>
        </div>

        {products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">⌚</div>
            <h3 className="empty-title">La collection arrive bientôt</h3>
            <p className="empty-text">Exécutez le schéma SQL dans Supabase pour voir les produits.</p>
            <Link href="/admin" className="btn-gold"><span>Aller à l'admin</span></Link>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((p, idx) => (
              <div
                key={p.id}
                className={`reveal reveal-delay-${(idx % 3) + 1} ${idx === 0 ? 'featured-card' : ''}`}
                ref={ref as React.RefCallback<HTMLDivElement>}
              >
                <Link href={`/product/${p.id}`} className="product-card">
                  <div className="product-card-image-wrap">
                    <img
                      src={p.images[0] || '/watch_1.jpg'}
                      alt={p.title}
                      loading="lazy"
                    />
                    <div className="product-card-overlay" />
                    <span className="product-card-discount">-{getDiscount(p.selling_price, p.price)}%</span>
                  </div>
                  <div className="product-card-body">
                    <div>
                      <h3 className="product-card-title">{p.title}</h3>
                      <div className="product-card-rating">
                        <span className="product-card-stars">{getStars(p.rating)}</span>
                        <span>{p.rating} · {p.review_count} avis</span>
                      </div>
                    </div>
                    <div className="product-card-price">€{p.selling_price.toFixed(2)}</div>
                  </div>
                  <button
                    className="product-card-add"
                    onClick={e => { e.preventDefault(); e.stopPropagation(); addItem(p, p.variants?.[0]) }}
                    title="Ajouter au panier"
                  >+</button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ══════ CATÉGORIES ══════ */}
      <section className="cat-section">
        <div className="cat-header reveal" ref={ref as React.RefCallback<HTMLDivElement>}>
          <p className="section-label">Explorer par style</p>
          <h2 className="section-title">Nos <em>Catégories</em></h2>
        </div>
        <div className="cat-grid">
          {CATEGORIES.map((cat, i) => (
            <a
              key={cat.name}
              href={`/categorie/${cat.slug}`}
              className={`cat-card reveal reveal-delay-${(i % 4) + 1}`}
              ref={ref as React.RefCallback<HTMLAnchorElement>}
            >
              <div className="cat-img-wrap">
                <img src={cat.img} alt={cat.name} loading="lazy" />
                <div className="cat-overlay" />
              </div>
              <div className="cat-body">
                <h3 className="cat-name">{cat.name}</h3>
                <p className="cat-count">{cat.count} modèles</p>
                <span className="cat-arrow">→</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ══════ TECHNIQUE / HORLOGERIE ══════ */}
      <section className="tech-section">
        <div className="tech-left reveal" ref={ref as React.RefCallback<HTMLDivElement>}>
          <div className="tech-img-wrap">
            <img src="/movement.jpg" alt="Mouvement horloger" />
            <div className="tech-img-badge">
              <span className="tech-badge-num">17</span>
              <span className="tech-badge-label">Rubis</span>
            </div>
          </div>
        </div>
        <div className="tech-right reveal reveal-delay-2" ref={ref as React.RefCallback<HTMLDivElement>}>
          <p className="section-label">L'art de l'horlogerie</p>
          <h2 className="section-title" style={{ marginBottom: '24px' }}>Le Calibre<br /><em>Manufacture</em></h2>
          <div className="tech-divider" />
          <p className="tech-desc">
            Chaque mouvement est assemblé à la main par nos maîtres horlogers.
            La précision de nos mécanismes garantit une exactitude à ±2 secondes
            par jour — l'excellence à l'état pur.
          </p>
          <div className="tech-specs">
            {[
              { label: 'Mouvement', value: 'Automatique Swiss Made' },
              { label: 'Réserve de marche', value: '72 heures' },
              { label: 'Fréquence', value: '28 800 alt/h · 4 Hz' },
              { label: 'Verre', value: 'Saphir antireflet' },
              { label: 'Étanchéité', value: '50 mètres / 5 ATM' },
              { label: 'Finition', value: 'Côtes de Genève, perlage' },
            ].map(s => (
              <div key={s.label} className="tech-spec-row">
                <span className="tech-spec-label">{s.label}</span>
                <span className="tech-spec-value">{s.value}</span>
              </div>
            ))}
          </div>
          <a href="/boutique" className="btn-gold" style={{ marginTop: '36px', display: 'inline-flex' }}>
            <span>Découvrir la collection</span>
          </a>
        </div>
      </section>
    </>
  )
}

const CATEGORIES = [
  { name: 'Automatique', count: 24, img: '/watch_1.jpg', slug: 'automatique' },
  { name: 'Chronographe', count: 18, img: '/wc2.jpg', slug: 'chronographe' },
  { name: 'Collection Femme', count: 15, img: '/wc3.jpg', slug: 'femme' },
  { name: 'Héritage', count: 12, img: '/watch_3.jpg', slug: 'heritage' },
]
