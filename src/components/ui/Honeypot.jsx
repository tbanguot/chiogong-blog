/** Hidden anti-spam field. People never see it; bots fill it in. The API ignores those submissions. */
export default function Honeypot({ value, onChange }) {
  return (
    <input
      type="text"
      name="website"
      className="hp"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}
