import { useCallback, useEffect, useState } from 'react'
import { Inbox, ListChecks, LogOut, PlusCircle } from 'lucide-react'
import ArticleForm from './ArticleForm'
import BookingList from './BookingList'
import EpisodeForm from './EpisodeForm'
import ManageList from './ManageList'
import Pills from '../ui/Pills'
import Tabs, { TabPanel } from '../ui/Tabs'
import { supabase } from '../../lib/supabase'
import { CONTENT_KINDS } from '../../utils/constants'

const TABS = [
  { id: 'publish', label: 'Publish', icon: PlusCircle },
  { id: 'manage', label: 'Manage', icon: ListChecks },
  { id: 'bookings', label: 'Bookings & Pitches', icon: Inbox },
]

export default function Dashboard({ session }) {
  const [tab, setTab] = useState('publish')
  const [kind, setKind] = useState('episode')
  const [editing, setEditing] = useState(null) // { kind, record }
  const [version, setVersion] = useState(0)
  const [toast, setToast] = useState(null)

  const notify = useCallback((type, message) => setToast({ type, message }), [])
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(timer)
  }, [toast])

  const Form = (editing?.kind ?? kind) === 'episode' ? EpisodeForm : ArticleForm

  return (
    <>
      <header className="studio-header dark">
        <div className="container row row--between">
          <h1>
            Studio <span className="muted">· {session.user.email}</span>
          </h1>
          <button type="button" className="btn btn--outline btn--sm" onClick={() => supabase.auth.signOut()}>
            <LogOut size={16} aria-hidden="true" /> Sign Out
          </button>
        </div>
      </header>

      <div className="container section stack stack--lg">
        <Tabs tabs={TABS} value={tab} onChange={setTab} label="Studio sections" />
        <TabPanel id={tab}>
          {tab === 'publish' && (
            <div className="stack stack--lg">
              {!editing && <Pills options={CONTENT_KINDS} value={kind} onChange={setKind} label="What are you publishing?" />}
              <Form
                key={editing?.record.id ?? `new-${kind}-${version}`}
                record={editing?.record}
                notify={notify}
                onCancel={() => setEditing(null)}
                onSaved={() => {
                  if (editing) setTab('manage')
                  setEditing(null)
                  setVersion((value) => value + 1)
                }}
              />
            </div>
          )}
          {tab === 'manage' && (
            <ManageList
              version={version}
              notify={notify}
              onEdit={(editKind, record) => (setEditing({ kind: editKind, record }), setTab('publish'))}
            />
          )}
          {tab === 'bookings' && <BookingList notify={notify} />}
        </TabPanel>
      </div>

      {toast && (
        <p className={`toast toast--${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'}>
          {toast.message}
        </p>
      )}
    </>
  )
}
