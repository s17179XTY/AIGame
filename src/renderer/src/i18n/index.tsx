import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import zhTW from './zh-TW'
import en from './en'
import ja from './ja'

type Lang = 'zh-TW' | 'en' | 'ja'

const messages: Record<Lang, Record<string, any>> = { 'zh-TW': zhTW, en, ja }

function getNested(obj: any, path: string): string {
  const keys = path.split('.')
  let current = obj
  for (const key of keys) {
    if (current == null) return path
    current = current[key]
  }
  return typeof current === 'string' ? current : path
}

interface I18nContextType {
  t: (key: string) => string
  lang: Lang
  setLang: (lang: Lang) => void
}

const I18nContext = createContext<I18nContextType>({
  t: (k) => k,
  lang: 'zh-TW',
  setLang: () => {},
})

export function I18nProvider({ children, initialLang, onLangChange }: {
  children: React.ReactNode
  initialLang: Lang
  onLangChange?: (lang: Lang) => void
}) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang)
    onLangChange?.(newLang)
  }, [onLangChange])

  useEffect(() => {
    setLangState(initialLang)
  }, [initialLang])

  const t = useCallback((key: string) => {
    return getNested(messages[lang], key)
  }, [lang])

  return (
    <I18nContext.Provider value={{ t, lang, setLang }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}