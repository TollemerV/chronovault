'use client'

import { useState, useEffect, useRef } from 'react'
import type { Product, Order } from '@/lib/types'

/* ─── Types AliExpress search result ─── */
interface AEProduct {
  product_id: string
  subject: string
  product_main_image_url: string
  sale_price: string
  original_price: string
  evaluate_rate: string
  lastest_volume: number
}

type Tab = 'search' | 'products' | 'orders'

const MARGIN = 2.5 // ×2.5 par défaut

function calcPrice(cost: number) {
  return Math.ceil((cost * MARGIN) / 5) * 5 - 0.01
}

/* ────────────────────────────────── */
export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [tab, setTab] = useState<Tab>('search')

  /* Search */
  const [query, setQuery] = useState('luxury watch men')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<AEProduct[]>([])
  const [searchError, setSearchError] = useState('')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)

  /* Import */
  const [importing, setImporting] = useState<string | null>(null)
  const [imported, setImported] = useState<Set<string>>(new Set())
  const [importMsg, setImportMsg] = useState<{ id: string; ok: boolean; msg: string } | null>(null)

  /* Products & Orders */
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])

  const searchRef = useRef<HTMLInputElement>(null)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === 'admin') {
      setAuthenticated(true)
    } else {
      alert('Mot de passe incorrect')
    }
  }

  const loadCatalog = async () => {
    const [pRes, oRes] = await Promise.all([
      fetch('/api/products'),
      fetch('/api/orders'),
    ])
    if (pRes.ok) {
      const data = await pRes.json()
      // /api/products renvoie maintenant les résultats AE en mode search
      // mais si on veut la liste Supabase on appelle /api/admin/products
      setProducts(Array.isArray(data) ? data : [])
    }
    if (oRes.ok) setOrders(await oRes.json())
  }

  const doSearch = async (p = 1) => {
    if (!query.trim()) return
    setSearching(true)
    setSearchError('')
    setResults([])
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&page=${p}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur API')
      setResults(data.products ?? [])
      setTotal(data.total ?? 0)
      setPage(p)
    } catch (err) {
      setSearchError(String(err))
    } finally {
      setSearching(false)
    }
  }

  const doImport = async (product: AEProduct, sellingPrice: number) => {
    setImporting(product.product_id)
    setImportMsg(null)
    try {
      const res = await fetch('/api/import-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aliexpress_id: product.product_id,
          title: product.product_title,
          images: [product.product_main_image_url],
          price: parseFloat(product.target_sale_price),
          selling_price: sellingPrice,
          rating: parseFloat(product.evaluate_rate) / 20, // 0-100 → 0-5
          review_count: product.lastest_volume,
          category: 'montres',
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setImported(prev => new Set([...prev, product.product_id]))
        setImportMsg({ id: product.product_id, ok: true, msg: '✓ Importé dans Supabase' })
      } else {
        setImportMsg({ id: product.product_id, ok: false, msg: data.error ?? 'Erreur' })
      }
    } catch {
      setImportMsg({ id: product.product_id, ok: false, msg: 'Erreur réseau' })
    } finally {
      setImporting(null)
    }
  }

  useEffect(() => {
    if (authenticated) {
      doSearch()
      loadCatalog()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated])

  /* ── Login ── */
  if (!authenticated) {
    return (
      <div className="admin-login">
        <div className="admin-login-card">
          <p className="admin-login-brand">ChronoVault</p>
          <h1 className="admin-login-title">Administration</h1>
          <form onSubmit={handleLogin} className="admin-login-form">
            <input
              type="password"
              className="admin-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mot de passe"
              autoFocus
            />
            <button type="submit" className="admin-btn-primary">
              Accéder →
            </button>
          </form>
        </div>
      </div>
    )
  }

  /* ── Dashboard ── */
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
            { id: 'search', icon: '🔍', label: 'Recherche AliExpress' },
            { id: 'products', icon: '⌚', label: 'Catalogue' },
            { id: 'orders', icon: '📦', label: 'Commandes' },
          ] as { id: Tab; icon: string; label: string }[]).map(item => (
            <button
              key={item.id}
              className={`admin-nav-item ${tab === item.id ? 'active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-stats">
          <div className="admin-stat">
            <span className="admin-stat-val">{products.length}</span>
            <span className="admin-stat-label">Produits</span>
          </div>
          <div className="admin-stat">
            <span className="admin-stat-val">{orders.length}</span>
            <span className="admin-stat-label">Commandes</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main">

        {/* ══ RECHERCHE ALIEXPRESS ══ */}
        {tab === 'search' && (
          <div className="admin-section">
            <div className="admin-section-header">
              <div>
                <h2 className="admin-section-title">Recherche AliExpress DS</h2>
                <p className="admin-section-sub">Trouvez des produits et importez-les en un clic dans votre catalogue Supabase</p>
              </div>
            </div>

            {/* Barre de recherche */}
            <div className="admin-search-bar">
              <input
                ref={searchRef}
                className="admin-input admin-search-input"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch(1)}
                placeholder="ex: luxury automatic watch men gold"
              />
              <button
                className="admin-btn-primary"
                onClick={() => doSearch(1)}
                disabled={searching}
              >
                {searching ? 'Recherche…' : 'Rechercher'}
              </button>
            </div>

            {/* Suggestions rapides */}
            <div className="admin-tags">
              {['luxury watch men', 'automatic watch rose gold', 'chronograph sport', 'minimalist watch women', 'vintage dress watch'].map(s => (
                <button key={s} className="admin-tag" onClick={() => { setQuery(s); doSearch(1) }}>
                  {s}
                </button>
              ))}
            </div>

            {/* Erreur */}
            {searchError && (
              <div className="admin-alert error">{searchError}</div>
            )}

            {/* Résultats */}
            {results.length > 0 && (
              <>
                <p className="admin-results-count">{total.toLocaleString()} résultats — page {page}</p>
                <div className="admin-product-grid">
                  {results.map(p => {
                    const cost = parseFloat(p.target_sale_price)
                    const sell = calcPrice(cost)
                    const margin = Math.round(((sell - cost) / sell) * 100)
                    const isImported = imported.has(p.product_id)
                    const isImporting = importing === p.product_id

                    return (
                      <div key={p.product_id} className={`admin-product-card ${isImported ? 'imported' : ''}`}>
                        {isImported && <div className="admin-product-imported-badge">✓ Importé</div>}

                        <div className="admin-product-img">
                          <img src={p.product_main_image_url} alt={p.product_title} loading="lazy" />
                        </div>

                        <div className="admin-product-body">
                          <p className="admin-product-title">{p.product_title}</p>

                          <div className="admin-product-prices">
                            <span className="admin-product-cost">Coût : {p.target_sale_price}€</span>
                            <span className="admin-product-sell">Vente : {sell.toFixed(2)}€</span>
                            <span className="admin-product-margin">+{margin}% marge</span>
                          </div>

                          <div className="admin-product-meta">
                            <span>⭐ {(parseFloat(p.evaluate_rate ?? '0') / 20).toFixed(1)}/5</span>
                            <span>{p.lastest_volume} vendus</span>
                          </div>

                          {importMsg?.id === p.product_id && (
                            <p className={`admin-import-msg ${importMsg.ok ? 'ok' : 'err'}`}>
                              {importMsg.msg}
                            </p>
                          )}

                          <button
                            className="admin-btn-import"
                            onClick={() => doImport(p, sell)}
                            disabled={isImporting || isImported}
                          >
                            {isImporting ? 'Import…' : isImported ? '✓ Déjà importé' : `Importer — ${sell.toFixed(2)}€`}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Pagination */}
                <div className="admin-pagination">
                  <button className="admin-btn-secondary" onClick={() => doSearch(page - 1)} disabled={page <= 1}>← Précédent</button>
                  <span>Page {page}</span>
                  <button className="admin-btn-secondary" onClick={() => doSearch(page + 1)}>Suivant →</button>
                </div>
              </>
            )}

            {!searching && results.length === 0 && !searchError && (
              <div className="admin-empty">
                <span>🔍</span>
                <p>Lance une recherche pour voir les produits AliExpress</p>
              </div>
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
                <p>Aucun produit importé. Utilisez la recherche AliExpress.</p>
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Image</th><th>Titre</th><th>Coût</th><th>Prix vente</th><th>Marge</th><th>Stock</th><th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => {
                      const margin = ((p.selling_price - p.price) / p.selling_price * 100).toFixed(0)
                      return (
                        <tr key={p.id}>
                          <td><img src={p.images[0]} alt={p.title} className="admin-table-thumb" /></td>
                          <td className="admin-table-title">{p.title}</td>
                          <td>{p.price.toFixed(2)}€</td>
                          <td className="admin-table-price">{p.selling_price.toFixed(2)}€</td>
                          <td><span className="admin-table-margin">+{margin}%</span></td>
                          <td>{p.stock}</td>
                          <td>⭐ {p.rating}</td>
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
              <div className="admin-empty">
                <span>📦</span>
                <p>Aucune commande pour l&apos;instant.</p>
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr><th>Date</th><th>Client</th><th>Email</th><th>Total</th><th>Statut</th></tr>
                  </thead>
                  <tbody>
                    {orders.map((o: Order) => (
                      <tr key={o.id}>
                        <td>{new Date(o.created_at).toLocaleDateString('fr-FR')}</td>
                        <td className="admin-table-title">{o.customer_name}</td>
                        <td>{o.customer_email}</td>
                        <td className="admin-table-price">{o.total.toFixed(2)}€</td>
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
