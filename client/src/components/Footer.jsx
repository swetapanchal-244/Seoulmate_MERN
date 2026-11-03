import { useNavigate, useLocation } from 'react-router-dom'

const LINKS = [
  { href: '#about', label: 'About' },
  { href: '#menu', label: 'Menu' },
  { href: '#chefs', label: 'Chefs' },
  { href: '#gallery', label: 'Gallery' },
  { href: '#contact', label: 'Visit' },
]

export default function Footer() {
  const navigate = useNavigate()
  const location = useLocation()

  const goTo = (hash) => (e) => {
    e.preventDefault()
    const id = hash.replace('#', '')

    if (location.pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/', { state: { scrollTo: id } })
    }
  }

  return (
    <footer className="footer">
      <div className="footer-inner">

        <div className="footer-grid">

          <div>
            <a href="#top" className="brand footer-brand" onClick={goTo('#top')}>
              <img src="/logo.jpg" alt="Seoulmate logo" className="brand-logo" />
              <span>Seoulmate</span>
            </a>
            <p className="footer-about">
              Modern Korean kitchen and bar — charcoal grills, hand-pulled
              noodles and a room that glows after dark.
            </p>
            <div className="footer-social">
              <a href="#" className="social-icon" aria-label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a href="#" className="social-icon" aria-label="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M14 9h3V5h-3c-2.2 0-4 1.8-4 4v2H7v4h3v6h4v-6h3l1-4h-4V9c0-.6.4-1 1-1z" />
                </svg>
              </a>
              <a href="#" className="social-icon" aria-label="WhatsApp">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M20 12a8 8 0 1 1-3.6-6.7" />
                  <path d="M20 12a8 8 0 0 0-8-8" />
                  <path d="M8.5 9.5c.3 2.5 2.5 4.7 5 5l1-1.5-2-1-1 .8a4 4 0 0 1-2.3-2.3l.8-1-1-2-1.5 1z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="footer-col">
            <h4>Quick links</h4>
            {LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={goTo(link.href)}>{link.label}</a>
            ))}
          </div>

          <div className="footer-col">
            <h4>Contact</h4>
            <p>14 Lantern Street, Ring Road</p>
            <p>Surat, Gujarat 395007</p>
            <a href="tel:+919876543210">+91 98765 43210</a>
            <a href="mailto:hello@seoulmate.rest">hello@seoulmate.rest</a>
          </div>

        </div>

        <p className="footer-copy">© 2026 Seoulmate. All rights reserved.</p>

      </div>
    </footer>
  )
}