import { useState } from 'react'
import { CATEGORIES } from '@utils/categories'

interface HeaderProps {
  isDark: boolean
  setIsDark: (v: boolean) => void
  lastUpdated?: string
  activeCategorySlug?: string
}

function categoryLinkClass(active: boolean) {
  return active
    ? 'rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-bold text-indigo-600 underline decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-white/10 dark:text-fuchsia-300'
    : 'rounded-full px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-fuchsia-300 dark:focus-visible:ring-fuchsia-400'
}

function Header(props: HeaderProps) {
  const { isDark, setIsDark, lastUpdated, activeCategorySlug } = props
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const logo = (
    <a href="#/" className="flex items-center gap-2 sm:gap-3">
      <img
        src={`${import.meta.env.BASE_URL}assets/news_bot.jpg`}
        alt=""
        className="h-[100px] w-[100px] shrink-0 rounded-full shadow-sm"
      />
      <span className="flex flex-col gap-0.5">
        <span className="text-2xl font-extrabold tracking-tight text-indigo-600 sm:text-3xl dark:text-cyan-300 dark:[text-shadow:0_0_18px_rgba(34,211,238,0.7)]">
          סיכום חדשות AI
        </span>
        {lastUpdated && (
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            עודכן לאחרונה: {lastUpdated}
          </span>
        )}
      </span>
    </a>
  )

  const linkedinButton = (
    <button
      type="button"
      aria-label="LinkedIn"
      title="LinkedIn"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-indigo-100 bg-white text-indigo-600 shadow-sm dark:border-fuchsia-500/40 dark:bg-black/40 dark:text-fuchsia-300 dark:shadow-[0_0_10px_rgba(217,70,239,0.5)]"
    >
      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="currentColor" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.049c.476-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.114 20.452H3.558V9h3.556v11.452z" />
      </svg>
    </button>
  )

  const githubButton = (
    <button
      type="button"
      aria-label="GitHub"
      title="GitHub"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-indigo-100 bg-white text-indigo-600 shadow-sm dark:border-fuchsia-500/40 dark:bg-black/40 dark:text-fuchsia-300 dark:shadow-[0_0_10px_rgba(217,70,239,0.5)]"
    >
      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.071 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.339-2.221-.253-4.556-1.113-4.556-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.269 2.75 1.026a9.548 9.548 0 0 1 2.504-.337c.849.004 1.705.115 2.504.337 1.909-1.295 2.747-1.026 2.747-1.026.546 1.378.203 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.744 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    </button>
  )

  const themeToggleButton = (
    <button
      type="button"
      onClick={() => setIsDark(!isDark)}
      aria-label={isDark ? 'עבור למצב יום' : 'עבור למצב לילה'}
      title={isDark ? 'מצב יום' : 'מצב לילה'}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-indigo-100 bg-white text-base text-indigo-600 shadow-sm dark:border-fuchsia-500/40 dark:bg-black/40 dark:text-fuchsia-300 dark:shadow-[0_0_10px_rgba(217,70,239,0.5)]"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )

  const mobileMenuButton = (
    <button
      type="button"
      onClick={() => setMobileMenuOpen((v) => !v)}
      aria-expanded={mobileMenuOpen}
      aria-controls="mobile-category-nav"
      aria-label={mobileMenuOpen ? 'סגור תפריט קטגוריות' : 'פתח תפריט קטגוריות'}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-indigo-100 bg-white text-indigo-600 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-fuchsia-500/40 dark:bg-black/40 dark:text-fuchsia-300 dark:shadow-[0_0_10px_rgba(217,70,239,0.5)] lg:hidden"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.25}
        strokeLinecap="round"
        aria-hidden="true"
      >
        {mobileMenuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
      </svg>
    </button>
  )

  const actions = (
    <div className="flex shrink-0 items-center gap-2">
      {linkedinButton}
      {githubButton}
      {themeToggleButton}
      {mobileMenuButton}
    </div>
  )

  const categoryNav = (
    <nav aria-label="קטגוריות" className="hidden flex-1 flex-wrap items-center justify-center gap-1 px-4 lg:flex">
      {CATEGORIES.map((category) => (
        <a
          key={category.slug}
          href={`#/category/${category.slug}`}
          aria-current={category.slug === activeCategorySlug ? 'page' : undefined}
          className={categoryLinkClass(category.slug === activeCategorySlug)}
        >
          {category.label}
        </a>
      ))}
    </nav>
  )

  const mobileNav = mobileMenuOpen && (
    <nav
      id="mobile-category-nav"
      aria-label="קטגוריות"
      className="border-t border-indigo-100 bg-white px-3 py-3 dark:border-fuchsia-500/20 dark:bg-black/90 lg:hidden"
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {CATEGORIES.map((category) => (
          <a
            key={category.slug}
            href={`#/category/${category.slug}`}
            onClick={() => setMobileMenuOpen(false)}
            aria-current={category.slug === activeCategorySlug ? 'page' : undefined}
            className={`text-center ${categoryLinkClass(category.slug === activeCategorySlug)}`}
          >
            {category.label}
          </a>
        ))}
      </div>
    </nav>
  )

  return (
    <header className="sticky top-0 z-50 border-b border-indigo-100 bg-white/90 backdrop-blur-sm shadow-sm dark:border-fuchsia-500/20 dark:bg-black/80 dark:shadow-[0_0_14px_rgba(217,70,239,0.15)]">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-2 px-3 py-3 sm:px-6">
        {logo}
        {categoryNav}
        {actions}
      </div>
      {mobileNav}
    </header>
  )
}

export default Header
