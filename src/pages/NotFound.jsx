import { Link } from 'react-router-dom'
import PageHero from '../components/ui/PageHero'
import { usePageMeta } from '../hooks/usePageMeta'

export default function NotFound() {
  usePageMeta({ title: 'Page not found', robots: 'noindex' })
  return (
    <>
      <PageHero eyebrow="Error 404" title="Page not found">
        The page you’re looking for isn’t here.
      </PageHero>
      <div className="container section--flush section">
        <Link to="/" className="btn btn--primary">
          Back to home
        </Link>
      </div>
    </>
  )
}
