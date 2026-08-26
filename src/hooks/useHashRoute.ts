import { useEffect, useState } from 'react'

export type Route = { view: 'home' } | { view: 'category'; slug: string }

function parseHash(hash: string): Route {
  const match = hash.match(/^#\/category\/([^/]+)/)
  if (match) return { view: 'category', slug: match[1] }
  return { view: 'home' }
}

export function useHashRoute() {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return route
}
