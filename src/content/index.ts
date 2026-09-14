import type { Deck, Mode } from '../types'

const modules = import.meta.glob<Deck>('./decks/*/*.json', {
  eager: true,
  import: 'default',
})

export const DECKS: Deck[] = Object.keys(modules)
  .sort()
  .map((k) => modules[k])

export const decksByMode = (mode: Mode) => DECKS.filter((d) => d.mode === mode)
export const findDeck = (id: string) => DECKS.find((d) => d.id === id)
export const findCard = (cardId: string) => {
  for (const d of DECKS) {
    const c = d.cards.find((c) => c.id === cardId)
    if (c) return { deck: d, card: c }
  }
  return undefined
}
