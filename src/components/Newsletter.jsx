import { useState } from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import Honeypot from './ui/Honeypot'
import SubmitButton from './ui/SubmitButton'
import { postJSON } from '../lib/api'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [status, setStatus] = useState({ state: 'idle' }) // idle | loading | done | error

  async function handleSubmit(event) {
    event.preventDefault()
    setStatus({ state: 'loading' })
    try {
      await postJSON('/api/subscribe', { email, website })
      setStatus({ state: 'done' })
    } catch (error) {
      setStatus({ state: 'error', message: error.message })
    }
  }

  return (
    <section className="newsletter dark" aria-labelledby="newsletter-title">
      <div className="stack">
        <h2 id="newsletter-title">Never miss an episode</h2>
        <p>Get latest episodes and story notes in your inbox.</p>
      </div>

      {status.state === 'done' ? (
        <p className="newsletter__done" role="status">
          <CheckCircle2 aria-hidden="true" /> You’re on the list. Thank you!
        </p>
      ) : (
        <form className="stack" onSubmit={handleSubmit} noValidate>
          <div className="newsletter__field">
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={status.state === 'error'}
              required
            />
            <Honeypot value={website} onChange={setWebsite} />
            <SubmitButton loading={status.state === 'loading'} loadingText="Joining…">
              Subscribe <ArrowRight size={18} aria-hidden="true" />
            </SubmitButton>
          </div>
          {status.message && (
            <p className="field__error" role="alert">
              {status.message}
            </p>
          )}
        </form>
      )}
    </section>
  )
}
