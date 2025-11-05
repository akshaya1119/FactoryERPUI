import { create } from 'zustand';

const CURRENT_PROCESS_KEY = 'currentProcess';

const useCurrentProcessStore = create((set) => {
  // Retrieve the current process from local storage
  const storedProcess = JSON.parse(localStorage.getItem(CURRENT_PROCESS_KEY));

  return {
    processId: storedProcess?.processId || null,
    processName: storedProcess?.processName || null,

    actions: {
      setProcess: (processId, name, isManualToggle = false) => {
        set({ processId, processName: name });
        if (isManualToggle) {
          localStorage.setItem(CURRENT_PROCESS_KEY, JSON.stringify({ processId, processName: name }));
        }
        
        // Handle Paper Details column visibility
        const columnVisibility = JSON.parse(localStorage.getItem('columnVisibility') || '{}');
        if (processId !== 8) {
          columnVisibility['Paper Details'] = false;
          localStorage.setItem('columnVisibility', JSON.stringify(columnVisibility));
        }
      },

      clearProcess: () => {
        set({ 
          processId: null, 
          processName: null
        });
        localStorage.removeItem(CURRENT_PROCESS_KEY);
      },
    },
  };
});

export const useCurrentProcess = () => {
  const state = useCurrentProcessStore();
  return {
    processId: state.processId,
    processName: state.processName,
  };
};

export const useCurrentProcessActions = () => useCurrentProcessStore((state) => state.actions);

export default useCurrentProcessStore;
