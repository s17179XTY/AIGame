import { create } from 'zustand'
import type { StoryEntry, WorldState, NewCharacterRequest, ImageTrigger } from '../../../main/services/types'

interface GameStore {
  entries: StoryEntry[]
  worldState: WorldState | null
  isProcessing: boolean
  pendingNewCharacters: NewCharacterRequest[]
  currentImagePath: string | null
  isGeneratingImage: boolean

  addEntry: (entry: StoryEntry) => void
  addEntries: (entries: StoryEntry[]) => void
  setWorldState: (state: WorldState | null) => void
  setProcessing: (v: boolean) => void
  setPendingNewCharacters: (chars: NewCharacterRequest[]) => void
  setCurrentImagePath: (path: string | null) => void
  setGeneratingImage: (v: boolean) => void
  clear: () => void
}

export const useGameStore = create<GameStore>((set) => ({
  entries: [],
  worldState: null,
  isProcessing: false,
  pendingNewCharacters: [],
  currentImagePath: null,
  isGeneratingImage: false,

  addEntry: (entry) => set((s) => ({ entries: [...s.entries, entry] })),
  addEntries: (entries) => set((s) => ({ entries: [...s.entries, ...entries] })),
  setWorldState: (worldState) => set({ worldState }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setPendingNewCharacters: (pendingNewCharacters) => set({ pendingNewCharacters }),
  setCurrentImagePath: (currentImagePath) => set({ currentImagePath }),
  setGeneratingImage: (isGeneratingImage) => set({ isGeneratingImage }),
  clear: () =>
    set({
      entries: [],
      worldState: null,
      isProcessing: false,
      pendingNewCharacters: [],
      currentImagePath: null,
      isGeneratingImage: false,
    }),
}))