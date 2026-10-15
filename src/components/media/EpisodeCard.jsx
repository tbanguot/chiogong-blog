import { Eye } from 'lucide-react'
import Meta from '../ui/Meta'
import EpisodeThumb from './EpisodeThumb'
import { formatDuration, formatShortDate, formatViews } from '../../utils/format'

export default function EpisodeCard({ episode, active, onSelect }) {
  return (
    <button
      type="button"
      className="card card--link"
      aria-current={active || undefined}
      aria-label={`Play episode ${episode.episode_number}: ${episode.title}`}
      onClick={() => onSelect(episode)}
    >
      <div className="card__media">
        <EpisodeThumb episode={episode} />
        <span className="badge badge--top-left">EP {episode.episode_number}</span>
        {episode.duration_minutes > 0 && (
          <span className="badge badge--dark badge--bottom-right">{formatDuration(episode.duration_minutes)}</span>
        )}
      </div>
      <div className="card__body">
        <h3>{episode.title}</h3>
        {episode.guest_name && <p className="muted">with {episode.guest_name}</p>}
        <Meta items={[[null, formatShortDate(episode.published_at)], [Eye, formatViews(episode.views_count)]]} />
      </div>
    </button>
  )
}
