import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { loadEnv } from 'vite'
import { createBookingMailer, EmailConfigurationError } from '../server/booking-mailer.js'

/** Validate deployment settings without connecting to databases or sending email. */
export function productionConfigurationErrors(env) {
  const errors = []
  const value = (key) => env[key]?.trim() || ''
  const placeholder = (text) => /^(your[-_\s]|replace[-_\s]|<.*>|change[-_\s])/i.test(text)
  const required = (key) => {
    if (!value(key)) errors.push(`Missing ${key}.`)
    else if (placeholder(value(key))) errors.push(`Replace the placeholder for ${key}.`)
  }
  const urlOrigin = (key, input) => {
    if (!input) return null
    try {
      const url = new URL(input)
      if (url.protocol !== 'https:' || url.username || url.password || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error('Invalid URL')
      if (/your[-_]|example\.(com|test)/i.test(url.hostname)) throw new Error('Placeholder URL')
      return url.origin
    } catch {
      errors.push(`${key} must be a production HTTPS URL.`)
      return null
    }
  }

  for (const key of ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']) required(key)
  const clientOrigin = urlOrigin('VITE_SUPABASE_URL', value('VITE_SUPABASE_URL'))
  const serverOrigin = urlOrigin('SUPABASE_URL', value('SUPABASE_URL') || value('VITE_SUPABASE_URL'))
  if (clientOrigin && serverOrigin && clientOrigin !== serverOrigin) errors.push('Browser and server Supabase URLs must use the same project.')

  const browserKey = value('VITE_SUPABASE_ANON_KEY')
  const serviceKey = value('SUPABASE_SERVICE_ROLE_KEY')
  if (browserKey && (browserKey === serviceKey || browserKey.startsWith('sb_secret_'))) {
    errors.push('VITE_SUPABASE_ANON_KEY must be the public key, never the service-role key.')
  }
  try {
    const claims = JSON.parse(Buffer.from(browserKey.split('.')[1] || '', 'base64url').toString())
    if (claims.role === 'service_role') errors.push('VITE_SUPABASE_ANON_KEY contains a service-role key.')
  } catch { /* New publishable keys are not JWTs. */ }

  for (const key of Object.keys(env)) {
    if (key.startsWith('VITE_') && /SECRET|PASSWORD|SERVICE_ROLE|REFRESH_TOKEN|ACCESS_TOKEN/i.test(key)) {
      errors.push(`Remove browser-exposed secret variable ${key}.`)
    }
  }

  try {
    const mailer = createBookingMailer(env)
    const keys = mailer.provider === 'resend'
      ? ['RESEND_API_KEY', 'RESEND_FROM_EMAIL', 'ADMIN_EMAIL']
      : ['MAILBOX_EMAIL', 'MAILBOX_CLIENT_ID', 'MAILBOX_CLIENT_SECRET', 'MAILBOX_REFRESH_TOKEN']
    for (const key of keys) if (placeholder(value(key))) errors.push(`Replace the placeholder for ${key}.`)
    if (mailer.provider === 'resend') {
      const senderDomain = mailer.from.match(/@([^<>\s]+)>?$/)?.[1]?.toLowerCase()
      if (['resend.dev', 'yourdomain.com', 'gmail.com', 'outlook.com', 'hotmail.com', 'live.com', 'yahoo.com', 'icloud.com'].includes(senderDomain) || /your[-_]|example\.(com|test)/i.test(senderDomain || '')) {
        errors.push('Resend requires a verified sending domain for production; personal email domains cannot be used as the sender.')
      }
    }
  } catch (error) {
    if (error instanceof EmailConfigurationError) {
      for (const key of error.missing) errors.push(`Missing ${key}.`)
      for (const key of error.invalid) errors.push(`Invalid ${key}.`)
    } else errors.push('Email sender configuration could not be initialized.')
  }
  return [...new Set(errors)]
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const env = loadEnv('production', process.cwd(), '')
  const errors = productionConfigurationErrors(env)
  if (errors.length) {
    console.error('Production configuration check failed:\n' + errors.map((error) => `- ${error}`).join('\n'))
    process.exitCode = 1
  } else console.log('Production configuration is complete. Live database access and email delivery still require valid credentials.')
}
