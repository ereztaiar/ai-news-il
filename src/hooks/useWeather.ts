import { useEffect, useState } from 'react'

interface Weather {
  temperature: number
  code: number
}

// Tel Aviv — the site's main audience. Open-Meteo requires no API key and
// allows CORS from the browser, so this is fetched client-side rather than
// through the (key-less, cron-driven) content pipeline.
const LATITUDE = 32.0853
const LONGITUDE = 34.7818

export function useWeather() {
  const [weather, setWeather] = useState<Weather | null>(null)

  useEffect(() => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}&current=temperature_2m,weather_code&timezone=Asia%2FJerusalem`
    fetch(url)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`weather request failed (${res.status})`))))
      .then((data) => {
        setWeather({
          temperature: Math.round(data.current.temperature_2m),
          code: data.current.weather_code,
        })
      })
      .catch(() => setWeather(null))
  }, [])

  return weather
}
