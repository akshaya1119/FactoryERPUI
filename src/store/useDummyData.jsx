import create from 'zustand';
import DummyData from "./dummyData.json"

const useDummyData = create((set) => ({
  projectData: DummyData, // Remove the array wrapper
  setDummyData: (data) => set({ projectData: data }),
  updateDummyData: (updatedData) => set((state) => ({ projectData: updatedData })),
}));

export default useDummyData;