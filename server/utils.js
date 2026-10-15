export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const buckets = new Map()
const MAX_BUCKETS = 10_000

const clientAddress = (req) => {
  const headers = req?.headers ?? {}
  return headers['x-nf-client-connection-ip'] || headers['x-forwarded-for']?.split(',')[0]?.trim() || headers['x-real-ip'] || 'unknown'
}

/** Trim and cap a user-supplied string. */
export const clean = (value, max = 300) =>
  typeof value === 'string' ? value.replace(/\r\n/g, '\n').trim().slice(0, max) : ''

/** Responds 405 and returns false unless the request uses `method`. */
export function allowMethod(req, res, method) {
  if (req.method === method) return true
  res.setHeader('Allow', method)
  res.status(405).json({ error: 'Method not allowed' })
  return false
}

/** Best-effort per-process throttling for public serverless endpoints. */
export function rateLimit(req, res, { name, limit, windowMs, key = '' }) {
  const now = Date.now()
  const bucketKey = `${name}:${clientAddress(req)}:${key}`
  const current = buckets.get(bucketKey)
  if (!current || current.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) {
      for (const [candidate, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(candidate)
        if (buckets.size < MAX_BUCKETS) break
      }
    }
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (current.count >= limit) {
    res.setHeader('Retry-After', String(Math.max(1, Math.ceil((current.resetAt - now) / 1000))))
    res.status(429).json({ error: 'Too many requests. Please try again later.' })
    return false
  }
  current.count += 1
  return true
}

/** Honeypot: real visitors never fill the hidden "website" field. */
export const isBot = (body) => typeof body?.website === 'string' && body.website.trim() !== ''
