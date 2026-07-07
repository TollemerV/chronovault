'use client'

import { useState, useEffect } from 'react'
import type { Product, Order } from '@/lib/types'

type Tab = 'import' | 'products' | 'orders'

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [tab, setTab] = useState<Tab>('import')

  /* Import via URL */
  const [importUrl, setImportUrl] = useState('')
  const [importTitle, setImportTitle] = useState('')
  const [importPrice, setImportPrice] = useState('')
  const [importSell, setImportSell] = useState('')
  const [importImg, setImportImg] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ ok: boolean; msg: string } | null>(null)

  /* Catalog & Orders */
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === 'admin') {
      setAuthenticated(true)
    } else {
      alert('Mot de passe incorrect')
    }
  }

  const loadData = async () => {
    const oRes = await fetch('/api/orders')
    if (oRes.ok) setOrders(await oRes.json())
  }

  useEffect(() => {
    if (authenticated) loadData()
  }, [authenticated])

  /* Auto-calcul du prix de vente */
  useEffect(() => {
    if (importPrice) {
      const cost = parseFloat(importPrice)
      if (!isNaN(cost) && cost > 0) {
        setImportSell((Math.ceil((cost * 2.5) / 5) * 5 - 0.01).toFixed(2))
      }
    }
  }, [importPrice])

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importUrl && !importTitle) return
    setImporting(true)
    setImportResult(null)
    try {
      const res = await fetch('/api/import-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: importUrl || undefined,
          aliexpress_id: importUrl ? undefined : `manual-${Date.now()}`,
          title: importTitle || undefined,
          images: importImg ? [importImg] : [],
          price: parseFloat(importPrice) || 0,
          selling_price: parseFloat(importSell) || 0,
          category: 'montres',
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setImportResult({ ok: true, msg: `✓ "${data.product?.title ?? 'Produit'}" importé dans Supabase` })
        setImportUrl(''); setImportTitle(''); setImportPrice(''); setImportSell(''); setImportImg('')
        setProducts(prev => [data.product, ...prev.filter(p => p.id !== data.product?.id)])
      } else {
        setImportResult({ ok: false, msg: data.error ?? 'Erreur inconnue' })
      }
    } catch {
      setImportResult({ ok: false, msg: 'Erreur réseau' })
    } finally {
      setImporting(false)
    }
  }

  /* ── Login ── */
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

        {/* ══ IMPORT ══ */}
        {tab === 'import' && (
          <div className="admin-section">
            <div className="admin-section-header">
              <div>
                <h2 className="admin-section-title">Importer un produit</h2>
                <p className="admin-section-sub">Colle le lien AliExpress ou remplis manuellement</p>
              </div>
            </div>

            {/* Bannière statut API */}
            <div className="admin-api-status">
              <div className="admin-api-dot pending" />
              <div>
                <p className="admin-api-status-title">Permissions API en attente</p>
                <p className="admin-api-status-sub">
                  La recherche automatique sera active dès validation de ton accès DS sur AliExpress (1-3 jours).
                  En attendant, <strong>importe via URL</strong> ou <strong>manuellement</strong>.
                </p>
              </div>
              <a
                href="https://developers.aliexpress.com"
                target="_blank"
                rel="noreferrer"
                className="admin-btn-secondary"
                style={{ whiteSpace: 'nowrap', fontSize: '0.65rem' }}
              >
                Console AE →
              </a>
            </div>

            <form onSubmit={handleImport} className="admin-import-form">

              {/* URL AliExpress */}
              <div className="admin-field">
                <label className="admin-label">URL AliExpress</label>
                <input className="admin-input" type="url" value={importUrl}
                  onChange={e => setImportUrl(e.target.value)}
                  placeholder="https://www.aliexpress.com/item/1234567890.html" />
                <p className="admin-field-hint">L'ID produit sera extrait automatiquement</p>
              </div>

              <div className="admin-import-divider"><span>ou renseigner manuellement</span></div>

              {/* Titre */}
              <div className="admin-field">
                <label className="admin-label">Titre du produit</label>
                <input className="admin-input" type="text" value={importTitle}
                  onChange={e => setImportTitle(e.target.value)}
                  placeholder="Montre automatique or rose homme..." />
              </div>

              {/* Image */}
              <div className="admin-field">
                <label className="admin-label">URL image principale</label>
                <input className="admin-input" type="url" value={importImg}
                  onChange={e => setImportImg(e.target.value)}
                  placeholder="https://ae01.alicdn.com/kf/..." />
              </div>

              {/* Prix */}
              <div className="admin-field-row">
                <div className="admin-field">
                  <label className="admin-label">Coût AliExpress (€)</label>
                  <input className="admin-input" type="number" step="0.01" min="0"
                    value={importPrice} onChange={e => setImportPrice(e.target.value)}
                    placeholder="28.00" />
                </div>
                <div className="admin-field">
                  <label className="admin-label">Prix de vente (€) <span style={{color:'var(--gold)',fontSize:'0.6rem'}}>auto ×2.5</span></label>
                  <input className="admin-input" type="number" step="0.01" min="0"
                    value={importSell} onChange={e => setImportSell(e.target.value)}
                    placeholder="69.99" />
                </div>
              </div>

              {importResult && (
                <div className={`admin-alert ${importResult.ok ? 'success' : 'error'}`}>
                  {importResult.msg}
                </div>
              )}

              <button type="submit" className="admin-btn-primary" disabled={importing}
                style={{ width: '100%', justifyContent: 'center' }}>
                {importing ? 'Import en cours…' : '📥 Importer dans Supabase'}
              </button>
            </form>
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
                <p>Aucun produit importé. Utilisez l&apos;onglet import.</p>
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
