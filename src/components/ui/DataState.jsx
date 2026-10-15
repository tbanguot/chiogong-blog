/**
 * Handles the three states every data view shares:
 * loading skeletons, an error message, and an empty message (pass `empty` to enable it).
 */
export default function DataState({ loading, error, empty, skeletons = 6, children }) {
  if (loading) {
    return (
      <div className="cards" role="status" aria-label="Loading">
        {Array.from({ length: skeletons }, (_, index) => (
          <div key={index} className="card" aria-hidden="true">
            <div className="skeleton skeleton--media" />
            <div className="card__body">
              <div className="skeleton" />
              <div className="skeleton skeleton--short" />
            </div>
          </div>
        ))}
      </div>
    )
  }
  if (error) {
    return (
      <p className="notice" role="alert">
        We couldn’t load this right now. Please refresh the page and try again.
      </p>
    )
  }
  if (empty) {
    return (
      <div className="empty">
        <h2>{empty.title}</h2>
        <p>{empty.text}</p>
        {empty.action}
      </div>
    )
  }
  return children
}
