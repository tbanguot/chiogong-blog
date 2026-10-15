import { useState } from 'react'
import { Save, X } from 'lucide-react'
import Field from '../ui/Field'
import SubmitButton from '../ui/SubmitButton'
import { useRecordForm } from '../../hooks/useRecordForm'
import { ARTICLE_CATEGORIES } from '../../utils/constants'
import { dateInputToISO, estimateReadTime, isHttpsUrl, slugify, toDateInput } from '../../utils/format'
import { missing } from '../../utils/validation'

const validate = (v) => ({
  ...missing(v, { title: 'Add a title.', slug: 'Add a URL slug.', excerpt: 'Add a short excerpt.' }),
  ...(v.slug && slugify(v.slug) !== v.slug && { slug: 'Use lowercase letters, numbers and hyphens.' }),
  ...(!v.body.trim() && !v.external_url.trim() && { body: 'Write the story, or add a link if it is published elsewhere.' }),
  ...(v.external_url && !isHttpsUrl(v.external_url) && { external_url: 'Enter a full https:// link.' }),
  ...(v.cover_image_url && !isHttpsUrl(v.cover_image_url) && { cover_image_url: 'Enter a full https:// link.' }),
})

const toPayload = (v) => ({
  title: v.title.trim(),
  slug: v.slug,
  category: v.category,
  excerpt: v.excerpt.trim(),
  body: v.body.trim(),
  cover_image_url: v.cover_image_url.trim() || null,
  external_url: v.external_url.trim() || null,
  read_time_minutes: v.read_time_minutes === '' ? null : Number(v.read_time_minutes),
  published_at: dateInputToISO(v.published_date),
})

export default function ArticleForm({ record, notify, onSaved, onCancel }) {
  const [slugEdited, setSlugEdited] = useState(Boolean(record))
  const { form, saving, submit } = useRecordForm({
    table: 'articles',
    noun: 'Story',
    record,
    notify,
    onSaved,
    validate,
    toPayload,
    initial: {
      title: record?.title ?? '',
      slug: record?.slug ?? '',
      category: record?.category ?? ARTICLE_CATEGORIES[0],
      excerpt: record?.excerpt ?? '',
      body: record?.body ?? '',
      cover_image_url: record?.cover_image_url ?? '',
      external_url: record?.external_url ?? '',
      read_time_minutes: String(record?.read_time_minutes ?? ''),
      published_date: toDateInput(record?.published_at),
    },
  })
  const { bind } = form

  return (
    <form className="card panel stack stack--lg" onSubmit={submit} noValidate>
      <div className="row row--between">
        <h2>{record ? 'Edit Story' : 'Post a New Story'}</h2>
        {record && (
          <button type="button" className="btn btn--outline btn--sm" onClick={onCancel}>
            <X size={16} aria-hidden="true" /> Cancel
          </button>
        )}
      </div>

      <div className="fields">
        <Field
          {...bind('title')}
          label="Title"
          required
          className="wide"
          onChange={(event) => {
            form.set('title', event.target.value)
            if (!slugEdited) form.set('slug', slugify(event.target.value))
          }}
        />
        <Field {...bind('slug')} label="URL slug" required onChange={(event) => (setSlugEdited(true), form.set('slug', event.target.value))} />
        <Field {...bind('category')} label="Category" as="select" options={ARTICLE_CATEGORIES} />
        <Field {...bind('excerpt')} label="Short excerpt" as="textarea" rows={3} required className="wide" />
        <Field {...bind('external_url')} label="Link to the original (optional)" type="url" className="wide" hint="If set, the story card opens this link in a new tab." />
        <Field
          {...bind('body')}
          label="Story text"
          as="textarea"
          rows={12}
          className="wide"
          hint="Blank line = new paragraph. Start a line with “## ” for a heading or “- ” for a list."
          onChange={(event) => {
            form.set('body', event.target.value)
            if (!record && event.target.value.trim()) form.set('read_time_minutes', String(estimateReadTime(event.target.value)))
          }}
        />
        <Field {...bind('cover_image_url')} label="Cover image URL" type="url" />
        <Field {...bind('read_time_minutes')} label="Read time (minutes)" type="number" min="1" />
        <Field {...bind('published_date')} label="Publish date" type="date" />
      </div>

      <div>
        <SubmitButton loading={saving} loadingText="Saving…" className="btn--lg">
          <Save size={18} aria-hidden="true" /> {record ? 'Save changes' : 'Publish story'}
        </SubmitButton>
      </div>
    </form>
  )
}
