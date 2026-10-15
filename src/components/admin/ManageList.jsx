import { Eye, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import DataState from '../ui/DataState'
import Meta from '../ui/Meta'
import Pills from '../ui/Pills'
import { useAsync } from '../../hooks/useAsync'
import { db } from '../../lib/api'
import { supabase } from '../../lib/supabase'
import { CONTENT_KINDS } from '../../utils/constants'
import { formatShortDate, formatViews } from '../../utils/format'

const TABLES = { episode: 'episodes', article: 'articles' }

export default function ManageList({ version, onEdit, notify }) {
  const [kind, setKind] = useState('episode')
  const { data = [], error, loading, reload } = useAsync(
    () => db(supabase.from(TABLES[kind]).select('*').order('published_at', { ascending: false })),
    [kind, version],
  )

  async function remove(item) {
    if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return
    try {
      await db(supabase.from(TABLES[kind]).delete().eq('id', item.id))
      notify('success', 'Deleted.')
      reload()
    } catch (failure) {
      notify('error', failure.message)
    }
  }

  return (
    <div className="stack stack--lg">
      <Pills options={CONTENT_KINDS} value={kind} onChange={setKind} label="Content type" />
      <DataState loading={loading} error={error} skeletons={3} empty={data.length === 0 && { title: 'Nothing here yet', text: 'Published items will show up here.' }}>
        <ul className="stack">
          {data.map((item) => (
            <li key={item.id} className="card item">
              <div className="stack">
                <div className="row">
                  <span className="badge">{kind === 'episode' ? `EP ${item.episode_number}` : item.category}</span>
                  <Meta items={[[null, formatShortDate(item.published_at)], kind === 'episode' && [Eye, formatViews(item.views_count)]]} />
                </div>
                <h3>{item.title}</h3>
              </div>
              <div className="row">
                <button type="button" className="btn btn--outline btn--sm" onClick={() => onEdit(kind, item)}>
                  <Pencil size={14} aria-hidden="true" /> Edit<span className="sr-only"> {item.title}</span>
                </button>
                <button type="button" className="btn btn--outline btn--sm" onClick={() => remove(item)}>
                  <Trash2 size={14} aria-hidden="true" /> Delete<span className="sr-only"> {item.title}</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </DataState>
    </div>
  )
}
