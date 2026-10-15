import { useEffect, useState } from 'react'
import Dashboard from '../components/admin/Dashboard'
import LoginForm from '../components/admin/LoginForm'
import { usePageMeta } from '../hooks/usePageMeta'
import { supabase } from '../lib/supabase'

/** Private route (/nyanchiew-studio): not linked anywhere and marked noindex while mounted. */
export default function AdminStudio() {
  usePageMeta({ title: 'Studio', robots: 'noindex, nofollow' })
  const [auth, setAuth] = useState({ session: undefined, version: 0, error: '' })
  const [access, setAccess] = useState({ version: -1, allowed: false, error: '' })
  const [signingOut, setSigningOut] = useState(false)
  const { session, version } = auth

  useEffect(() => {
    let active = true
    let receivedEvent = false
    const publish = (next, error = '') => {
      if (active) setAuth((previous) => ({ session: next, version: previous.version + 1, error }))
    }
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      // Keep this callback synchronous: Supabase requests here can lock auth.
      receivedEvent = true
      publish(next)
    })
    supabase.auth.getSession().then(({ data, error }) => {
      if (receivedEvent) return
      publish(error ? null : data.session, error ? 'We could not restore your session. Please sign in again.' : '')
    }).catch(() => {
      if (!receivedEvent) publish(null, 'We could not restore your session. Please sign in again.')
    })
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session) return
    let active = true
    const controller = new AbortController()
    const errorMessage = 'We could not verify studio access. Please try again later or contact the site owner.'
    const settle = (allowed, error = '') => {
      if (active) setAccess({ version, allowed, error })
    }
    const timeout = setTimeout(() => {
      settle(false, errorMessage)
      controller.abort()
    }, 10_000)

    async function verifyAccess() {
      try {
        const { data, error } = await supabase.rpc('is_studio_admin').abortSignal(controller.signal)
        if (!controller.signal.aborted) settle(!error && data === true, error ? errorMessage : '')
      } catch {
        if (!controller.signal.aborted) settle(false, errorMessage)
      } finally {
        clearTimeout(timeout)
      }
    }
    verifyAccess()
    return () => {
      active = false
      clearTimeout(timeout)
      controller.abort()
    }
  }, [session, version])

  async function signOut() {
    setSigningOut(true)
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' })
      if (error) throw error
      setAuth((previous) => ({ session: null, version: previous.version + 1, error: '' }))
    } catch {
      setAccess({ version, allowed: false, error: 'We could not sign you out. Please try again.' })
    } finally {
      setSigningOut(false)
    }
  }

  if (session === undefined) return <p className="container section" role="status">Loading…</p>
  if (!session) return <LoginForm message={auth.error} />
  if (access.version !== version) return <p className="container section" role="status">Checking studio access…</p>
  if (access.allowed) return <Dashboard session={session} />
  return (
    <div className="login dark">
      <div className="card panel stack stack--lg">
        <h1>Studio access</h1>
        <p role="alert">{access.error || 'This account does not have access to the studio. Contact the site owner to request access.'}</p>
        <button type="button" className="btn btn--lg" onClick={signOut} disabled={signingOut}>
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </div>
  )
}
