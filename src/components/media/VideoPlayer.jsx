import { youtubeEmbedUrl } from '../../utils/youtube'

/** Responsive player. */
export default function VideoPlayer({ videoId, title }) {
  const src = youtubeEmbedUrl(videoId)
  return (
    <div className="video">
      {src ? (
        <iframe
          key={videoId}
          src={src}
          title={title}
          loading="lazy"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : <p className="notice">This video is unavailable.</p>}
    </div>
  )
}
