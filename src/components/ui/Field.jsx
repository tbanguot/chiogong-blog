/** Label + control + hint/error. Renders <input> by default; use `as` for select/textarea. */
export default function Field({ label, name, id = name, as: Control = 'input', error, hint, required, options, className = '', ...props }) {
  const messageId = error || hint ? `${id}-message` : undefined

  return (
    <div className={`field ${error ? 'has-error' : ''} ${className}`}>
      <label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <Control
        id={id}
        name={name}
        aria-required={required || undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={messageId}
        {...props}
      >
        {options?.map((option) => {
          const { value, label: text } = typeof option === 'string' ? { value: option, label: option } : option
          return (
            <option key={value} value={value}>
              {text}
            </option>
          )
        })}
      </Control>
      {(error || hint) && (
        <p id={messageId} className={error ? 'field__error' : 'field__hint'} role={error ? 'alert' : undefined}>
          {error || hint}
        </p>
      )}
    </div>
  )
}
