/** Row of small muted details. Each item is `[Icon, text]` (falsy items are skipped). */
export default function Meta({ items }) {
  return (
    <ul className="meta">
      {items.filter(Boolean).map(([Icon, text]) => (
        <li key={text}>
          {Icon && <Icon size={14} aria-hidden="true" />}
          {text}
        </li>
      ))}
    </ul>
  )
}
