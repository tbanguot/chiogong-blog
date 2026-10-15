import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Camera, Clock, ExternalLink, Eye, Mic2, PenLine, Play } from 'lucide-react'
import Newsletter from '../components/Newsletter'
import { Cover } from '../components/media/StoryCard'
import PortraitFrame from '../components/media/PortraitFrame'
import VideoPlayer from '../components/media/VideoPlayer'
import DataState from '../components/ui/DataState'
import Meta from '../components/ui/Meta'
import { useAsync } from '../hooks/useAsync'
import { usePageMeta } from '../hooks/usePageMeta'
import { db } from '../lib/api'
import { supabase } from '../lib/supabase'
import { SITE } from '../utils/constants'
import { formatShortDate, formatViews, isHttpsUrl } from '../utils/format'

const latest = (table) =>
  db(supabase.from(table).select('*').order('published_at', { ascending: false }).limit(1).maybeSingle())

const PILLARS = [
  { icon: PenLine, title: 'Journalism & Essays', text: 'Reported stories, culture, and personal essays.', cta: 'Read the stories', to: '/stories' },
  { icon: Mic2, title: 'The Video Podcast', text: 'Honest, in-depth conversations on camera.', cta: 'Watch the episodes', to: '/podcast' },
  { icon: Camera, title: 'Digital Content & Media', text: 'Everyday stories and behind-the-scenes moments.', cta: 'Follow on Facebook', href: SITE.facebookUrl },
]

function Feature({ dark, icon: Icon, label, media, badge, meta, title, text, action }) {
  return (
    <article className={`card feature ${dark ? 'dark' : ''}`}>
      <p className="eyebrow feature__label">
        <Icon size={16} aria-hidden="true" /> {label}
      </p>
      {media}
      <div className="card__body">
        <div className="row">
          <span className="badge">{badge}</span>
          <Meta items={meta} />
        </div>
        <h3>{title}</h3>
        {text && <p className="muted">{text}</p>}
        {action}
      </div>
    </article>
  )
}

function Placeholder({ text }) {
  return <p className="card empty">{text}</p>
}

export default function Home() {
  usePageMeta({
    description:
      'The digital home of Nyanchiew Malual — in-depth journalism, cultural commentary, and honest video conversations on the mic.',
  })
  const { data, error, loading } = useAsync(() => Promise.all([latest('episodes'), latest('articles')]), [])
  const [episode, article] = data ?? []

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="container split split--hero">
          <div className="stack stack--lg">
            <p className="eyebrow">JOURNALIST • STORYTELLER • PODCAST HOST</p>
            <h1 id="hero-title">
              Uncovering the stories that shape us. <em>Amplifying the voices that need to be heard.</em>
            </h1>
            <p className="lede">
              Welcome to the digital home of Nyanchiew Malual—a space dedicated to in-depth journalism, cultural
              commentary, and honest video conversations on the mic.
            </p>
            <div className="row">
              <Link to="/podcast" className="btn btn--primary btn--lg">
                <Play size={18} aria-hidden="true" /> Watch the Podcast
              </Link>
              <Link to="/book" className="btn btn--outline btn--lg">
                Book an Interview
              </Link>
            </div>
          </div>
          <PortraitFrame />
        </div>
      </section>

      <section className="section" aria-labelledby="latest-title">
        <div className="container stack stack--lg">
          <h2 id="latest-title">Latest from the Mic &amp; the Page</h2>
          <DataState loading={loading} error={error} skeletons={2}>
            <div className="split">
              {episode ? (
                <Feature
                  dark
                  icon={Mic2}
                  label="Latest episode"
                  media={<VideoPlayer videoId={episode.video_id} title={episode.title} />}
                  badge={`Episode ${episode.episode_number}`}
                  meta={[[Eye, formatViews(episode.views_count)]]}
                  title={episode.title}
                  text={episode.guest_name && `With ${episode.guest_name}`}
                  action={
                    <Link to="/podcast" className="btn btn--primary">
                      <Play size={16} aria-hidden="true" /> Watch Episode
                    </Link>
                  }
                />
              ) : (
                <Placeholder text="The first episode is coming soon." />
              )}

              {article ? (
                <Feature
                  icon={PenLine}
                  label="Latest story"
                  media={<Cover article={article} />}
                  badge={article.category}
                  meta={[[null, formatShortDate(article.published_at)], article.read_time_minutes && [Clock, `${article.read_time_minutes} min read`]]}
                  title={article.title}
                  text={article.excerpt}
                  action={
                    isHttpsUrl(article.external_url) ? (
                      <a className="text-link" href={article.external_url} target="_blank" rel="noopener noreferrer">
                        Read Full Story <ExternalLink size={16} aria-hidden="true" />
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    ) : (
                      <Link className="text-link" to={`/stories/${article.slug}`}>
                        Read Full Story <ArrowRight size={16} aria-hidden="true" />
                      </Link>
                    )
                  }
                />
              ) : (
                <Placeholder text="New stories are coming soon." />
              )}
            </div>
          </DataState>
        </div>
      </section>

      <section className="section section--alt" aria-labelledby="pillars-title">
        <div className="container stack stack--lg">
          <h2 id="pillars-title">How I Tell Stories</h2>
          <div className="cards">
            {PILLARS.map(({ icon: Icon, title, text, cta, to, href }) => {
              const Wrapper = href ? 'a' : Link
              const target = href ? { href, target: '_blank', rel: 'noopener noreferrer' } : { to }
              return (
                <Wrapper key={title} className="card card--link" {...target}>
                  <div className="card__body">
                    <span className="icon-tile">
                      <Icon aria-hidden="true" />
                    </span>
                    <h3>{title}</h3>
                    <p className="muted">{text}</p>
                    <span className="card__cta">
                      {cta} <ArrowUpRight size={16} aria-hidden="true" />
                      {href && <span className="sr-only"> (opens in a new tab)</span>}
                    </span>
                  </div>
                </Wrapper>
              )
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Newsletter />
        </div>
      </section>
    </>
  )
}
