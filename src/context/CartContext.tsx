'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { CartItem, Product, Variant } from '@/lib/types'

type CartContextType = {
  items: CartItem[]
  addItem: (product: Product, variant?: Variant) => void
  removeItem: (productId: string, variantId?: string) => void
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void
  clearCart: () => void
  total: number
  itemCount: number
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('chronovault-cart')
    if (saved) setItems(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem('chronovault-cart', JSON.stringify(items))
  }, [items])

  const addItem = useCallback((product: Product, variant?: Variant) => {
    setItems(prev => {
      const exists = prev.find(
        i => i.product.id === product.id && i.selected_variant?.id === variant?.id
      )
      if (exists) {
        return prev.map(i =>
          i.product.id === product.id && i.selected_variant?.id === variant?.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, { product, quantity: 1, selected_variant: variant }]
    })
  }, [])

  const removeItem = useCallback((productId: string, variantId?: string) => {
    setItems(prev =>
      prev.filter(i => !(i.product.id === productId && i.selected_variant?.id === variantId))
    )
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      removeItem(productId, variantId)
      return
    }
    setItems(prev =>
      prev.map(i =>
        i.product.id === productId && i.selected_variant?.id === variantId
          ? { ...i, quantity }
          : i
      )
    )
  }, [removeItem])

  const clearCart = useCallback(() => setItems([]), [])

  const total = items.reduce((sum, i) => {
    const price = i.product.selling_price + (i.selected_variant?.price_modifier ?? 0)
    return sum + price * i.quantity
  }, 0)

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
