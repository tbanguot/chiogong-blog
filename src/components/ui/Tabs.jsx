/** Accessible tab list (arrow-key navigation). Pair each tab with a <TabPanel id=…>. */
export default function Tabs({ tabs, value, onChange, label }) {
  function onKeyDown(event) {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key]
    if (!step) return
    event.preventDefault()
    const index = tabs.findIndex((tab) => tab.id === value)
    const next = tabs[(index + step + tabs.length) % tabs.length]
    onChange(next.id)
    document.getElementById(`tab-${next.id}`)?.focus()
  }

  return (
    <div className="tabs" role="tablist" aria-label={label} onKeyDown={onKeyDown}>
      {tabs.map(({ id, label: text, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          id={`tab-${id}`}
          aria-selected={id === value}
          aria-controls={`panel-${id}`}
          tabIndex={id === value ? 0 : -1}
          className="tab"
          onClick={() => onChange(id)}
        >
          {Icon && <Icon size={18} aria-hidden="true" />}
          {text}
        </button>
      ))}
    </div>
  )
}

export function TabPanel({ id, hidden, children }) {
  return (
    <div role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`} hidden={hidden}>
      {children}
    </div>
  )
}
