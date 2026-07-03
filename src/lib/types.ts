export type Product = {
  id: string
  aliexpress_id: string
  title: string
  description: string
  price: number
  selling_price: number
  images: string[]
  variants: Variant[]
  stock: number
  category: string
  rating: number
  review_count: number
  created_at: string
}

export type Variant = {
  id: string
  name: string
  value: string
  price_modifier: number
  stock: number
}

export type CartItem = {
  product: Product
  quantity: number
  selected_variant?: Variant
}

export type Order = {
  id: string
  customer_email: string
  customer_name: string
  shipping_address: ShippingAddress
  total: number
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  aliexpress_order_id?: string
  items: OrderItem[]
  created_at: string
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string
  product_title: string
  quantity: number
  unit_price: number
  variant?: Variant
}

export type ShippingAddress = {
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string
  city: string
  postal_code: string
  country: string
}
