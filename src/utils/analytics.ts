declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

function trackLinkClick(link: HTMLAnchorElement) {
  if (!window.gtag) return

  const url = new URL(link.href, window.location.href)
  const outbound = url.origin !== window.location.origin

  window.gtag('event', 'click', {
    link_url: link.href,
    link_text: link.textContent?.trim().slice(0, 100) || undefined,
    outbound,
  })
}

export function initLinkClickTracking() {
  document.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof Element)) return
    const link = target.closest('a[href]')
    if (link instanceof HTMLAnchorElement) trackLinkClick(link)
  })
}
