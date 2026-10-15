import { supabase } from './supabase'

/** fetch → JSON. Throws an Error (with `.fields` for validation errors) on non-2xx responses. */
async function request(url, options) {
  const response = await fetch(url, options)
  let data
  try {
    data = await response.json()
  } catch {
    throw new Error('Something went wrong. Please try again.')
  }
  if (!response.ok) {
    throw Object.assign(new Error(data?.error || 'Something went wrong. Please try again.'), { fields: data?.fields })
  }
  return data
}

export const getJSON = (url, signal) => request(url, { signal })

export const postJSON = (url, body) =>
  request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body && JSON.stringify(body),
  })

/** Unwraps a Supabase query: resolves with the data, throws on error. */
export const db = (query) =>
  query.then(({ data, error }) => {
    if (error) throw error
    return data
  })

/** Insert a row, or update it when `id` is given. */
export const saveRow = (table, payload, id) => {
  const rows = supabase.from(table)
  return db(id ? rows.update(payload).eq('id', id) : rows.insert(payload))
}
