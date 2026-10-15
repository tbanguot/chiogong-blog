import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Clock } from 'lucide-react'
import DataState from '../components/ui/DataState'
import Meta from '../components/ui/Meta'
import RichText from '../components/ui/RichText'
import { useAsync } from '../hooks/useAsync'
import { usePageMeta } from '../hooks/usePageMeta'
import { db } from '../lib/api'
import { supabase } from '../lib/supabase'
import { formatDate, isHttpsUrl } from '../utils/format'

/** Native article reader: /stories/:slug */
export default function Article() {
  const { slug } = useParams()
  const { data: article, error, loading } = useAsync(
    () => db(supabase.from('articles').select('*').eq('slug', slug).maybeSingle()),
    [slug],
  )
  usePageMeta({ title: article?.title, description: article?.excerpt })

  return (
    <div className="container container--narrow section stack stack--lg">
      <Link to="/stories" className="text-link">
        <ArrowLeft size={16} aria-hidden="true" /> All stories
      </Link>

      <DataState
        loading={loading}
        error={error}
        skeletons={1}
        empty={!article && { title: 'Story not found', text: 'This story may have been moved or removed.' }}
      >
        <article className="stack stack--lg">
          <header className="stack">
            <span className="badge">{article?.category}</span>
            <h1>{article?.title}</h1>
            <p className="lede">{article?.excerpt}</p>
            <Meta items={[[null, formatDate(article?.published_at)], article?.read_time_minutes && [Clock, `${article.read_time_minutes} min read`]]} />
          </header>
          {isHttpsUrl(article?.cover_image_url) && <img className="article__cover" src={article.cover_image_url} alt="" />}
          <RichText text={article?.body ?? ''} />
        </article>
      </DataState>
    </div>
  )
}
