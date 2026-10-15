import { useState } from 'react'
import { isHttpsUrl } from '../../utils/format'
import { youtubeThumbnail } from '../../utils/youtube'

/** Stored thumbnail → YouTube hqdefault. Falls back automatically if the image 404s. */
export default function EpisodeThumb({ episode }) {
  const fallback = youtubeThumbnail(episode.video_id, 'hqdefault')
  const primary = isHttpsUrl(episode.thumbnail_url) ? episode.thumbnail_url : fallback
  const [failedSrc, setFailedSrc] = useState(null)

  return (
    <img
      src={failedSrc === primary ? fallback : primary}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailedSrc(primary)}
    />
  )
}
