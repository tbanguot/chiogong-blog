const invalidBody = (res) => res.status(400).json({ error: 'Please send a valid JSON object.' })

/** Keep serverless runtime failures in the API's JSON contract, without logging request data or credentials. */
export function withApiErrors(handler, { method } = {}) {
  return async function apiHandler(req, res) {
    try {
      if (req.method === 'POST') {
        res.setHeader('Cache-Control', 'no-store')
        if (!method || method === 'POST') {
          let body
          try {
            body = req.body
          } catch (error) {
            // Some serverless adapters parse JSON lazily when req.body is read.
            if (error?.statusCode === 400) return invalidBody(res)
            throw error
          }
          if (body == null) req.body = {}
          else if (
            typeof body !== 'object' || Array.isArray(body) ||
            (Object.getPrototypeOf(body) !== Object.prototype && Object.getPrototypeOf(body) !== null)
          ) return invalidBody(res)
        }
      }
      return await handler(req, res)
    } catch {
      let route = '/api'
      try { route = new URL(req.url || '/api', 'http://localhost').pathname } catch { /* Keep the fallback route. */ }
      console.error('[api] Request failed:', { method: req.method, route })
      if (res.headersSent || res.writableEnded) return
      res.setHeader('Cache-Control', 'no-store')
      return res.status(500).json({ error: 'Something went wrong on our end. Please try again shortly.' })
    }
  }
}
