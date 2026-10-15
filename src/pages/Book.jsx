import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import Field from '../components/ui/Field'
import Honeypot from '../components/ui/Honeypot'
import PageHero from '../components/ui/PageHero'
import SubmitButton from '../components/ui/SubmitButton'
import { useForm } from '../hooks/useForm'
import { usePageMeta } from '../hooks/usePageMeta'
import { postJSON } from '../lib/api'
import { EMAIL_RE, focusFirstError, hasErrors, missing } from '../utils/validation'

const BOOKING_TYPE = 'Book Nyanchiew - Speaking/Media/Collab'

const CONTACT_OPTIONS = [
  { value: 'Be a Podcast Guest', label: 'Be a guest on the podcast', type: 'Podcast Guest Pitch', kind: 'guest' },
  { value: 'Nominate Someone Else', label: 'Suggest a podcast guest', type: 'Podcast Guest Pitch', kind: 'guest' },
  { value: 'Pitch a Written Story Idea', label: 'Pitch a story idea', type: 'Story Lead', kind: 'story' },
  { value: 'Event Hosting / Moderation', label: 'Book event hosting or moderation', type: BOOKING_TYPE, kind: 'booking' },
  { value: 'Speaking Engagement', label: 'Book a speaking engagement', type: BOOKING_TYPE, kind: 'booking' },
  { value: 'Journalism Commission', label: 'Commission journalism', type: BOOKING_TYPE, kind: 'booking' },
  { value: 'Brand Collaboration', label: 'Discuss a brand collaboration', type: BOOKING_TYPE, kind: 'booking' },
]

const commonFields = [
  { name: 'guestName', label: 'Full name', required: true, autoComplete: 'name' },
  { name: 'guestEmail', label: 'Email address', required: true, type: 'email', autoComplete: 'email' },
]

const initial = {
  inquirySubtype: CONTACT_OPTIONS[0].value,
  guestName: '', guestEmail: '', pronouns: '', organization: '', socialLinks: '',
  storyPitch: '', talkingPoints: '', projectTimeline: '', budgetDetails: '',
}

/* The single intake form reveals only the fields relevant to this choice. */
const selectedOption = (subtype) => CONTACT_OPTIONS.find((option) => option.value === subtype) ?? CONTACT_OPTIONS[0]

function BookingForm({ onDone }) {
  const { values, bind, setErrors, reset } = useForm(initial, 'booking-')
  const [website, setWebsite] = useState('')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const option = selectedOption(values.inquirySubtype)
  const isBooking = option.kind === 'booking'
  const isGuest = option.kind === 'guest'

  async function submit(event) {
    event.preventDefault()
    setFormError('')
    const required = Object.fromEntries([
      ...commonFields,
      ...(isBooking ? [{ name: 'organization', label: 'Organization', required: true }] : []),
      { name: 'storyPitch', label: isBooking ? 'Project details' : 'Story details', required: true },
    ].filter((field) => field.required).map((field) => [field.name, `${field.label} is required.`]))
    const errors = { ...missing(values, required), ...(!EMAIL_RE.test(values.guestEmail.trim()) && { guestEmail: 'Please enter a valid email address.' }) }
    setErrors(errors)
    if (hasErrors(errors)) return focusFirstError(errors, 'booking-')

    setLoading(true)
    try {
      const result = await postJSON('/api/book', { ...values, inquiryType: option.type, website })
      const labels = {
        guestName: 'Full name', guestEmail: 'Email address', pronouns: 'Pronouns', organization: 'Organization',
        socialLinks: 'Social media / portfolio links', storyPitch: isBooking ? 'Project details' : 'Story details',
        talkingPoints: 'Key talking points', projectTimeline: 'Event date / timeline', budgetDetails: 'Budget',
      }
      const fields = [
        ...commonFields.map(({ name, label }) => ({ name, label })),
        ...(isBooking ? [{ name: 'organization', label: labels.organization }, { name: 'projectTimeline', label: labels.projectTimeline }, { name: 'budgetDetails', label: labels.budgetDetails }] : []),
        ...(!isBooking ? [{ name: 'pronouns', label: labels.pronouns }, { name: 'socialLinks', label: labels.socialLinks }, { name: 'talkingPoints', label: labels.talkingPoints }] : []),
        { name: 'storyPitch', label: labels.storyPitch },
      ]
      const rows = [['Category', values.inquirySubtype], ...fields.map(({ name, label }) => [label, values[name]])].filter(([, value]) => value.trim())
      onDone({ ...result, name: values.guestName.split(' ')[0], email: values.guestEmail, rows })
      reset()
    } catch (error) {
      if (error.fields) setErrors(error.fields)
      setFormError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="form stack stack--lg" onSubmit={submit} noValidate>
      <div className="stack">
        <h2>Tell me how I can help</h2>
        <p className="muted">Choose the option that best matches your message. You’ll only see the questions you need.</p>
      </div>
      <div className="fields">
        <Field {...bind('inquirySubtype')} label="I’m getting in touch about" as="select" options={CONTACT_OPTIONS.map(({ value, label }) => ({ value, label }))} />
        {commonFields.map(({ name, ...field }) => <Field key={name} {...bind(name)} {...field} />)}
        {isBooking && <Field {...bind('organization')} label="Organization or event" required autoComplete="organization" />}
        {!isBooking && <Field {...bind('pronouns')} label="Pronouns" />}
        {!isBooking && <Field {...bind('socialLinks')} label={isGuest ? 'Social media / portfolio links' : 'Relevant links (optional)'} as="textarea" rows={3} />}
        {isBooking && <Field {...bind('projectTimeline')} label="Event date / timeline" />}
        <Field {...bind('storyPitch')} label={isBooking ? 'Tell me about the project or event' : isGuest ? 'Tell me about the guest or conversation' : 'What’s the heart of the story?'} required as="textarea" rows={5} />
        {!isBooking && <Field {...bind('talkingPoints')} label="Key talking points (optional)" as="textarea" rows={4} />}
        {isBooking && <Field {...bind('budgetDetails')} label="Budget (optional)" />}
      </div>
      <Honeypot value={website} onChange={setWebsite} />
      {formError && (
        <p className="notice" role="alert">
          {formError}
        </p>
      )}
      <div>
        <SubmitButton loading={loading} className="btn--lg">
          Send message
        </SubmitButton>
      </div>
    </form>
  )
}

function Receipt({ receipt, onReset }) {
  return (
    <div className="stack stack--lg" role="status">
      <CheckCircle2 className="receipt__icon" aria-hidden="true" />
      <h2>Thank you, {receipt.name}!</h2>
      <p>
        Your message was saved. You’ll hear back within <strong>3–5 business days</strong>.{' '}
        {receipt.emails?.guest ? `We emailed a copy to ${receipt.email}.` : 'Please keep this page for your records.'}
      </p>
      {receipt.emails?.admin === false && (
        <p className="notice" role="alert">
          The notification email couldn’t be sent. Your submission is saved, so there’s no need to send it again.
        </p>
      )}
      {receipt.id && <p className="muted">Reference: {receipt.id}</p>}
      <dl className="kv card">
        {receipt.rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div>
        <button type="button" className="btn btn--outline" onClick={onReset}>
          Send another message
        </button>
      </div>
    </div>
  )
}

export default function Book() {
  usePageMeta({
    title: 'Let’s connect',
    description: 'Share a story idea, join the podcast, or book Nyanchiew Malual for speaking, hosting and collaborations.',
  })
  const [receipt, setReceipt] = useState(null)

  return (
    <>
      <PageHero eyebrow="Let’s talk" title="Let’s connect">
        Have a story, a collaboration, or an event in mind? Send the right kind of message in a few simple steps.
      </PageHero>

      <section className="section section--flush">
        <div className="container container--narrow">
          <div className="card panel">
            {receipt ? (
              <Receipt receipt={receipt} onReset={() => setReceipt(null)} />
            ) : <BookingForm onDone={setReceipt} />}
          </div>
        </div>
      </section>
    </>
  )
}
