import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { createServer } from 'node:http'
import { readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { loadEnv } from 'vite'

export const REDIRECT_URI = 'http://127.0.0.1:8787/callback'

export function createAuthorization(provider, env) {
  if (!['gmail', 'outlook'].includes(provider)) throw new Error('Usage: npm run connect:mail -- gmail|outlook')
  for (const key of ['MAILBOX_CLIENT_ID', 'MAILBOX_CLIENT_SECRET', 'MAILBOX_EMAIL']) {
    if (!env[key]?.trim()) throw new Error(`Set ${key} in .env.local before connecting your mailbox.`)
  }
  const tenant = env.MAILBOX_TENANT_ID || 'common'
  if (!/^[a-zA-Z0-9.-]+$/.test(tenant)) throw new Error('MAILBOX_TENANT_ID must be a tenant ID or common.')
  const base = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0`
  const state = randomBytes(32).toString('base64url')
  const verifier = randomBytes(48).toString('base64url')
  const scope = provider === 'gmail' ? 'https://www.googleapis.com/auth/gmail.send' : 'offline_access https://graph.microsoft.com/Mail.Send'
  const url = new URL(provider === 'gmail' ? 'https://accounts.google.com/o/oauth2/v2/auth' : `${base}/authorize`)
  url.search = new URLSearchParams({
    client_id: env.MAILBOX_CLIENT_ID, redirect_uri: REDIRECT_URI, response_type: 'code',
    scope, state, login_hint: env.MAILBOX_EMAIL, prompt: 'consent',
    code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256',
    ...(provider === 'gmail' ? { access_type: 'offline' } : { response_mode: 'query' }),
  }).toString()
  return { url: url.toString(), state, verifier, scope, tokenUrl: provider === 'gmail' ? 'https://oauth2.googleapis.com/token' : `${base}/token` }
}

export function updateEnv(contents, updates) {
  let result = contents
  for (const [key, value] of Object.entries(updates)) {
    if (!/^[A-Z_]+$/.test(key) || /[\r\n\0]/.test(value)) throw new Error('Invalid environment setting.')
    const quoted = JSON.stringify(value).replace(/\$/g, '\\$')
    const pattern = new RegExp(`^[\\t ]*(?:export[\\t ]+)?${key}[\\t ]*=.*$`, 'gm')
    if (pattern.test(result)) result = result.replace(pattern, () => `${key}=${quoted}`)
    else result += `${result && !result.endsWith('\n') ? '\n' : ''}${key}=${quoted}\n`
  }
  return result
}

export async function saveEnv(path, updates) {
  const contents = await readFile(path, 'utf8').catch((error) => {
    if (error.code === 'ENOENT') return ''
    throw error
  })
  const temporary = `${path}.${randomBytes(8).toString('hex')}.tmp`
  try {
    await writeFile(temporary, updateEnv(contents, updates), { mode: 0o600, flag: 'wx' })
    await rename(temporary, path)
  } finally {
    await unlink(temporary).catch(() => {})
  }
}

export function createCallbackHandler({ provider, env, authorization, envPath, fetchImpl = fetch, save = saveEnv, done = () => {}, signal }) {
  let consumed = false
  return async (req, res) => {
    const reply = (status, message) => {
      res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' })
      res.end(message)
    }
    const url = new URL(req.url, REDIRECT_URI)
    if (req.method !== 'GET' || req.headers.host !== '127.0.0.1:8787' || url.pathname !== '/callback') return reply(404, 'Not found.')
    const state = url.searchParams.get('state') || ''
    if (url.searchParams.getAll('state').length !== 1 || Buffer.byteLength(state) !== Buffer.byteLength(authorization.state)
      || !timingSafeEqual(Buffer.from(state), Buffer.from(authorization.state))) return reply(400, 'Invalid authorization state. Use the link printed in your terminal.')
    if (consumed) return reply(409, 'This connection attempt has already been used.')
    const code = url.searchParams.get('code')
    if (url.searchParams.has('error') || !code || url.searchParams.getAll('code').length !== 1) {
      reply(400, 'Authorization was not completed. Run the connection command again.')
      done(new Error('Mailbox authorization was not completed.'))
      return
    }
    consumed = true
    try {
      const result = await fetchImpl(authorization.tokenUrl, {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: env.MAILBOX_CLIENT_ID, client_secret: env.MAILBOX_CLIENT_SECRET,
          grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI, code_verifier: authorization.verifier,
          ...(provider === 'outlook' ? { scope: authorization.scope } : {}),
        }),
        signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15_000)]) : AbortSignal.timeout(15_000),
      })
      const tokens = await result.json()
      signal?.throwIfAborted()
      if (!result.ok || typeof tokens.refresh_token !== 'string' || !tokens.refresh_token.trim()) throw new Error('Missing refresh token')
      await save(envPath, { EMAIL_PROVIDER: provider, MAILBOX_REFRESH_TOKEN: tokens.refresh_token })
      reply(200, 'Mailbox connected. You can close this tab and restart the website server.')
      done()
    } catch {
      reply(500, 'Mailbox connection failed. Check the OAuth app settings and try the connection command again.')
      done(new Error('Mailbox connection failed. Check the OAuth app settings, consent, and .env.local permissions.'))
    }
  }
}

export async function connectMailbox(provider, { cwd = process.cwd(), env, fetchImpl = fetch, log = console.log, timeoutMs = 300_000 } = {}) {
  env ??= { ...loadEnv('development', cwd, ''), ...process.env }
  const authorization = createAuthorization(provider, env)
  const controller = new AbortController()
  return new Promise((resolveConnection, reject) => {
    let finished = false
    const finish = (error) => {
      if (finished) return
      finished = true
      clearTimeout(timer)
      server.close(() => error ? reject(error) : resolveConnection())
    }
    const server = createServer(createCallbackHandler({ provider, env, authorization, envPath: resolve(cwd, '.env.local'), fetchImpl, done: finish, signal: controller.signal }))
    const timer = setTimeout(() => {
      controller.abort()
      finish(new Error('Mailbox connection timed out. Run the command again.'))
      server.closeAllConnections()
    }, timeoutMs)
    server.once('error', finish)
    server.listen(8787, '127.0.0.1', () => {
      log('Open this URL on this computer and authorize the mailbox owner account:')
      log(authorization.url)
      log('Waiting up to five minutes. No email will be sent during connection.')
    })
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  connectMailbox(process.argv[2]).catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
