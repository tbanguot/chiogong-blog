import { Loader2 } from 'lucide-react'

/** Primary submit button with a built-in loading state. */
export default function SubmitButton({ loading, loadingText = 'Sending…', children, className = '', ...props }) {
  return (
    <button type="submit" className={`btn btn--primary ${className}`} disabled={loading} {...props}>
      {loading ? (
        <>
          <Loader2 size={18} className="spin" aria-hidden="true" /> {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  )
}
