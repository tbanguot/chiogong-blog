export const SITE = {
  name: 'Nyanchiew Malual',
  facebookUrl: 'https://facebook.com/nyanchiew.malual.2025',
}

/* /nyanchiew-studio is intentionally NOT listed here. */
export const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/stories', label: 'Stories' },
  { to: '/podcast', label: 'Podcast' },
  { to: '/about', label: 'About' },
  { to: '/book', label: 'Book', cta: true },
]

export const ARTICLE_CATEGORIES = ['Investigative', 'Culture', 'Personal Essay', 'Published Work']

/** `value` is stored in the database; `label` is what readers see. */
export const STORY_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Investigative', value: 'Investigative' },
  { label: 'Culture', value: 'Culture' },
  { label: 'Personal Essays', value: 'Personal Essay' },
  { label: 'Published Work', value: 'Published Work' },
]

export const BOOKING_STATUSES = ['pending', 'approved', 'archived']

export const CONTENT_KINDS = [
  { value: 'episode', label: 'Video Episodes' },
  { value: 'article', label: 'Written Stories' },
]
