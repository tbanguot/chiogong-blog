import { useState } from 'react'
import Field from '../ui/Field'
import SubmitButton from '../ui/SubmitButton'
import { useForm } from '../../hooks/useForm'
import { supabase } from '../../lib/supabase'

export default function LoginForm({ message }) {
  const { bind, values } = useForm({ email: '', password: '' })
  const [state, setState] = useState({ loading: false, error: '' })

  async function submit(event) {
    event.preventDefault()
    setState({ loading: true, error: '' })
    let errorMessage = ''
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: values.email.trim(), password: values.password })
      if (error) errorMessage = error.code === 'invalid_credentials'
        ? 'That email or password is not correct.'
        : 'Unable to sign in right now. Please try again.'
    } catch {
      errorMessage = 'Unable to sign in. Check your connection and try again.'
    } finally {
      setState({ loading: false, error: errorMessage })
    }
  }

  return (
    <div className="login dark">
      <form className="card panel stack stack--lg" onSubmit={submit}>
        <div className="stack">
          <p className="eyebrow">Private studio</p>
          <h1>Sign in</h1>
        </div>
        {message && <p className="notice" role="alert">{message}</p>}
        <Field {...bind('email')} label="Email" type="email" autoComplete="username" required />
        <Field {...bind('password')} label="Password" type="password" autoComplete="current-password" required />
        {state.error && (
          <p className="field__error" role="alert">
            {state.error}
          </p>
        )}
        <SubmitButton loading={state.loading} loadingText="Signing in…" className="btn--lg" disabled={!values.email || !values.password}>
          Sign in
        </SubmitButton>
      </form>
    </div>
  )
}
