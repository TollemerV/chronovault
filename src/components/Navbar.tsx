'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'

const NAV_LINKS = [
  { label: 'Collection', href: '/#collection' },
  { label: 'Boutique', href: '/boutique' },
  { label: 'Automatique', href: '/categorie/automatique' },
  { label: 'Chronographe', href: '/categorie/chronographe' },
  { label: 'Femme', href: '/categorie/femme' },
  { label: 'Héritage', href: '/categorie/heritage' },
  { label: 'Notre histoire', href: '/#savoir-faire' },
]

export default function Navbar() {
  const { itemCount } = useCart()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <>
      <header className={`navbar2 ${scrolled ? 'scrolled' : ''}`}>

        {/* Left — Hamburger */}
        <button
          className="nb2-hamburger"
          onClick={() => setMenuOpen(true)}
          aria-label="Menu"
        >
          <span /><span /><span />
        </button>

        {/* Center — Logo */}
        <Link href="/" className="nb2-logo">
          <span className="nb2-logo-main">ChronoVault</span>
          <span className="nb2-logo-sub">EST. 2024</span>
        </Link>

        {/* Right — Icons */}
        <div className="nb2-icons">
          {/* Search */}
          <button className="nb2-icon-btn" aria-label="Recherche">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
          </button>

          {/* Account */}
          <Link href="/admin" className="nb2-icon-btn" aria-label="Compte">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </Link>

          {/* Cart */}
          <Link href="/cart" className="nb2-icon-btn nb2-cart" aria-label="Panier">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {itemCount > 0 && (
              <span className="nb2-cart-count">{itemCount}</span>
            )}
          </Link>
        </div>
      </header>

      {/* ─── Side Menu ─── */}
      <div className={`nb2-menu-backdrop ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)} />

      <nav className={`nb2-side-menu ${menuOpen ? 'open' : ''}`}>
        <div className="nb2-menu-header">
          <span className="nb2-menu-logo">ChronoVault</span>
          <button className="nb2-menu-close" onClick={() => setMenuOpen(false)} aria-label="Fermer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <ul className="nb2-menu-links">
          {NAV_LINKS.map((l, i) => (
            <li key={l.label} style={{ animationDelay: `${0.05 + i * 0.04}s` }}>
              <Link
                href={l.href}
                className="nb2-menu-link"
                onClick={() => setMenuOpen(false)}
              >
                <span>{l.label}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            </li>
          ))}
        </ul>

        <div className="nb2-menu-footer">
          <p className="nb2-menu-tagline">L'excellence horlogère, accessible.</p>
          <div className="nb2-menu-socials">
            <a href="#" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
            <a href="#" aria-label="TikTok">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M9 12a4 4 0 104 4V4a5 5 0 005 5"/>
              </svg>
            </a>
          </div>
        </div>
      </nav>
    </>
  )
}
