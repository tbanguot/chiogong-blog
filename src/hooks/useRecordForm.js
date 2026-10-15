import { useState } from 'react'
import { focusFirstError, hasErrors } from '../utils/validation'
import { saveRow } from '../lib/api'
import { useForm } from './useForm'

/**
 * Shared create/edit flow for the Studio forms: validate → save → toast.
 * Insert when `record` is empty, update when editing.
 */
export function useRecordForm({ table, noun, record, initial, validate, toPayload, notify, onSaved }) {
  const form = useForm(initial)
  const [saving, setSaving] = useState(false)

  async function submit(event) {
    event.preventDefault()
    const errors = validate(form.values)
    form.setErrors(errors)
    if (hasErrors(errors)) return focusFirstError(errors)

    setSaving(true)
    try {
      await saveRow(table, toPayload(form.values), record?.id)
      notify('success', `${noun} ${record ? 'updated' : 'published'}.`)
      onSaved()
    } catch (error) {
      if (error.code === '23505') form.setErrors({ slug: 'That URL slug is already in use.' })
      else notify('error', error.message)
    } finally {
      setSaving(false)
    }
  }

  return { form, saving, submit }
}
