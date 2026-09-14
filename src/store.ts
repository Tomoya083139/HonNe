import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AnswerRecord, Mode, SessionRecord } from './types'

interface Profile {
  onboarded: boolean
  mode: Mode
  names: [string, string] // 恋人モードで使う2人の名前
  friends: string[] // 友達モードの参加者（2〜8人）
  showEnglish: boolean
  adult: boolean // 16+ カードを出す
}

interface State {
  profile: Profile
  seen: Record<string, string[]> // deckId -> cardIds
  favorites: string[]
  answers: AnswerRecord[]
  sessions: SessionRecord[]

  setProfile: (p: Partial<Profile>) => void
  markSeen: (deckId: string, cardId: string) => void
  resetSeen: (deckId: string) => void
  toggleFavorite: (cardId: string) => void
  saveAnswer: (a: AnswerRecord) => void
  startSession: (s: SessionRecord) => void
  updateSession: (id: string, patch: Partial<SessionRecord>) => void
  clearAll: () => void
}

const initial = {
  profile: {
    onboarded: false,
    mode: 'couple' as Mode,
    names: ['', ''] as [string, string],
    friends: [] as string[],
    showEnglish: true,
    adult: false,
  },
  seen: {},
  favorites: [],
  answers: [],
  sessions: [],
}

export const useStore = create<State>()(
  persist(
    (set) => ({
      ...initial,
      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      markSeen: (deckId, cardId) =>
        set((s) => {
          const list = s.seen[deckId] ?? []
          if (list.includes(cardId)) return s
          return { seen: { ...s.seen, [deckId]: [...list, cardId] } }
        }),
      resetSeen: (deckId) => set((s) => ({ seen: { ...s.seen, [deckId]: [] } })),
      toggleFavorite: (cardId) =>
        set((s) => ({
          favorites: s.favorites.includes(cardId)
            ? s.favorites.filter((id) => id !== cardId)
            : [...s.favorites, cardId],
        })),
      saveAnswer: (a) =>
        set((s) => {
          // 同じカードの直近の回答は上書き（同セッション内の編集想定）
          const idx = s.answers.findIndex((x) => x.cardId === a.cardId && x.at === a.at)
          if (idx >= 0) {
            const next = s.answers.slice()
            next[idx] = { ...next[idx], ...a }
            return { answers: next }
          }
          return { answers: [...s.answers, a] }
        }),
      startSession: (rec) =>
        set((s) => (s.sessions.some((x) => x.id === rec.id) ? s : { sessions: [...s.sessions, rec] })),
      updateSession: (id, patch) =>
        set((s) => ({
          sessions: s.sessions.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      clearAll: () => set({ ...initial }),
    }),
    {
      name: 'honne-v1',
      // 旧バージョンの保存データに friends がない場合の補完
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>
        return { ...current, ...p, profile: { ...current.profile, ...(p.profile ?? {}) } }
      },
    },
  ),
)
