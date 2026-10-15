import { useState } from 'react'

export default function PortraitFrame() {
  const [failed, setFailed] = useState(false)

  return (
    <figure className="portrait">
      {failed ? (
        <div className="portrait__initials" role="img" aria-label="Portrait of Nyanchiew Malual">
          NM
        </div>
      ) : (
        <img src="/images/chiogong.jpeg" alt="Portrait of Nyanchiew Malual" onError={() => setFailed(true)} />
      )}
    </figure>
  )
}
