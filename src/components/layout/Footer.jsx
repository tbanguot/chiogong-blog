import { Link } from 'react-router-dom'
import { NAV_LINKS, SITE } from '../../utils/constants'

export default function Footer() {
  return (
    <footer className="footer dark">
      <div className="container footer__inner">
        <div className="stack">
          <p className="footer__brand">
            Nyanchiew <em>Malual</em>
          </p>
          <p className="muted">Journalist · Storyteller · Podcast Host</p>
        </div>

        <nav className="footer__links" aria-label="Footer">
          {NAV_LINKS.map(({ to, label }) => (
            <Link key={to} to={to}>
              {label}
            </Link>
          ))}
          <a href={SITE.facebookUrl} target="_blank" rel="noopener noreferrer">
            Facebook<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </nav>
      </div>
      <p className="container footer__legal muted">© {new Date().getFullYear()} {SITE.name}</p>
    </footer>
  )
}
