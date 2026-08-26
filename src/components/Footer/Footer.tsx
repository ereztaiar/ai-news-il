function Footer() {
  const logo = (
    <img
      src={`${import.meta.env.BASE_URL}assets/news_bot.jpg`}
      alt="סיכום חדשות AI"
      className="h-[100px] w-[100px] rounded-full shadow-sm"
    />
  )

  const title = <span className="text-sm font-bold text-indigo-600 dark:text-cyan-300">סיכום חדשות AI</span>

  const disclaimer = (
    <span className="text-xs text-slate-600 dark:text-slate-300">
      התוכן מסוכם אוטומטית ואינו מהווה תחליף לכתבה המקורית
    </span>
  )

  return (
    <footer className="mt-10 border-t border-indigo-100 bg-white/60 px-3 py-6 dark:border-fuchsia-500/20 dark:bg-black/40 sm:px-6">
      <div className="mx-auto flex max-w-[1600px] flex-col items-center gap-2 text-center">
        {logo}
        {title}
        {disclaimer}
      </div>
    </footer>
  )
}

export default Footer
