type SessionData = {
  privateKey: string | null
  keyboxRawData: string | null
}

const store: SessionData = {
  privateKey: null,
  keyboxRawData: null,
}

export const SessionStore = {
  get: <K extends keyof SessionData>(key: K): SessionData[K] => store[key],
  set: <K extends keyof SessionData>(key: K, value: SessionData[K]) => { store[key] = value },
  clear: () => { store.privateKey = null; store.keyboxRawData = null },
}
