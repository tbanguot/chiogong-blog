import { useEffect } from 'react'

const DEFAULT_TITLE = 'Nyanchiew Malual — Journalist, Storyteller & Podcast Host'

function setMeta(name, content) {
  let tag = document.head.querySelector(`meta[name="${name}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', name)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
  return tag
}

/** Sets the document title + meta description (and optionally robots) for the current page. */
export function usePageMeta({ title, description, robots } = {}) {
  useEffect(() => {
    const previousTitle = document.title
    const descTag = document.head.querySelector('meta[name="description"]')
    const previousDescription = descTag?.getAttribute('content')
    const robotsTagBefore = document.head.querySelector('meta[name="robots"]')
    const previousRobots = robotsTagBefore?.getAttribute('content')

    document.title = title ? `${title} · Nyanchiew Malual` : DEFAULT_TITLE
    if (description) setMeta('description', description)

    let robotsTag = null
    if (robots) robotsTag = setMeta('robots', robots)

    return () => {
      document.title = previousTitle
      if (description) {
        if (previousDescription !== undefined && previousDescription !== null) setMeta('description', previousDescription)
        else descTag?.remove()
      }
      if (robotsTag) {
        if (previousRobots !== undefined && previousRobots !== null) setMeta('robots', previousRobots)
        else robotsTag.remove()
      }
    }
  }, [title, description, robots])
}
