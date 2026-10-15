import { Search } from 'lucide-react'

export default function SearchInput({ id, label, ...props }) {
  return (
    <div className="search">
      <Search size={18} aria-hidden="true" />
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input id={id} type="search" autoComplete="off" {...props} />
    </div>
  )
}
