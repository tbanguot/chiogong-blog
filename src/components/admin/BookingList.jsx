import { Mail } from 'lucide-react'
import DataState from '../ui/DataState'
import Field from '../ui/Field'
import { useAsync } from '../../hooks/useAsync'
import { db } from '../../lib/api'
import { supabase } from '../../lib/supabase'
import { BOOKING_STATUSES } from '../../utils/constants'
import { formatDate } from '../../utils/format'

const DETAILS = [
  ['inquiry_type', 'Type'],
  ['inquiry_subtype', 'Category'],
  ['organization', 'Organization'],
  ['pronouns', 'Pronouns'],
  ['social_links', 'Links'],
  ['story_pitch', 'Pitch / details'],
  ['talking_points', 'Talking points'],
  ['project_timeline', 'Timeline'],
  ['budget_details', 'Budget'],
]

export default function BookingList({ notify }) {
  const { data = [], error, loading, reload } = useAsync(
    () => db(supabase.from('bookings').select('*').order('created_at', { ascending: false })),
    [],
  )

  async function setStatus(booking, status) {
    try {
      await db(supabase.from('bookings').update({ status }).eq('id', booking.id))
      notify('success', `Marked as ${status}.`)
    } catch (failure) {
      notify('error', failure.message)
    }
    reload()
  }

  return (
    <DataState loading={loading} error={error} skeletons={3} empty={data.length === 0 && { title: 'No messages yet', text: 'New pitches and booking requests will appear here.' }}>
      <ul className="stack">
        {data.map((booking) => (
          <li key={booking.id}>
            <details className="card item item--details">
              <summary>
                <strong>{booking.guest_name}</strong>
                <span className="muted">{booking.guest_email}</span>
                <span className="badge">{booking.status}</span>
                <span className="muted">{formatDate(booking.created_at, { dateStyle: 'medium' })}</span>
              </summary>
              <div className="stack stack--lg">
                <dl className="kv">
                  {DETAILS.filter(([key]) => booking[key]).map(([key, label]) => (
                    <div key={key}>
                      <dt>{label}</dt>
                      <dd>{booking[key]}</dd>
                    </div>
                  ))}
                </dl>
                <div className="row">
                  <Field label="Status" name={`status-${booking.id}`} as="select" options={BOOKING_STATUSES} value={booking.status} onChange={(event) => setStatus(booking, event.target.value)} />
                  <a className="btn btn--outline" href={`mailto:${booking.guest_email}`}>
                    <Mail size={16} aria-hidden="true" /> Reply
                  </a>
                </div>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </DataState>
  )
}
