type SessionData = {
  privateKey: string | null
  keyboxRawData: string | null
}

type SessionDataKey = keyof SessionData

export const SessionStore = {
  get: <K extends SessionDataKey>(key: K): SessionData[K] => {
    if (typeof window === 'undefined') return null as SessionData[K]
    const value = sessionStorage.getItem(key)
    return (value ?? null) as SessionData[K]
  },
  set: <K extends SessionDataKey>(key: K, value: SessionData[K]) => {
    if (typeof window === 'undefined') return
    if (value === null) {
      sessionStorage.removeItem(key)
    } else {
      sessionStorage.setItem(key, value as string)
    }
  },
  clear: () => {
    if (typeof window === 'undefined') return
    sessionStorage.removeItem('privateKey')
    sessionStorage.removeItem('keyboxRawData')
  },
}
