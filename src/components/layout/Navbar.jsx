import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { NAV_LINKS } from '../../utils/constants'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="navbar__brand" onClick={() => setOpen(false)}>
          Nyanchiew <em style={{color: 'purple'}}>Malual</em>
        </Link>

        <button
          type="button"
          className="navbar__toggle"
          aria-expanded={open}
          aria-controls="main-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>

        <nav id="main-nav" className="navbar__links" data-open={open} aria-label="Main">
          {NAV_LINKS.map(({ to, label, end, cta }) => (
            <NavLink key={to} to={to} end={end} className={cta ? 'btn btn--primary' : 'navbar__link'} onClick={() => setOpen(false)}>
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
