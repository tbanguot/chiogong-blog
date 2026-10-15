import { getAdminClient } from '../supabase.js'
import { withApiErrors } from '../http.js'
import { allowMethod, rateLimit } from '../utils.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** POST /api/episodes/:id/view — adds 1 to views_count via the increment_episode_views RPC. */
async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return

  const { id } = req.query
  if (!UUID_RE.test(id)) return res.status(400).json({ error: 'Invalid episode id.' })
  if (!rateLimit(req, res, { name: 'episode-view', limit: 30, windowMs: 60 * 60_000, key: id })) return

  const { data, error } = await getAdminClient().rpc('increment_episode_views', { ep_id: id })
  if (error) {
    console.error('[api/episodes/:id/view]', error)
    return res.status(500).json({ error: 'Could not record view.' })
  }
  if (data === null) return res.status(404).json({ error: 'Episode not found.' })
  return res.status(200).json({ views_count: data })
}

export default withApiErrors(handler, { method: 'POST' })
