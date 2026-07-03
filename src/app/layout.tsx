import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import UrgencyBanner from '@/components/UrgencyBanner'
import { CartProvider } from '@/context/CartContext'

export const metadata: Metadata = {
  title: 'ChronoVault — Horlogerie de Prestige',
  description: 'Découvrez notre collection exclusive de montres de prestige. Chaque pièce, une œuvre du temps.',
  keywords: 'montre luxe, chronographe, automatique, horlogerie, prestige',
  openGraph: {
    title: 'ChronoVault — Horlogerie de Prestige',
    description: 'Découvrez notre collection exclusive de montres de prestige.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <CartProvider>
          <UrgencyBanner />
          <Navbar />
          <main>{children}</main>
          <footer className="footer">
            <div>
              <div className="footer-brand-name">ChronoVault</div>
              <div className="footer-tagline">Horlogerie de Prestige</div>
            </div>
            <div className="footer-links">
              <a href="/" className="footer-link">Collection</a>
              <a href="/cart" className="footer-link">Mon panier</a>
              <a href="/admin" className="footer-link">Administration</a>
            </div>
            <div className="footer-copy">
              © 2024 ChronoVault<br />
              Tous droits réservés
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  )
}
