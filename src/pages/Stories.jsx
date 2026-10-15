import { useState } from 'react'
import PageHero from '../components/ui/PageHero'
import DataState from '../components/ui/DataState'
import Pills from '../components/ui/Pills'
import SearchInput from '../components/ui/SearchInput'
import StoryCard from '../components/media/StoryCard'
import { useAsync } from '../hooks/useAsync'
import { usePageMeta } from '../hooks/usePageMeta'
import { db } from '../lib/api'
import { supabase } from '../lib/supabase'
import { STORY_FILTERS } from '../utils/constants'

const COLUMNS = 'id, title, slug, category, excerpt, cover_image_url, external_url, read_time_minutes, published_at'

export default function Stories() {
  usePageMeta({
    title: 'Stories & Journalism',
    description: 'Investigative reporting, culture, personal essays and published work by Nyanchiew Malual.',
  })
  const [category, setCategory] = useState('')
  const [query, setQuery] = useState('')
  const { data = [], error, loading } = useAsync(
    () => db(supabase.from('articles').select(COLUMNS).order('published_at', { ascending: false })),
    [],
  )

  const term = query.trim().toLowerCase()
  const stories = data.filter(
    (story) =>
      (!category || story.category === category) &&
      (!term || `${story.title} ${story.excerpt} ${story.category}`.toLowerCase().includes(term)),
  )
  const filtered = Boolean(category || term)

  return (
    <>
      <PageHero eyebrow="Journalism & Essays" title="Stories & Journalism">
        Investigations, culture, and personal essays — reported with care.
      </PageHero>

      <section className="section section--flush" aria-label="Browse stories">
        <div className="container stack stack--lg">
          <div className="toolbar">
            <Pills options={STORY_FILTERS} value={category} onChange={setCategory} label="Filter by category" />
            <SearchInput id="story-search" label="Search stories" placeholder="Search stories…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>

          <DataState
            loading={loading}
            error={error}
            empty={
              stories.length === 0 && {
                title: filtered ? 'No stories found' : 'Stories are coming soon',
                text: filtered ? 'Try another word or category.' : 'Check back shortly.',
                action: filtered && (
                  <button type="button" className="btn btn--outline" onClick={() => (setCategory(''), setQuery(''))}>
                    Clear filters
                  </button>
                ),
              }
            }
          >
            <div className="cards">
              {stories.map((story) => (
                <StoryCard key={story.id} article={story} />
              ))}
            </div>
          </DataState>
        </div>
      </section>
    </>
  )
}
