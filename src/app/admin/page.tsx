'use client'

import { useState, useEffect } from 'react'
import type { Product, Order } from '@/lib/types'

type Tab = 'import' | 'products' | 'orders'

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [tab, setTab] = useState<Tab>('import')

  /* ── Import ── */
  const [importUrl, setImportUrl] = useState('')
  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState('')

  /* Champs produit (pré-remplis par le scraper) */
  const [title, setTitle] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [price, setPrice] = useState('')
  const [sellPrice, setSellPrice] = useState('')
  const [productId, setProductId] = useState('')
  const [rating, setRating] = useState('4.5')
  const [reviewCount, setReviewCount] = useState('0')
  const [productFetched, setProductFetched] = useState(false)

  /* Import final */
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ ok: boolean; msg: string } | null>(null)

  /* Catalogue & Commandes */
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === 'admin') setAuthenticated(true)
    else alert('Mot de passe incorrect')
  }

  const loadOrders = async () => {
    const res = await fetch('/api/orders')
    if (res.ok) setOrders(await res.json())
  }

  useEffect(() => { if (authenticated) loadOrders() }, [authenticated])

  /* Auto-calcul prix de vente ×2.5 */
  useEffect(() => {
    if (price) {
      const cost = parseFloat(price)
      if (!isNaN(cost) && cost > 0)
        setSellPrice((Math.ceil((cost * 2.5) / 5) * 5 - 0.01).toFixed(2))
    }
  }, [price])

  /* ── Scrape AliExpress ── */
  const handleFetch = async () => {
    if (!importUrl.trim()) return
    setFetching(true)
    setFetchError('')
    setProductFetched(false)

    try {
      const res = await fetch(`/api/scrape-product?url=${encodeURIComponent(importUrl)}`)
      const data = await res.json()

      if (!res.ok || !data.ok) {
        setFetchError(data.error ?? 'Impossible de récupérer ce produit')
        return
      }

      setTitle(data.title ?? '')
      setImages(data.images ?? [])
      setPrice(String(data.price ?? ''))
      setRating(String(data.rating ?? 4.5))
      setReviewCount(String(data.reviewCount ?? 0))
      setProductId(data.productId ?? '')
      setProductFetched(true)
    } catch {
      setFetchError('Erreur réseau — vérifie ta connexion')
    } finally {
      setFetching(false)
    }
  }

  /* ── Import vers Supabase ── */
  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title) return
    setImporting(true)
    setImportResult(null)

    try {
      const res = await fetch('/api/import-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aliexpress_id: productId || `manual-${Date.now()}`,
          title,
          images,
          price: parseFloat(price) || 0,
          selling_price: parseFloat(sellPrice) || 0,
          rating: parseFloat(rating) || 4.5,
          review_count: parseInt(reviewCount) || 0,
          category: 'montres',
          description: title,
        }),
      })
      const data = await res.json()

      if (res.ok) {
        setImportResult({ ok: true, msg: `✓ "${data.product?.title}" importé dans Supabase` })
        setProducts(prev => [data.product, ...prev.filter(p => p.id !== data.product?.id)])
        // Reset
        setImportUrl(''); setTitle(''); setImages([]); setPrice(''); setSellPrice('')
        setProductId(''); setRating('4.5'); setReviewCount('0'); setProductFetched(false)
      } else {
        setImportResult({ ok: false, msg: data.error ?? 'Erreur' })
      }
    } catch {
      setImportResult({ ok: false, msg: 'Erreur réseau' })
    } finally {
      setImporting(false)
    }
  }

  const resetForm = () => {
    setImportUrl(''); setTitle(''); setImages([]); setPrice(''); setSellPrice('')
    setProductId(''); setRating('4.5'); setReviewCount('0'); setProductFetched(false)
    setFetchError(''); setImportResult(null)
  }

  /* ────── Login ────── */
  if (!authenticated) {
    return (
      <div className="admin-login">
        <div className="admin-login-card">
          <p className="admin-login-brand">ChronoVault</p>
          <h1 className="admin-login-title">Administration</h1>
          <form onSubmit={handleLogin} className="admin-login-form">
            <input type="password" className="admin-input" value={password}
              onChange={e => setPassword(e.target.value)} placeholder="Mot de passe" autoFocus />
            <button type="submit" className="admin-btn-primary">Accéder →</button>
          </form>
        </div>
      </div>
    )
  }

  /* ────── Dashboard ────── */
  return (
    <div className="admin-wrap">

      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <span>ChronoVault</span>
          <span className="admin-sidebar-sub">Admin</span>
        </div>
        <nav className="admin-nav">
          {([
            { id: 'import', icon: '📥', label: 'Importer un produit' },
            { id: 'products', icon: '⌚', label: 'Catalogue' },
            { id: 'orders', icon: '📦', label: 'Commandes' },
          ] as { id: Tab; icon: string; label: string }[]).map(item => (
            <button key={item.id}
              className={`admin-nav-item ${tab === item.id ? 'active' : ''}`}
              onClick={() => setTab(item.id)}>
              <span className="admin-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-stats">
          <div className="admin-stat">
            <span className="admin-stat-val">{products.length}</span>
            <span className="admin-stat-label">Importés</span>
          </div>
          <div className="admin-stat">
            <span className="admin-stat-val">{orders.length}</span>
            <span className="admin-stat-label">Commandes</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main">

        {/* ══ IMPORT ══ */}
        {tab === 'import' && (
          <div className="admin-section">
            <div className="admin-section-header">
              <div>
                <h2 className="admin-section-title">Importer un produit</h2>
                <p className="admin-section-sub">Colle une URL AliExpress — les données sont récupérées automatiquement</p>
              </div>
              {productFetched && (
                <button className="admin-btn-secondary" onClick={resetForm}>← Nouveau produit</button>
              )}
            </div>

            {/* ── Étape 1 : URL ── */}
            {!productFetched && (
              <div className="admin-url-step">
                <div className="admin-step-number">1</div>
                <div style={{ flex: 1 }}>
                  <label className="admin-label" style={{ marginBottom: '10px', display: 'block' }}>
                    URL du produit AliExpress
                  </label>
                  <div className="admin-search-bar">
                    <input
                      className="admin-input admin-search-input"
                      type="url"
                      value={importUrl}
                      onChange={e => setImportUrl(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleFetch()}
                      placeholder="https://fr.aliexpress.com/item/1234567890.html"
                    />
                    <button
                      className="admin-btn-primary"
                      onClick={handleFetch}
                      disabled={fetching || !importUrl.trim()}
                    >
                      {fetching ? 'Récupération…' : 'Récupérer →'}
                    </button>
                  </div>

                  {fetchError && (
                    <div className="admin-alert error" style={{ marginTop: '12px' }}>
                      {fetchError}
                    </div>
                  )}

                  <p className="admin-field-hint" style={{ marginTop: '10px' }}>
                    💡 Trouve tes produits sur{' '}
                    <a href="https://fr.aliexpress.com" target="_blank" rel="noreferrer"
                      style={{ color: 'var(--gold)', textDecoration: 'none' }}>
                      fr.aliexpress.com
                    </a>{' '}
                    ou{' '}
                    <a href="https://dropshipping.aliexpress.com" target="_blank" rel="noreferrer"
      style={{ color: 'var(--gold)', textDecoration: 'none' }}>
                      DS Center
                    </a>
                    , puis colle l'URL ici.
                  </p>
                </div>
              </div>
            )}

            {/* ── Étape 2 : Preview & édition ── */}
            {productFetched && (
              <form onSubmit={handleImport} className="admin-product-preview">

                {/* Galerie images */}
                {images.length > 0 && (
                  <div>
                    <p className="admin-label" style={{ marginBottom: '10px' }}>
                      Images ({images.length})
                    </p>
                    <div className="admin-img-gallery">
                      {images.slice(0, 6).map((img, i) => (
                        <div key={i} className={`admin-img-thumb ${i === 0 ? 'main' : ''}`}>
                          <img src={img} alt={`Image ${i + 1}`} loading="lazy" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Champs */}
                <div className="admin-field">
                  <label className="admin-label">Titre</label>
                  <input className="admin-input" type="text" value={title}
                    onChange={e => setTitle(e.target.value)} required />
                </div>

                <div className="admin-field-row">
                  <div className="admin-field">
                    <label className="admin-label">Coût AliExpress (€)</label>
                    <input className="admin-input" type="number" step="0.01" min="0"
                      value={price} onChange={e => setPrice(e.target.value)} />
                  </div>
                  <div className="admin-field">
                    <label className="admin-label">
                      Prix de vente (€){' '}
                      <span style={{ color: 'var(--gold)', fontSize: '0.6rem' }}>auto ×2.5</span>
                    </label>
                    <input className="admin-input" type="number" step="0.01" min="0"
                      value={sellPrice} onChange={e => setSellPrice(e.target.value)} />
                  </div>
                </div>

                {/* Marge calculée */}
                {price && sellPrice && (
                  <div className="admin-margin-preview">
                    <span>Marge estimée :</span>
                    <strong style={{ color: '#22c55e' }}>
                      +{Math.round(((parseFloat(sellPrice) - parseFloat(price)) / parseFloat(sellPrice)) * 100)}%
                    </strong>
                    <span style={{ color: 'var(--grey)' }}>
                      · profit net ≈ {(parseFloat(sellPrice) - parseFloat(price)).toFixed(2)}€ / vente
                    </span>
                  </div>
                )}

                {importResult && (
                  <div className={`admin-alert ${importResult.ok ? 'success' : 'error'}`}>
                    {importResult.msg}
                  </div>
                )}

                <button type="submit" className="admin-btn-primary"
                  disabled={importing || !title}
                  style={{ alignSelf: 'flex-start', padding: '13px 32px' }}>
                  {importing ? 'Import…' : '📥 Importer dans Supabase'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ══ CATALOGUE ══ */}
        {tab === 'products' && (
          <div className="admin-section">
            <div className="admin-section-header">
              <h2 className="admin-section-title">Catalogue Supabase</h2>
            </div>
            {products.length === 0 ? (
              <div className="admin-empty">
                <span>⌚</span>
                <p>Aucun produit importé.</p>
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr><th>Image</th><th>Titre</th><th>Coût</th><th>Prix vente</th><th>Marge</th><th>Stock</th></tr>
                  </thead>
                  <tbody>
                    {products.map(p => {
                      const margin = ((p.selling_price - p.price) / p.selling_price * 100).toFixed(0)
                      return (
                        <tr key={p.id}>
                          <td>{p.images?.[0] && <img src={p.images[0]} alt={p.title} className="admin-table-thumb" />}</td>
                          <td className="admin-table-title">{p.title}</td>
                          <td>{p.price?.toFixed(2)}€</td>
                          <td className="admin-table-price">{p.selling_price?.toFixed(2)}€</td>
                          <td><span className="admin-table-margin">+{margin}%</span></td>
                          <td>{p.stock}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══ COMMANDES ══ */}
        {tab === 'orders' && (
          <div className="admin-section">
            <div className="admin-section-header">
              <h2 className="admin-section-title">Commandes</h2>
            </div>
            {orders.length === 0 ? (
              <div className="admin-empty"><span>📦</span><p>Aucune commande.</p></div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead><tr><th>Date</th><th>Client</th><th>Total</th><th>Statut</th></tr></thead>
                  <tbody>
                    {orders.map((o: Order) => (
                      <tr key={o.id}>
                        <td>{new Date(o.created_at).toLocaleDateString('fr-FR')}</td>
                        <td className="admin-table-title">{o.customer_name}</td>
                        <td className="admin-table-price">{o.total?.toFixed(2)}€</td>
                        <td><span className={`admin-status admin-status-${o.status}`}>{o.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
