/** Adapt the shared JSON handlers to Netlify's buffered function event contract. */
export function adaptApiHandler(apiHandler) {
  return async (event) => {
    const url = new URL(event.rawUrl || event.url || '/', 'https://netlify.local')
    const query = {}
    for (const [key, value] of url.searchParams) {
      if (key in query) query[key] = Array.isArray(query[key]) ? [...query[key], value] : [query[key], value]
      else query[key] = value
    }
    for (const [key, value] of Object.entries(event.queryStringParameters || {})) {
      if (!(key in query)) query[key] = value
    }
    for (const [key, value] of Object.entries(event.pathParameters || {})) {
      if (!(key in query)) query[key] = value
    }

    let bodyValue
    let bodyRead = false
    const req = {
      method: event.httpMethod || event.requestContext?.http?.method || 'GET',
      url: event.rawUrl || event.path || '/',
      query,
      headers: Object.fromEntries(Object.entries(event.headers || {}).map(([key, value]) => [key.toLowerCase(), value])),
    }
    Object.defineProperty(req, 'body', {
      enumerable: true,
      get() {
        if (bodyRead) return bodyValue
        bodyRead = true
        const raw = event.body
        if (raw == null || raw === '') bodyValue = {}
        else {
          try {
            const text = event.isBase64Encoded ? Buffer.from(raw, 'base64').toString('utf8') : raw
            bodyValue = JSON.parse(text)
          } catch {
            throw Object.assign(new Error('Invalid JSON body.'), { statusCode: 400 })
          }
        }
        return bodyValue
      },
      set(value) { bodyValue = value; bodyRead = true },
    })

    const headers = { 'Content-Type': 'application/json; charset=utf-8' }
    let statusCode = 200
    let responseBody = ''
    let ended = false
    const res = {
      headersSent: false,
      writableEnded: false,
      setHeader(name, value) { headers[name] = value; return this },
      status(code) { statusCode = code; return this },
      json(value) {
        responseBody = JSON.stringify(value)
        ended = true
        this.headersSent = true
        this.writableEnded = true
        return this
      },
    }

    await apiHandler(req, res)
    return { statusCode, headers, body: ended ? responseBody : '' }
  }
}
