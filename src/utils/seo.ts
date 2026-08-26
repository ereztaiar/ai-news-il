export const SITE_TITLE = 'סיכום חדשות AI'
export const DEFAULT_DESCRIPTION =
  'סיכום חדשות ישראליות ועולמיות בעברית, נוצר אוטומטית מכמה מקורות חדשות בו-זמנית, עם קישור למקור המלא של כל כתבה.'

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

/** Updates the document title and description-related meta tags for the current view. */
export function updatePageMeta(title: string, description: string) {
  document.title = title
  setMeta('name', 'description', description)
  setMeta('property', 'og:title', title)
  setMeta('property', 'og:description', description)
  setMeta('name', 'twitter:title', title)
  setMeta('name', 'twitter:description', description)
}

/** Replaces (or creates) a JSON-LD <script> tag by id with the given structured data. */
export function updateJsonLd(id: string, data: unknown) {
  let el = document.getElementById(id) as HTMLScriptElement | null
  if (!el) {
    el = document.createElement('script')
    el.id = id
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}
