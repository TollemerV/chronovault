'use client'

import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import type { Product, Variant } from '@/lib/types'

type Props = { product: Product }

function getStars(r: number) { return '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r)) }

export default function ProductDetailClient({ product }: Props) {
  const { addItem } = useCart()
  const [activeImage, setActiveImage] = useState(0)
  const [activeVariant, setActiveVariant] = useState<Variant | undefined>(product.variants?.[0])
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const price = product.selling_price + (activeVariant?.price_modifier ?? 0)

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) addItem(product, activeVariant)
    setAdded(true)
    setTimeout(() => setAdded(false), 2200)
  }

  return (
    <div className="product-detail-page">
      {/* ─── Images ─── */}
      <div>
        <div className="product-main-image">
          <img
            src={product.images[activeImage] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900'}
            alt={product.title}
          />
        </div>
        {product.images.length > 1 && (
          <div className="product-thumbs">
            {product.images.map((img, i) => (
              <div
                key={i}
                className={`product-thumb ${activeImage === i ? 'active' : ''}`}
                onClick={() => setActiveImage(i)}
              >
                <img src={img} alt={`Vue ${i + 1}`} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Info ─── */}
      <div>
        <p className="product-info-eyebrow">Collection Prestige · ChronoVault</p>
        <h1 className="product-info-title">{product.title}</h1>
        <div className="product-info-divider" />

        <div className="product-info-price-block">
          <span className="product-info-price">€{price.toFixed(2)}</span>
          <div className="product-info-rating">
            <span style={{ color: 'var(--gold)', letterSpacing: '2px' }}>{getStars(product.rating)}</span>
            <span>{product.rating} ({product.review_count} avis)</span>
          </div>
        </div>

        <p className="product-info-desc">{product.description}</p>

        {/* Variants */}
        {product.variants?.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <p className="variant-label">{product.variants[0]?.name}</p>
            <div className="variant-options">
              {product.variants.map((v: Variant) => (
                <button
                  key={v.id}
                  className={`variant-opt ${activeVariant?.id === v.id ? 'active' : ''}`}
                  onClick={() => setActiveVariant(v)}
                >
                  {v.value}{v.price_modifier > 0 ? ` +€${v.price_modifier}` : ''}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Qty */}
        <div className="qty-row">
          <span className="qty-label">Quantité</span>
          <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
          <span className="qty-value">{qty}</span>
          <button className="qty-btn" onClick={() => setQty(q => q + 1)}>+</button>
        </div>

        {/* CTA */}
        <div className="cta-row">
          <button className={`btn-add ${added ? 'added' : ''}`} onClick={handleAdd}>
            {added ? '✓ Ajouté au panier' : 'Ajouter au panier'}
          </button>
        </div>

        {/* Guarantees */}
        <div className="product-guarantees">
          {[
            ['🚚', 'Livraison gratuite dès 60€'],
            ['↩️', 'Retours acceptés sous 30 jours'],
            ['🔒', 'Paiement 100% sécurisé'],
            ['✦', 'Qualité vérifiée par nos experts'],
          ].map(([icon, text]) => (
            <div key={text} className="guarantee-row">
              <span>{icon}</span><span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
