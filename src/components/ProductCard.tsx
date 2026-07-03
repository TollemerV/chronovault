'use client'

import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import type { Product, Variant } from '@/lib/types'

type Props = { product: Product }

function getStars(rating: number) {
  return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating))
}

function getDiscount(selling: number, cost: number) {
  return Math.round(((selling - cost) / selling) * 100)
}

export default function ProductCard({ product }: Props) {
  const { addItem } = useCart()
  const firstVariant: Variant | undefined = product.variants?.[0]

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product, firstVariant)
  }

  return (
    <Link href={`/product/${product.id}`} className="product-card">
      <div className="product-card-image">
        <img
          src={product.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'}
          alt={product.title}
          loading="lazy"
        />
        <span className="product-card-badge">
          -{getDiscount(product.selling_price, product.price)}%
        </span>
      </div>
      <div className="product-card-body">
        <h3 className="product-card-title">{product.title}</h3>
        <div className="product-card-rating">
          <span className="stars">{getStars(product.rating)}</span>
          <span className="rating-text">{product.rating} ({product.review_count})</span>
        </div>
        <div className="product-card-footer">
          <div>
            <span className="product-price">€{product.selling_price.toFixed(2)}</span>
          </div>
          <button className="add-to-cart-btn" onClick={handleAdd} title="Ajouter au panier">
            +
          </button>
        </div>
      </div>
    </Link>
  )
}
