import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'

export default function CopyButton({ text, children }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef()
  useEffect(() => () => clearTimeout(timer.current), [])

  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 2000)
  }

  const Icon = copied ? Check : Copy
  return (
    <button type="button" className="btn btn--primary" onClick={copy}>
      <Icon size={18} aria-hidden="true" />
      <span aria-live="polite">{copied ? 'Copied!' : children}</span>
    </button>
  )
}
