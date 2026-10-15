import { Resend } from 'resend'
import { EMAIL_RE } from './utils.js'

const TIMEOUT_MS = 9000
const isEmail = (value) => EMAIL_RE.test(value) && !/[<>,;:"\\()\r\n]/.test(value)
const senderAddress = (value) => value.match(/^[^<>]*<([^<>]+)>$/)?.[1].trim() || value

export class EmailConfigurationError extends Error {
  constructor({ missing = [], invalid = [] } = {}) {
    super('Booking email is not configured correctly.')
    this.name = 'EmailConfigurationError'
    this.missing = missing
    this.invalid = invalid
  }
}

function providerError(data, fallback) {
  const error = new Error(String(data?.error_description || data?.error?.message || data?.message || fallback))
  const name = data?.error?.code || data?.error || data?.name
  error.name = typeof name === 'string' ? name : 'email_api_error'
  return error
}

function invalidResponse(message) {
  return Object.assign(new Error(message), { name: 'invalid_response' })
}

// Keep each UTF-8 encoded word within the RFC 2047 length limit, including Unicode subjects.
function encodeHeader(value) {
  const words = []
  let part = ''
  for (const character of value) {
    if (Buffer.byteLength(part + character) > 42) {
      words.push(part)
      part = ''
    }
    part += character
  }
  if (part) words.push(part)
  return words.map((word) => `=?UTF-8?B?${Buffer.from(word).toString('base64')}?=`).join('\r\n ')
}

function gmailMessage({ fromEmail, name, to, replyTo, subject, html }) {
  const body = Buffer.from(html).toString('base64').match(/.{1,76}/g)?.join('\r\n') || ''
  const headers = [
    `From: ${encodeHeader(name)} <${fromEmail}>`,
    `To: ${to.join(', ')}`,
    ...(replyTo ? [`Reply-To: ${replyTo}`] : []),
    `Subject: ${encodeHeader(subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: base64',
  ]
  return Buffer.from(`${headers.join('\r\n')}\r\n\r\n${body}\r\n`).toString('base64url')
}

/** A server-only sender for one booking's notifications. OAuth refresh is shared by both recipients. */
export function createBookingMailer(env = process.env, { fetchImpl = globalThis.fetch } = {}) {
  const get = (key) => env[key]?.trim() || ''
  const provider = get('EMAIL_PROVIDER').toLowerCase() || 'resend'
  const missing = []
  const invalid = []
  const requireKeys = (keys) => keys.forEach((key) => { if (!get(key)) missing.push(key) })
  const secrets = []
  let from
  let adminEmail
  let resend

  if (provider === 'resend') {
    requireKeys(['RESEND_API_KEY', 'ADMIN_EMAIL', 'RESEND_FROM_EMAIL'])
    from = get('RESEND_FROM_EMAIL')
    adminEmail = get('ADMIN_EMAIL')
    if (from && (!isEmail(senderAddress(from)) || /[\r\n]/.test(from))) invalid.push('RESEND_FROM_EMAIL')
    if (adminEmail && !isEmail(adminEmail)) invalid.push('ADMIN_EMAIL')
    if (get('RESEND_API_KEY')) secrets.push(get('RESEND_API_KEY'))
  } else if (provider === 'gmail' || provider === 'outlook') {
    requireKeys(['MAILBOX_EMAIL', 'MAILBOX_CLIENT_ID', 'MAILBOX_CLIENT_SECRET', 'MAILBOX_REFRESH_TOKEN'])
    const email = get('MAILBOX_EMAIL')
    const name = get('MAILBOX_NAME') || 'Nyanchiew Malual'
    adminEmail = get('ADMIN_EMAIL') || email
    from = `${name} <${email}>`
    if (email && !isEmail(email)) invalid.push('MAILBOX_EMAIL')
    if (adminEmail && !isEmail(adminEmail)) invalid.push('ADMIN_EMAIL')
    if (/[\r\n]/.test(name)) invalid.push('MAILBOX_NAME')
    if (provider === 'outlook' && get('MAILBOX_TENANT_ID') && !/^[a-z0-9][a-z0-9.-]*$/i.test(get('MAILBOX_TENANT_ID'))) invalid.push('MAILBOX_TENANT_ID')
    secrets.push(...['MAILBOX_CLIENT_ID', 'MAILBOX_CLIENT_SECRET', 'MAILBOX_REFRESH_TOKEN'].map(get).filter(Boolean))
  } else {
    invalid.push('EMAIL_PROVIDER')
  }
  if (missing.length || invalid.length) throw new EmailConfigurationError({ missing, invalid })

  const deadline = Date.now() + TIMEOUT_MS
  const signal = () => {
    const remaining = deadline - Date.now()
    if (remaining <= 0) throw Object.assign(new Error('Email request timed out.'), { name: 'TimeoutError' })
    return AbortSignal.timeout(remaining)
  }
  const request = (url, options) => fetchImpl(url, { ...options, signal: signal() })
  const readJson = async (response) => {
    const data = await response.json().catch(() => null)
    if (!response.ok) throw providerError(data, `Email provider rejected the request (${response.status}).`)
    if (!data || typeof data !== 'object') throw invalidResponse('Email provider returned an invalid response.')
    return data
  }

  let tokenPromise
  const accessToken = () => {
    tokenPromise ??= (async () => {
      const body = new URLSearchParams({
        client_id: get('MAILBOX_CLIENT_ID'),
        client_secret: get('MAILBOX_CLIENT_SECRET'),
        refresh_token: get('MAILBOX_REFRESH_TOKEN'),
        grant_type: 'refresh_token',
      })
      const tokenUrl = provider === 'gmail'
        ? 'https://oauth2.googleapis.com/token'
        : `https://login.microsoftonline.com/${encodeURIComponent(get('MAILBOX_TENANT_ID') || 'common')}/oauth2/v2.0/token`
      if (provider === 'outlook') body.set('scope', 'https://graph.microsoft.com/Mail.Send offline_access')
      const data = await readJson(await request(tokenUrl, {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body,
      }))
      if (typeof data.access_token !== 'string' || !data.access_token) throw invalidResponse('Email authorization returned no access token.')
      secrets.push(data.access_token)
      if (data.refresh_token) secrets.push(data.refresh_token)
      return data.access_token
    })()
    return tokenPromise
  }

  if (provider === 'resend') resend = new Resend(get('RESEND_API_KEY'))

  return {
    provider,
    from,
    adminEmail,
    secrets,
    async send({ to, replyTo, subject, html }) {
      if (!Array.isArray(to) || to.length !== 1 || !isEmail(to[0]) || (replyTo && !isEmail(replyTo))) {
        throw new Error('A valid recipient and reply address are required.')
      }
      if (typeof subject !== 'string' || /[\r\n]/.test(subject) || typeof html !== 'string') throw new Error('Invalid email content.')

      if (provider === 'resend') {
        const { data, error } = await resend.emails.send({ from, to, replyTo, subject, html }, { signal: signal() })
        if (error) throw providerError(error, 'Email could not be submitted.')
        if (!data?.id) throw invalidResponse('Email provider returned no message ID.')
        return { accepted: true, id: data.id }
      }

      const token = await accessToken()
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      if (provider === 'gmail') {
        const raw = gmailMessage({ fromEmail: get('MAILBOX_EMAIL'), name: get('MAILBOX_NAME') || 'Nyanchiew Malual', to, replyTo, subject, html })
        const data = await readJson(await request('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST', headers, body: JSON.stringify({ raw }),
        }))
        if (!data.id) throw invalidResponse('Email provider returned no message ID.')
        return { accepted: true, id: data.id }
      }

      const response = await request('https://graph.microsoft.com/v1.0/me/sendMail', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: {
            subject,
            body: { contentType: 'HTML', content: html },
            toRecipients: to.map((address) => ({ emailAddress: { address } })),
            ...(replyTo ? { replyTo: [{ emailAddress: { address: replyTo } }] } : {}),
          },
        }),
      })
      if (response.status === 202) return { accepted: true, id: null }
      await readJson(response)
      throw invalidResponse('Email provider did not accept the message.')
    },
  }
}
