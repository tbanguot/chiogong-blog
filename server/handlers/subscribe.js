import { getAdminClient } from '../supabase.js'
import { withApiErrors } from '../http.js'
import { allowMethod, clean, EMAIL_RE, isBot, rateLimit } from '../utils.js'

/** POST /api/subscribe { email } */
async function handler(req, res) {
  if (!allowMethod(req, res, 'POST')) return
  if (isBot(req.body)) return res.status(200).json({ ok: true })
  if (!rateLimit(req, res, { name: 'subscribe', limit: 5, windowMs: 15 * 60_000 })) return

  const email = clean(req.body?.email, 320).toLowerCase()
  if (!EMAIL_RE.test(email)) return res.status(422).json({ error: 'Please enter a valid email address.' })

  // Duplicates are ignored silently so the list can't be probed.
  const { error } = await getAdminClient()
    .from('subscribers')
    .upsert({ email }, { onConflict: 'email', ignoreDuplicates: true })

  if (error) {
    console.error('[api/subscribe]', error)
    return res.status(500).json({ error: 'Could not subscribe right now. Please try again.' })
  }
  return res.status(200).json({ ok: true })
}

export default withApiErrors(handler, { method: 'POST' })
