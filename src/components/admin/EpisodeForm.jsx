import { useState } from 'react'
import { Save, X } from 'lucide-react'
import EpisodeThumb from '../media/EpisodeThumb'
import VideoPlayer from '../media/VideoPlayer'
import Field from '../ui/Field'
import SubmitButton from '../ui/SubmitButton'
import { useAsync } from '../../hooks/useAsync'
import { useRecordForm } from '../../hooks/useRecordForm'
import { db } from '../../lib/api'
import { supabase } from '../../lib/supabase'
import { dateInputToISO, isHttpsUrl, slugify, toDateInput } from '../../utils/format'
import { missing } from '../../utils/validation'
import { extractYouTubeId, youtubeThumbnail } from '../../utils/youtube'

const validate = (v) => ({
  ...missing(v, { episode_number: 'Add the episode number.', title: 'Add a title.', slug: 'Add a URL slug.', published_date: 'Choose a date.' }),
  ...(v.slug && slugify(v.slug) !== v.slug && { slug: 'Use lowercase letters, numbers and hyphens.' }),
  ...(!extractYouTubeId(v.video_url) && { video_url: 'Paste a valid YouTube link.' }),
  ...(v.custom_thumbnail && !isHttpsUrl(v.custom_thumbnail) && { custom_thumbnail: 'Enter a full https:// link.' }),
})

const toPayload = (v) => {
  const videoId = extractYouTubeId(v.video_url)
  return {
    episode_number: Number(v.episode_number),
    title: v.title.trim(),
    slug: v.slug,
    description: v.description.trim(),
    guest_name: v.guest_name.trim() || null,
    video_url: v.video_url.trim(),
    video_id: videoId,
    thumbnail_url: v.custom_thumbnail.trim() || youtubeThumbnail(videoId),
    duration_minutes: v.duration_minutes === '' ? null : Number(v.duration_minutes),
    published_at: dateInputToISO(v.published_date),
  }
}

function EpisodeFields({ record, nextNumber, notify, onSaved, onCancel }) {
  const [slugEdited, setSlugEdited] = useState(Boolean(record))
  const { form, saving, submit } = useRecordForm({
    table: 'episodes',
    noun: 'Episode',
    record,
    notify,
    onSaved,
    validate,
    toPayload,
    initial: {
      episode_number: String(record?.episode_number ?? nextNumber),
      title: record?.title ?? '',
      slug: record?.slug ?? '',
      guest_name: record?.guest_name ?? '',
      duration_minutes: String(record?.duration_minutes ?? ''),
      published_date: toDateInput(record?.published_at),
      video_url: record?.video_url ?? '',
      custom_thumbnail: record && record.thumbnail_url !== youtubeThumbnail(record.video_id) ? (record.thumbnail_url ?? '') : '',
      description: record?.description ?? '',
    },
  })
  const { values, bind } = form
  const videoId = extractYouTubeId(values.video_url)

  return (
    <form className="card panel stack stack--lg" onSubmit={submit} noValidate>
      <div className="row row--between">
        <h2>{record ? `Edit Episode ${record.episode_number}` : 'Publish a New Episode'}</h2>
        {record && (
          <button type="button" className="btn btn--outline btn--sm" onClick={onCancel}>
            <X size={16} aria-hidden="true" /> Cancel
          </button>
        )}
      </div>

      <div className="split split--studio">
        <div className="fields">
          <Field {...bind('episode_number')} label="Episode number" type="number" min="1" required hint={record ? undefined : 'Suggested: next in order'} />
          <Field {...bind('duration_minutes')} label="Duration (minutes)" type="number" min="0" />
          <Field {...bind('published_date')} label="Publish date" type="date" required />
          <Field {...bind('guest_name')} label="Guest name" />
          <Field
            {...bind('title')}
            label="Episode title"
            required
            className="wide"
            onChange={(event) => {
              form.set('title', event.target.value)
              if (!slugEdited) form.set('slug', slugify(event.target.value))
            }}
          />
          <Field
            {...bind('slug')}
            label="URL slug"
            required
            className="wide"
            hint="Made from the title. You can change it."
            onChange={(event) => (setSlugEdited(true), form.set('slug', event.target.value))}
          />
          <Field {...bind('video_url')} label="YouTube video URL" type="url" required className="wide" placeholder="https://www.youtube.com/watch?v=…" hint={videoId ? `Video found (${videoId})` : undefined} />
          <Field {...bind('custom_thumbnail')} label="Custom thumbnail URL (optional)" type="url" className="wide" />
          <Field {...bind('description')} label="Show notes" as="textarea" rows={8} className="wide" hint="Blank line = new paragraph. Start a line with “## ” for a heading or “- ” for a list." />
        </div>

        <aside className="preview card dark stack" aria-label="Live preview">
          <h3>Live preview</h3>
          {videoId ? (
            <>
              <div className="card__media">
              <EpisodeThumb episode={{ video_id: videoId, thumbnail_url: isHttpsUrl(values.custom_thumbnail) ? values.custom_thumbnail : null }} />
              </div>
              <VideoPlayer videoId={videoId} title="Episode preview" />
              <p className="muted">If the player shows an error, set the video to Public or Unlisted on YouTube.</p>
            </>
          ) : (
            <p className="muted">Paste a YouTube link to see the thumbnail and player here.</p>
          )}
        </aside>
      </div>

      <div>
        <SubmitButton loading={saving} loadingText="Saving…" className="btn--lg">
          <Save size={18} aria-hidden="true" /> {record ? 'Save changes' : 'Publish episode'}
        </SubmitButton>
      </div>
    </form>
  )
}

/** Looks up the next episode number first, so the form can start with it filled in. */
export default function EpisodeForm(props) {
  const next = useAsync(
    () =>
      props.record
        ? null
        : db(supabase.from('episodes').select('episode_number').order('episode_number', { ascending: false }).limit(1).maybeSingle()).then(
            (row) => (row?.episode_number ?? 0) + 1,
          ),
    [props.record?.id],
  )
  return next.loading ? <div className="card panel skeleton skeleton--media" /> : <EpisodeFields {...props} nextNumber={next.data ?? ''} />
}
