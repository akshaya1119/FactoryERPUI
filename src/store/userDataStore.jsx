import { create } from 'zustand';
import { getLoggedUser } from '../CustomHooks/ApiServices/userService';

// Define the storage key as a constant
const USER_DATA_KEY = 'userData';

const useUserDataStore = create((set, get) => ({
  userData: JSON.parse(localStorage.getItem(USER_DATA_KEY)) || null,
  loading: false,
  error: null,

  actions: {
    fetchUserData: async () => {
      if (!get().userData) {
        set({ loading: true });
        try {
          const response = await getLoggedUser();
          set({ userData: response, loading: false, error: null });
          localStorage.setItem(USER_DATA_KEY, JSON.stringify(response));
        } catch (error) {
          set({ error: error.message, loading: false });
        }
      }
    },

    refreshUserData: async () => {
      set({ loading: true });
      try {
        const response = await getLoggedUser();
        set({ userData: response, loading: false, error: null });
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(response));
      } catch (error) {
        set({ error: error.message, loading: false });
      }
    },

    updateUserData: async (updatedData) => {
      set({ loading: true });
      try {
        // Placeholder for updating user data, as userService doesn't have an update method
        await get().actions.refreshUserData();
      } catch (error) {
        set({ error: error.message, loading: false });
      }
    },

    clearUserData: () => {
      set({ userData: null, error: null });
      localStorage.removeItem(USER_DATA_KEY);
    },
  },
}));

export const useUserData = () => useUserDataStore((state) => state.userData);
export const useUserDataActions = () => useUserDataStore((state) => state.actions);

export default useUserDataStore;
