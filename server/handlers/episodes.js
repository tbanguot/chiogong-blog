import { getPublicClient } from '../supabase.js'
import { withApiErrors } from '../http.js'
import { allowMethod } from '../utils.js'

const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/
const first = (value) => (Array.isArray(value) ? value[0] : value)

/**
 * GET /api/episodes?search=&month=YYYY-MM&sort=recent|popular&limit=
 */
async function handler(req, res) {
  if (!allowMethod(req, res, 'GET')) return

  const { search, month, sort, limit } = Object.fromEntries(
    Object.entries(req.query).map(([key, value]) => [key, first(value)]),
  )
  let query = getPublicClient().from('episodes').select('*')

  // Remove characters that have meaning in PostgREST filters / LIKE patterns.
  const term = String(search ?? '').replace(/[,()"'\\%_*]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100)
  if (term) {
    const like = `%${term}%`
    query = query.or(`title.ilike.${like},description.ilike.${like},guest_name.ilike.${like}`)
  }

  if (month) {
    const match = MONTH_RE.exec(month)
    if (!match) return res.status(400).json({ error: 'Invalid "month". Use YYYY-MM, e.g. 2026-10.' })
    const [year, index] = [Number(match[1]), Number(match[2]) - 1]
    query = query
      .gte('published_at', new Date(Date.UTC(year, index, 1)).toISOString())
      .lt('published_at', new Date(Date.UTC(year, index + 1, 1)).toISOString())
  }

  if (sort === 'popular') query = query.order('views_count', { ascending: false })
  const max = Math.min(Math.max(parseInt(limit, 10) || 60, 1), 100)
  const { data, error } = await query.order('published_at', { ascending: false }).limit(max)

  if (error) {
    console.error('[api/episodes]', error)
    return res.status(500).json({ error: 'Could not load episodes.' })
  }
  res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120')
  return res.status(200).json({ episodes: data })
}

export default withApiErrors(handler, { method: 'GET' })
