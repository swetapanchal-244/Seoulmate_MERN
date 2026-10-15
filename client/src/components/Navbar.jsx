import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'

const LINKS = [
  { href: '#about', label: 'About' },
  { href: '#menu', label: 'Menu' },
  { href: '#chefs', label: 'Chefs' },
  { href: '#gallery', label: 'Seoul Nights' },
  { href: '#culture', label: 'Culture' },
  { href: '#contact', label: 'Visit' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const { user, logout } = useAuth()
  const cart = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const accountRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onClickOutside = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const handleLogout = () => {
    setAccountOpen(false)
    logout()
    navigate('/')
  }

  const handleLogoClick = (e) => {
    if (location.pathname === '/') {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSectionClick = (hash) => (e) => {
    e.preventDefault()
    setOpen(false)
    const id = hash.replace('#', '')

    if (location.pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/', { state: { scrollTo: id } })
    }
  }

  return (
    <header
      className="nav"
      style={{ background: scrolled ? 'rgba(10,10,16,0.92)' : 'rgba(10,10,16,0.7)' }}
    >
      <div className="nav-inner">
        <Link to="/" className="brand" onClick={handleLogoClick}>
          <img src="/logo.jpg" alt="Seoulmate logo" className="brand-logo" />
          <span>Seoulmate</span>
        </Link>

        <nav className={`nav-links ${open ? 'open' : ''}`}>
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={handleSectionClick(link.href)}>
              {link.label}
            </a>
          ))}
        </nav>

        {user ? (
          <div className="nav-account" ref={accountRef}>
            <button className="nav-user-trigger" onClick={() => setAccountOpen((v) => !v)}>
              Hi, {user.firstName}
              {user.role === 'user' && cart && cart.totalItems > 0 && (
                <span className="nav-orders-badge">{cart.totalItems}</span>
              )}
              <span className="nav-user-caret">▾</span>
            </button>

            {accountOpen && (
              <div className="nav-account-dropdown">
                {user.role === 'user' && (
                  <>
                    <Link to="/my-bookings" onClick={() => setAccountOpen(false)}>
                      My Bookings
                    </Link>
                    <Link to="/orders" onClick={() => setAccountOpen(false)}>
                      Orders
                      {cart && cart.totalItems > 0 && (
                        <span className="nav-orders-badge">{cart.totalItems}</span>
                      )}
                    </Link>
                  </>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin/dashboard" onClick={() => setAccountOpen(false)}>
                    Admin Dashboard
                  </Link>
                )}
                {user.role === 'owner' && (
                  <Link to="/owner/dashboard" onClick={() => setAccountOpen(false)}>
                    Owner Dashboard
                  </Link>
                )}
                <button className="nav-account-logout" onClick={handleLogout}>
                  Log out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="nav-cta">Log in</Link>
        )}

        <button className="burger" aria-label="Toggle menu" onClick={() => setOpen(!open)}>
          <span></span><span></span><span></span>
        </button>
      </div>
    </header>
  )
}