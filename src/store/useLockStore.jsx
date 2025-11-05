import create from 'zustand';

const useLockStore = create((set) => ({
  lockStatus: false,
  setLockStatus: (status) => set({ lockStatus: status }),
  getLockStatus: () => ({ lockStatus }),
}));

export default useLockStore;