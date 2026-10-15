import { createBookingMailer, EmailConfigurationError } from '../booking-mailer.js'
import { withApiErrors } from '../http.js'
import { getAdminClient } from '../supabase.js'
import { allowMethod, clean, EMAIL_RE, isBot, rateLimit } from '../utils.js'

const BOOKING = 'Book Nyanchiew - Speaking/Media/Collab'
const SUBTYPES = {
  'Podcast Guest Pitch': ['Be a Podcast Guest', 'Nominate Someone Else'],
  'Story Lead': ['Pitch a Written Story Idea'],
  [BOOKING]: ['Event Hosting / Moderation', 'Speaking Engagement', 'Journalism Commission', 'Brand Collaboration'],
}

/** [form key, database column, label shown in emails, max length] */
const FIELDS = [
  ['inquiryType', 'inquiry_type', 'Inquiry type', 80],
  ['inquirySubtype', 'inquiry_subtype', 'Category', 80],
  ['guestName', 'guest_name', 'Name', 200],
  ['pronouns', 'pronouns', 'Pronouns', 60],
  ['guestEmail', 'guest_email', 'Email', 320],
  ['organization', 'organization', 'Organization', 200],
  ['socialLinks', 'social_links', 'Links', 2000],
  ['storyPitch', 'story_pitch', 'Story / project details', 6000],
  ['talkingPoints', 'talking_points', 'Key talking points', 6000],
  ['projectTimeline', 'project_timeline', 'Event date / timeline', 300],
  ['budgetDetails', 'budget_details', 'Budget', 2000],
]

function validate(body) {
  const row = {}
  const errors = {}
  for (const [key, column, , max] of FIELDS) row[column] = clean(body[key], max)

  if (!SUBTYPES[row.inquiry_type]) errors.inquiryType = 'Please choose a valid inquiry type.'
  else if (!SUBTYPES[row.inquiry_type].includes(row.inquiry_subtype)) errors.inquirySubtype = 'Please choose an option.'
  if (!row.guest_name) errors.guestName = 'Please share your name.'
  if (!EMAIL_RE.test(row.guest_email)) errors.guestEmail = 'Please enter a valid email address.'
  if (!row.story_pitch) errors.storyPitch = 'This field is required.'
  if (row.inquiry_type === BOOKING && !row.organization) errors.organization = 'Please add your organization.'
  return { row, errors }
}

/* ── Email template (colours match the site palette) ── */
const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])

const cell = 'padding:12px 14px;border-bottom:1px solid #E1CBD7;font:15px/1.6 Arial,sans-serif;vertical-align:top;'

function renderEmail({ heading, intro, row, footer }) {
  const rows = FIELDS.filter(([, column]) => row[column])
    .map(
      ([, column, label]) => `<tr>
        <td style="${cell}width:34%;color:#26425A;font-weight:bold;font-size:13px;">${label}</td>
        <td style="${cell}color:#0F2030;white-space:pre-wrap;">${escapeHtml(row[column])}</td></tr>`,
    )
    .join('')

  return `<!doctype html><html lang="en"><body style="margin:0;background:#F7F0F4;padding:24px 12px;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-top:5px solid #C38EB4;border-radius:12px;padding:28px;">
      <h1 style="margin:0 0 10px;font:bold 24px Georgia,serif;color:#0F2030;">${escapeHtml(heading)}</h1>
      <p style="margin:0 0 20px;font:15px/1.6 Arial,sans-serif;color:#26425A;">${intro}</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #E1CBD7;">${rows}</table>
      <p style="margin:20px 0 0;font:13px/1.6 Arial,sans-serif;color:#26425A;">${footer}</p>
    </div></body></html>`
}

async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return
  if (isBot(req.body)) return res.status(200).json({ ok: true })
  if (!rateLimit(req, res, { name: 'book', limit: 5, windowMs: 15 * 60_000 })) return

  const { row, errors } = validate(req.body ?? {})
  if (Object.keys(errors).length) {
    return res.status(422).json({ error: 'Please fix the highlighted fields.', fields: errors })
  }

  // 1. Save the submission.
  const { data: booking, error } = await getAdminClient()
    .from('bookings')
    .insert({ ...row, status: 'pending' })
    .select('id, created_at')
    .single()

  if (error) {
    console.error('[api/book]', error)
    return res.status(500).json({ error: 'Something went wrong on our end. Please try again shortly.' })
  }

  // 2. Send both emails at once. The booking is already saved, so email trouble never fails the request.
  const emails = { admin: false, guest: false }
  try {
    const mailer = createBookingMailer()
    const send = async (recipientRole, message) => {
      try {
        const result = await mailer.send(message)
        if (!result.accepted) throw new Error('Email provider did not accept the message.')
        console.info('[api/book] Email accepted:', { bookingId: booking.id, recipientRole, emailId: result.id })
        return true
      } catch (sendError) {
        let errorMessage = String(sendError?.message || 'Email could not be submitted.')
        for (const secret of mailer.secrets) {
          if (secret) errorMessage = errorMessage.replaceAll(secret, '[redacted]')
        }
        console.error('[api/book] Email failed:', {
          bookingId: booking.id,
          recipientRole,
          errorName: sendError?.name || 'email_error',
          errorMessage,
        })
        return false
      }
    }

    const name = row.guest_name.replace(/\s+/g, ' ')
    ;[emails.admin, emails.guest] = await Promise.all([
      send('admin', {
        to: [mailer.adminEmail],
        replyTo: row.guest_email,
        subject: `[New ${row.inquiry_type}] from ${name}`,
        html: renderEmail({
          heading: `New ${row.inquiry_type}`,
          intro: `<strong>${escapeHtml(name)}</strong> sent this through your website. Press Reply to answer them directly.`,
          row,
          footer: `Reference: ${booking.id}`,
        }),
      }),
      send('guest', {
        to: [row.guest_email],
        replyTo: mailer.adminEmail,
        subject: 'Thank you for reaching out — Nyanchiew Malual',
        html: renderEmail({
          heading: `Thank you, ${name.split(' ')[0]}.`,
          intro: 'Your message has reached Nyanchiew. Expect a reply within <strong>3–5 business days</strong>. Here is a copy of what you sent.',
          row,
          footer: `Reference: ${booking.id}`,
        }),
      }),
    ])
  } catch (emailError) {
    if (emailError instanceof EmailConfigurationError) {
      console.warn('[api/book] Email configuration:', {
        bookingId: booking.id,
        missing: emailError.missing,
        invalid: emailError.invalid,
      })
    } else {
      console.error('[api/book] Email setup failed:', {
        bookingId: booking.id,
        errorName: emailError?.name || 'email_error',
        errorMessage: 'Could not prepare notification emails.',
      })
    }
  }

  return res.status(201).json({ ok: true, id: booking.id, emails })
}

export default withApiErrors(handler, { method: 'POST' })
