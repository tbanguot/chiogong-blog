const HOSTS = new Set(['youtube.com', 'youtube-nocookie.com', 'youtu.be'])
const VIDEO_ID_RE = /^[\w-]{11}$/

/**
 * Extracts the 11-character video ID from any common YouTube URL:
 *   https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s
 *   https://youtu.be/dQw4w9WgXcQ?si=abc
 *   https://www.youtube.com/embed/dQw4w9WgXcQ
 *   https://www.youtube.com/live/dQw4w9WgXcQ?feature=share
 * (also /shorts/ and m. / music. subdomains). Returns `null` if no valid ID is found.
 */
export function extractYouTubeId(url) {
  if (typeof url !== 'string') return null
  const raw = url.trim()
  if (!raw) return null

  let parsed
  try {
    parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
  } catch {
    return null
  }

  const host = parsed.hostname.toLowerCase().replace(/^(www|m|music)\./, '')
  if (!HOSTS.has(host)) return null

  const segments = parsed.pathname.split('/').filter(Boolean)
  let id = null

  if (host === 'youtu.be') {
    id = segments[0]
  } else if (segments[0] === 'watch') {
    id = parsed.searchParams.get('v')
  } else if (['embed', 'live', 'shorts', 'v'].includes(segments[0])) {
    id = segments[1]
  }

  return id && VIDEO_ID_RE.test(id) ? id : null
}

export const youtubeThumbnail = (videoId, quality = 'maxresdefault') =>
  VIDEO_ID_RE.test(videoId) ? `https://img.youtube.com/vi/${encodeURIComponent(videoId)}/${quality}.jpg` : ''

export const youtubeEmbedUrl = (videoId, { autoplay = false } = {}) =>
  VIDEO_ID_RE.test(videoId)
    ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0${autoplay ? '&autoplay=1' : ''}`
    : ''
