const SHORT_DATE = { month: 'short', day: 'numeric', year: 'numeric' }

export function formatDate(value, options = { dateStyle: 'long' }) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-US', options)
}
export const formatShortDate = (value) => formatDate(value, SHORT_DATE)

export function formatViews(count = 0) {
  const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(count)
  return `${compact} ${count === 1 ? 'view' : 'views'}`
}

export function formatDuration(minutes) {
  if (!minutes) return ''
  const [hours, rest] = [Math.floor(minutes / 60), minutes % 60]
  if (!hours) return `${minutes} min`
  return rest ? `${hours}h ${rest}m` : `${hours}h`
}

export const slugify = (text) =>
  String(text ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

export const estimateReadTime = (text) => Math.max(1, Math.round(text.trim().split(/\s+/).length / 220))

/** ISO timestamp (or now) → `YYYY-MM-DD` in local time, for <input type="date">. */
export function toDateInput(iso) {
  const date = iso ? new Date(iso) : new Date()
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

/** `YYYY-MM-DD` → ISO timestamp at local noon (avoids timezone day-shifts). */
export const dateInputToISO = (value) => new Date(`${value}T12:00:00`).toISOString()

export function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

export const hostname = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}
