export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Returns `{ field: message }` for every listed field that is empty. */
export function missing(values, messages) {
  const errors = {}
  for (const [field, message] of Object.entries(messages)) {
    if (!String(values[field] ?? '').trim()) errors[field] = message
  }
  return errors
}

export const hasErrors = (errors) => Object.values(errors).some(Boolean)

/** Focus the first invalid field (field ids are `prefix + name`). */
export const focusFirstError = (errors, prefix = '') =>
  document.getElementById(prefix + Object.keys(errors).find((key) => errors[key]))?.focus()
