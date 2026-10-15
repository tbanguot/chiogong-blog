import { useRef, useState } from 'react'
import { CalendarDays, Eye, User } from 'lucide-react'
import EpisodeCard from '../components/media/EpisodeCard'
import VideoPlayer from '../components/media/VideoPlayer'
import DataState from '../components/ui/DataState'
import Field from '../components/ui/Field'
import Meta from '../components/ui/Meta'
import RichText from '../components/ui/RichText'
import SearchInput from '../components/ui/SearchInput'
import { useAsync } from '../hooks/useAsync'
import { useDebounce } from '../hooks/useDebounce'
import { usePageMeta } from '../hooks/usePageMeta'
import { getJSON, postJSON } from '../lib/api'
import { formatDate, formatViews } from '../utils/format'

const SORTS = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'popular', label: 'Most Popular' },
]
const MONTH_RE = /^\d{4}-\d{2}$/
const counted = new Set() // one view per episode per page load

export default function Podcast() {
  usePageMeta({
    title: 'The Video Podcast',
    description: 'Watch honest, in-depth video conversations hosted by Nyanchiew Malual.',
  })
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('recent')
  const [month, setMonth] = useState('')
  const [selected, setSelected] = useState(null)
  const theater = useRef(null)

  const query = useDebounce(search.trim())
  const monthParam = MONTH_RE.test(month) ? month : ''

  const newest = useAsync((signal) => getJSON('/api/episodes?limit=1', signal))
  const list = useAsync(
    (signal) => {
      const params = new URLSearchParams({ sort })
      if (query) params.set('search', query)
      if (monthParam) params.set('month', monthParam)
      return getJSON(`/api/episodes?${params}`, signal)
    },
    [query, sort, monthParam],
  )

  const newestEpisodes = Array.isArray(newest.data?.episodes) ? newest.data.episodes : []
  const active = selected ?? newestEpisodes[0]
  const episodes = Array.isArray(list.data?.episodes) ? list.data.episodes : []
  const filtered = Boolean(query || monthParam || sort !== 'recent')

  function select(episode) {
    setSelected(episode)
    theater.current?.scrollIntoView({ behavior: 'smooth' })
    if (counted.has(episode.id)) return
    counted.add(episode.id)
    postJSON(`/api/episodes/${episode.id}/view`)
      .then(({ views_count: views }) => setSelected((current) => (current?.id === episode.id ? { ...current, views_count: views } : current)))
      .catch(() => counted.delete(episode.id))
  }

  function reset() {
    setSearch('')
    setSort('recent')
    setMonth('')
  }

  return (
    <>
      <section ref={theater} className="theater dark" aria-label="Now playing">
        <div className="container split split--player">
          {active ? (
            <>
              <div className="stack">
                <VideoPlayer videoId={active.video_id} title={active.title} />
                <div className="row">
                  <span className="badge">Episode {active.episode_number}</span>
                  <Meta
                    items={[
                      [CalendarDays, formatDate(active.published_at)],
                      active.guest_name && [User, active.guest_name],
                      [Eye, formatViews(active.views_count)],
                    ]}
                  />
                </div>
                <h1>{active.title}</h1>
              </div>
              <details key={active.id} className="notes" open>
                <summary>Show notes</summary>
                <RichText text={active.description || 'No show notes for this episode yet.'} />
              </details>
            </>
          ) : (
            <div className="stack">
              {newest.loading ? <div className="video skeleton" /> : <h1>The first episode is coming soon</h1>}
            </div>
          )}
        </div>
      </section>

      <section className="section" aria-labelledby="episodes-title">
        <div className="container stack stack--lg">
          <h2 id="episodes-title">All Episodes</h2>

          <div className="controls">
            <SearchInput id="episode-search" label="Search episodes" placeholder="Search by title, guest, or topic..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <Field label="Sort by" name="sort" as="select" options={SORTS} value={sort} onChange={(e) => setSort(e.target.value)} />
            <Field label="Month" name="month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            <button type="button" className="btn btn--outline" onClick={() => setMonth('')} disabled={!month}>
              Clear Filter
            </button>
          </div>

          <DataState
            loading={list.loading}
            error={list.error}
            empty={
              episodes.length === 0 && {
                title: filtered ? 'No episodes found' : 'No episodes yet',
                text: filtered ? 'Try another word, or clear the filters.' : 'Check back soon.',
                action: filtered && (
                  <button type="button" className="btn btn--outline" onClick={reset}>
                    Reset filters
                  </button>
                ),
              }
            }
          >
            <div className="cards">
              {episodes.map((episode) => (
                <EpisodeCard key={episode.id} episode={episode} active={episode.id === active?.id} onSelect={select} />
              ))}
            </div>
          </DataState>
        </div>
      </section>
    </>
  )
}
