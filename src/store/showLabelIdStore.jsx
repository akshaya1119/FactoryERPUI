import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useShowLabelIdStore = create(
  persist(
    (set, get) => ({
      showLabelId: false, // Default value
      toggleShowLabelId: () => set((state) => ({ showLabelId: !state.showLabelId })),
      setShowLabelId: (value) => set({ showLabelId: value }),
      getShowLabelId: () => get().showLabelId,
    }),
    {
      name: 'show-label-id-storage', // Name for the localStorage key
    }
  )
);

export default useShowLabelIdStore;
