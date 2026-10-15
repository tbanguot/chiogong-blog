import { useCallback, useEffect, useState } from 'react'

/**
 * Runs `load(signal)` whenever `deps` change and tracks loading / error / data.
 * `deps` must be JSON-serialisable (strings, numbers, booleans).
 */
export function useAsync(load, deps = []) {
  const [version, setVersion] = useState(0)
  const [result, setResult] = useState({ key: null })
  const key = JSON.stringify([...deps, version])

  useEffect(() => {
    const controller = new AbortController()
    const settle = (next) => !controller.signal.aborted && setResult({ key, ...next })
    Promise.resolve().then(() => load(controller.signal)).then((data) => settle({ data }), (error) => settle({ error }))
    return () => controller.abort()
    // `load` is intentionally omitted: `key` already captures every input that matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const loading = result.key !== key
  const reload = useCallback(() => setVersion((value) => value + 1), [])
  return { data: loading ? undefined : result.data, error: loading ? undefined : result.error, loading, reload }
}
