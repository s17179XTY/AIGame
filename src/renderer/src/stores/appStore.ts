import { create } from 'zustand'

interface AppStore {
  currentPage: 'home' | 'world-create' | 'world-edit' | 'world-preview' | 'game' | 'settings' | 'story-log'
  selectedWorldId: string | null
  setPage: (page: AppStore['currentPage']) => void
  selectWorld: (id: string | null) => void
}

export const useAppStore = create<AppStore>((set) => ({
  currentPage: 'home',
  selectedWorldId: null,
  setPage: (page) => set({ currentPage: page }),
  selectWorld: (id) => set({ selectedWorldId: id }),
}))