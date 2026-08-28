import { useGoodNewsStories, useHomeSections } from "@hooks/useHomeSections";
import type { Story } from "@/types";
import CategorySection from "./CategorySection";
import GoodNewsSection from "./GoodNewsSection";

interface HomePageProps {
  stories: Story[];
}

function HomePage(props: HomePageProps) {
  const { stories } = props;
  const sections = useHomeSections(stories);
  const goodNewsStories = useGoodNewsStories(stories);

  const sectionList = sections.map(({ category, stories: categoryStories }) => (
    <CategorySection
      key={category.slug}
      category={category}
      stories={categoryStories}
    />
  ));

  const intro = (
    <>
      <p className="max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        האתר הזה התחיל כפרויקט אישי - ניסיון לבחון איך אפשר להשתמש בבינה
        מלאכותית כדי לאסוף חדשות ממקורות שונים, ולזהות מתוכן באופן אוטומטי מה
        הסיפורים המרכזיים בכל רגע נתון. במקום לכתוב חדשות, המערכת סורקת, מנתחת
        ומסכמת - והתוצאה היא תקצירים קצרים, מאורגנים לפי נושא, שנותנים תמונת מצב
        מהירה בלי לגלול בין עשרות אתרים. משם אתם בוחרים לבד איפה להעמיק. זו לא
        כתיבה עיתונאית וזה לא מחליף עיתונות איכותית - זה ניסוי ביכולת של AI
        לארגן חדשות.
      </p>
      <p className="max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        פרויקט קטן וסקרן. העדכונים רצים אוטומטית, אבל לפעמים התהליך פשוט לא
        מופעל מסיבות טכניות - אז אם משהו נראה לא עדכני, זו הסיבה. מקווה שתמצאו
        בזה בכל זאת ערך.
      </p>
      <p className="max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        חשוב להגיד: כמו כל כלי AI, גם כאן יכולות לקרות טעויות. תתייחסו לתקצירים
        כנקודת פתיחה ולא כאמת מוחלטת - תבדקו מול המקור לפני שאתם מצטטים, משתפים
        או מסתמכים על מה שכתוב כאן.
      </p>
    </>
  );

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      {intro}
      <GoodNewsSection stories={goodNewsStories} />
      {sectionList}
    </div>
  );
}

export default HomePage;
