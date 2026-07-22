import { create } from 'zustand';

interface CollectionSheetStore {
  saveCurioId: string | null;
  openSaveSheet: (curioId: string) => void;
  closeSaveSheet: () => void;
}

export const useCollectionSheetStore = create<CollectionSheetStore>((set) => ({
  saveCurioId: null,
  openSaveSheet: (curioId) => set({ saveCurioId: curioId }),
  closeSaveSheet: () => set({ saveCurioId: null }),
}));
