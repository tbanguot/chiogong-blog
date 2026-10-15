import { Link } from 'react-router-dom'
import { ArrowUpRight, Clock, ExternalLink } from 'lucide-react'
import Meta from '../ui/Meta'
import { formatShortDate, hostname, isHttpsUrl } from '../../utils/format'

/** Cover image (or a plain tinted fallback). */
export function Cover({ article }) {
  return (
    <div className="card__media">
      {isHttpsUrl(article.cover_image_url) ? (
        <img src={article.cover_image_url} alt="" loading="lazy" decoding="async" />
      ) : (
        <div className="card__media-fallback">{article.category}</div>
      )}
    </div>
  )
}

/** Opens the original publication in a new tab when `external_url` is set; otherwise the article page. */
export default function StoryCard({ article }) {
  const external = isHttpsUrl(article.external_url)
  const Wrapper = external ? 'a' : Link
  const target = external
    ? { href: article.external_url, target: '_blank', rel: 'noopener noreferrer' }
    : { to: `/stories/${article.slug}` }

  return (
    <Wrapper className="card card--link" {...target}>
      <Cover article={article} />
      <div className="card__body">
        <div className="row">
          <span className="badge">{article.category}</span>
          {external && (
            <span className="badge badge--outline">
              <ExternalLink size={12} aria-hidden="true" /> {hostname(article.external_url)}
              <span className="sr-only"> (opens in a new tab)</span>
            </span>
          )}
        </div>
        <h3>{article.title}</h3>
        <p className="muted clamp">{article.excerpt}</p>
        <Meta
          items={[
            [null, formatShortDate(article.published_at)],
            article.read_time_minutes && [Clock, `${article.read_time_minutes} min read`],
          ]}
        />
        <span className="card__cta">
          {external ? 'Read on original site' : 'Read story'} <ArrowUpRight size={16} aria-hidden="true" />
        </span>
      </div>
    </Wrapper>
  )
}
