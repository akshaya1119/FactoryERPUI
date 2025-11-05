import { create } from 'zustand';
const themeStore = create((set, get) => ({
  theme: localStorage.getItem('app-theme') || 'default', // Initialize from localStorage or fallback to 'default'

  setTheme: (newTheme) => {
    set({ theme: newTheme });
    localStorage.setItem('app-theme', newTheme); // Save to localStorage
  },

  getCssClasses: () => {
    const theme = get().theme; // Access the theme state using get()
    switch (theme) {
      case 'Red':
        return ['red-dark', 'red-mid', 'red-light', 'red-btn', 'red-dark-text', 'red-light-text', 'red-light-border', 'red-dark-border', 'thead-red'];
      case 'Blue':
        return ['blue-dark', 'blue-mid', 'blue-light', 'blue-btn', 'blue-dark-text', 'blue-light-text', 'blue-light-border', 'blue-dark-border', 'thead-blue'];
      case 'Green':
        return ['green-dark', 'green-mid', 'green-light', 'green-btn', 'green-dark-text', 'green-light-text', 'green-light-border', 'green-dark-border', 'thead-green'];
      case 'Purple':
        return ['purple-dark', 'purple-mid', 'purple-light', 'purple-btn', 'purple-dark-text', 'purple-light-text', 'purple-light-border', 'purple-dark-border', 'thead-purple'];
      case 'Dark':
        return ['dark-dark', 'dark-mid', 'dark-light', 'dark-btn', 'dark-dark-text ', 'dark-light-text ', 'dark-light-border', 'dark-dark-border', 'thead-light'];
      case 'Brown':
        return ['brown-dark', 'brown-mid', 'brown-light', 'brown-btn', 'brown-dark-text ', 'brown-light-text ', 'brown-light-border', 'brown-dark-border', 'thead-brown'];
      case 'Pink':
        return ['pink-dark', 'pink-mid', 'pink-light', 'pink-btn', 'pink-dark-text ', 'pink-light-text ', 'pink-light-border', 'pink-dark-border', 'thead-pink'];
      case 'Light':
        return ['light-dark', 'light-mid', 'light-light', 'light-btn', 'light-dark-text ', 'light-light-text ', 'light-light-border', 'light-dark-border', 'thead-light'];
      default:
        return ['default-dark', 'default-mid', 'default-light', 'default-btn', 'default-dark-text', 'default-light-text', 'default-light-border', 'default-dark-border', 'thead-default'];
    }
  },
}));

export default themeStore;
