/** Standard heading block for inner pages. */
export default function PageHero({ eyebrow, title, children }) {
  return (
    <header className="page-hero">
      <div className="container stack">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {children && <p className="lede">{children}</p>}
      </div>
    </header>
  )
}
