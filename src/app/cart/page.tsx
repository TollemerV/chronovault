'use client'

import { useCart } from '@/context/CartContext'
import Link from 'next/link'

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, itemCount } = useCart()
  const shipping = total >= 60 ? 0 : 5.99

  if (itemCount === 0) {
    return (
      <div className="cart-page">
        <h1 className="page-title">Mon Panier</h1>
        <div className="empty-state" style={{ marginTop: '40px' }}>
          <div className="empty-icon">◻</div>
          <h3 className="empty-title">Votre panier est vide</h3>
          <p className="empty-text">Découvrez notre collection de montres de prestige</p>
          <Link href="/" className="btn-gold"><span>← Retour à la collection</span></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <h1 className="page-title">Mon Panier</h1>
      <p className="page-subtitle">{itemCount} article{itemCount > 1 ? 's' : ''}</p>

      <div className="cart-layout">
        {/* Items */}
        <div className="cart-items">
          {items.map(item => {
            const price = item.product.selling_price + (item.selected_variant?.price_modifier ?? 0)
            const key = `${item.product.id}-${item.selected_variant?.id ?? ''}`
            return (
              <div key={key} className="cart-item">
                <img className="cart-item-img" src={item.product.images[0]} alt={item.product.title} />
                <div style={{ flex: 1 }}>
                  <p className="cart-item-name">{item.product.title}</p>
                  {item.selected_variant && (
                    <p className="cart-item-variant">
                      {item.selected_variant.name}: {item.selected_variant.value}
                    </p>
                  )}
                </div>
                <div className="qty-control">
                  <button className="qty-btn" onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selected_variant?.id)}>−</button>
                  <span className="qty-value">{item.quantity}</span>
                  <button className="qty-btn" onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selected_variant?.id)}>+</button>
                </div>
                <span className="cart-item-price">€{(price * item.quantity).toFixed(2)}</span>
                <button
                  className="cart-remove"
                  onClick={() => removeItem(item.product.id, item.selected_variant?.id)}
                  title="Supprimer"
                >×</button>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div className="cart-summary">
          <h2 className="summary-title">Récapitulatif</h2>
          <div className="summary-row"><span>Sous-total</span><span>€{total.toFixed(2)}</span></div>
          <div className="summary-row">
            <span>Livraison</span>
            <span style={{ color: shipping === 0 ? 'var(--gold)' : 'inherit' }}>
              {shipping === 0 ? 'Gratuite' : `€${shipping.toFixed(2)}`}
            </span>
          </div>
          {shipping > 0 && (
            <p style={{ fontSize: '0.7rem', color: 'var(--grey)', letterSpacing: '0.05em', marginBottom: '16px' }}>
              Plus que €{(60 - total).toFixed(2)} pour la livraison offerte
            </p>
          )}
          <div className="summary-total">
            <span className="summary-total-label">Total</span>
            <span className="summary-total-price">€{(total + shipping).toFixed(2)}</span>
          </div>
          <Link
            href="/checkout"
            className="btn-gold"
            style={{ width: '100%', marginTop: '28px', justifyContent: 'center' }}
          >
            <span>Commander →</span>
          </Link>
          <Link
            href="/"
            className="btn-ghost"
            style={{ marginTop: '16px', justifyContent: 'center', width: '100%' }}
          >
            Continuer mes achats
          </Link>
        </div>
      </div>
    </div>
  )
}
