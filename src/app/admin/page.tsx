'use client'

import { useState, useEffect } from 'react'
import type { Product, Order } from '@/lib/types'

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [url, setUrl] = useState('')
  const [sellingPrice, setSellingPrice] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success?: boolean; message?: string } | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [tab, setTab] = useState<'import' | 'products' | 'orders'>('import')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD || password === 'admin') {
      setAuthenticated(true)
      loadData()
    } else {
      alert('Mot de passe incorrect')
    }
  }

  const loadData = async () => {
    const [pRes, oRes] = await Promise.all([
      fetch('/api/products'),
      fetch('/api/orders'),
    ])
    if (pRes.ok) setProducts(await pRes.json())
    if (oRes.ok) setOrders(await oRes.json())
  }

  useEffect(() => {
    if (authenticated) loadData()
  }, [authenticated])

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) return

    setImporting(true)
    setImportResult(null)

    try {
      const res = await fetch('/api/import-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, selling_price: parseFloat(sellingPrice) || 89 }),
      })
      const data = await res.json()
      if (res.ok) {
        setImportResult({ success: true, message: `✅ Produit "${data.product.title}" importé avec succès !` })
        setUrl('')
        setSellingPrice('')
        loadData()
      } else {
        setImportResult({ success: false, message: `❌ Erreur : ${data.error}` })
      }
    } catch {
      setImportResult({ success: false, message: '❌ Erreur réseau' })
    } finally {
      setImporting(false)
    }
  }

  if (!authenticated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px' }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', marginBottom: '8px', textAlign: 'center' }}>
            Admin ChronoVault
          </h1>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '32px', fontSize: '0.9rem' }}>
            Panneau de gestion réservé
          </p>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoFocus
              />
            </div>
            <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }}>
              Accéder au panneau →
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', marginBottom: '8px' }}>
          Panneau Admin
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {products.length} produits · {orders.length} commandes
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {(['import', 'products', 'orders'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '10px 20px',
              background: 'none',
              border: 'none',
              borderBottom: tab === t ? '2px solid var(--gold)' : '2px solid transparent',
              color: tab === t ? 'var(--gold-light)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
              marginBottom: '-1px',
              transition: 'var(--transition)',
              textTransform: 'capitalize',
            }}
          >
            {t === 'import' ? '📥 Importer' : t === 'products' ? '⌚ Produits' : '📦 Commandes'}
          </button>
        ))}
      </div>

      {/* ─── Tab Import ─── */}
      {tab === 'import' && (
        <div style={{ maxWidth: '600px' }}>
          <div className="admin-card">
            <h2 className="admin-card-title">📥 Importer un produit AliExpress</h2>
            <form className="import-form" onSubmit={handleImport}>
              <div className="form-group">
                <label className="form-label">Lien AliExpress</label>
                <input
                  type="url"
                  className="form-input"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://www.aliexpress.com/item/123456789.html"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Prix de vente (€)</label>
                <input
                  type="number"
                  className="form-input"
                  value={sellingPrice}
                  onChange={e => setSellingPrice(e.target.value)}
                  placeholder="89.00"
                  step="0.01"
                  min="0"
                />
              </div>
              <button type="submit" className="btn-primary" disabled={importing} style={{ justifyContent: 'center' }}>
                {importing ? '⏳ Import en cours...' : '📥 Importer le produit'}
              </button>
            </form>

            {importResult && (
              <div style={{
                marginTop: '16px',
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
                background: importResult.success ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${importResult.success ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                fontSize: '0.9rem',
                color: importResult.success ? '#22c55e' : '#ef4444',
              }}>
                {importResult.message}
              </div>
            )}

            <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(201,168,76,0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--gold)' }}>ℹ️ Mode actuel : Mock</strong><br />
              L'import réel sera activé dès réception de tes clés API AliExpress.
              Pour l'instant, un produit de démonstration est créé.
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab Products ─── */}
      {tab === 'products' && (
        <div>
          {products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">⌚</div>
              <p>Aucun produit encore. Importe ton premier produit !</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Titre</th>
                    <th>Coût</th>
                    <th>Prix vente</th>
                    <th>Marge</th>
                    <th>Stock</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => {
                    const margin = ((p.selling_price - p.price) / p.selling_price * 100).toFixed(0)
                    return (
                      <tr key={p.id}>
                        <td>
                          <img src={p.images[0]} alt={p.title} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} />
                        </td>
                        <td style={{ color: 'var(--text-primary)', maxWidth: 200 }}>{p.title}</td>
                        <td>€{p.price.toFixed(2)}</td>
                        <td style={{ color: 'var(--gold-light)', fontWeight: 600 }}>€{p.selling_price.toFixed(2)}</td>
                        <td><span style={{ color: '#22c55e', fontWeight: 600 }}>{margin}%</span></td>
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

      {/* ─── Tab Orders ─── */}
      {tab === 'orders' && (
        <div>
          {orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <p>Aucune commande pour l&apos;instant.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Client</th>
                    <th>Email</th>
                    <th>Total</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o: Order) => (
                    <tr key={o.id}>
                      <td>{new Date(o.created_at).toLocaleDateString('fr-FR')}</td>
                      <td style={{ color: 'var(--text-primary)' }}>{o.customer_name}</td>
                      <td>{o.customer_email}</td>
                      <td style={{ color: 'var(--gold-light)', fontWeight: 600 }}>€{o.total.toFixed(2)}</td>
                      <td>
                        <span className={`status-tag status-${o.status}`}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
