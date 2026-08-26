import CategoryPage from '@components/CategoryPage'
import Footer from '@components/Footer'
import Header from '@components/Header'
import HomePage from '@components/HomePage'
import { useDarkMode } from '@hooks/useDarkMode'
import { useHashRoute } from '@hooks/useHashRoute'
import { useLastUpdated } from '@hooks/useLastUpdated'
import { useNewsStories } from '@hooks/useNewsStories'
import { useRouteSeo } from '@hooks/useRouteSeo'

function App() {
  const [isDark, setIsDark] = useDarkMode()
  const route = useHashRoute()
  const { stories, error } = useNewsStories()
  const lastUpdated = useLastUpdated(stories)
  useRouteSeo(route, stories)

  const errorMessage = error && (
    <p className="px-1 text-red-600 dark:text-red-400">שגיאה בטעינת החדשות: {error}</p>
  )

  const emptyMessage = !error && stories.length === 0 && (
    <p className="px-1 text-slate-500 dark:text-slate-400">אין עדכונים עדיין.</p>
  )

  const page = !error && stories.length > 0 && (
    route.view === 'category' ? (
      <CategoryPage stories={stories} categorySlug={route.slug} />
    ) : (
      <HomePage stories={stories} />
    )
  )

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f5fc] text-slate-900 dark:bg-[#06020f] dark:text-slate-100">
      <Header
        isDark={isDark}
        setIsDark={setIsDark}
        lastUpdated={lastUpdated}
        activeCategorySlug={route.view === 'category' ? route.slug : undefined}
      />

      <main className="mx-auto w-full max-w-[1600px] flex-1 overflow-x-hidden px-3 py-5 sm:px-6 sm:py-8">
        {errorMessage}
        {emptyMessage}
        {page}
      </main>

      <Footer />
    </div>
  )
}

export default App
