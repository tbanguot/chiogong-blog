/** Single-choice filter buttons (used for categories and content types). */
export default function Pills({ options, value, onChange, label }) {
  return (
    <div className="pills" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className="pill"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
