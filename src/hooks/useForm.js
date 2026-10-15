import { useCallback, useState } from 'react'

/** Form state + per-field props for <Field />. `prefix` keeps ids unique when several forms share a page. */
export function useForm(initial, prefix = '') {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})

  const set = useCallback((name, value) => {
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current))
  }, [])

  const bind = (name) => ({
    name,
    id: prefix + name,
    value: values[name] ?? '',
    error: errors[name],
    onChange: (event) => set(name, event.target.value),
  })

  const reset = () => {
    setValues(initial)
    setErrors({})
  }

  return { values, errors, setErrors, set, bind, reset }
}
