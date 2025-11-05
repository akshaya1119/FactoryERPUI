// useBreadcrumbStore.js
import { create } from 'zustand';

const useBreadcrumbStore = create((set) => ({
  breadcrumbItems: [],
  setCurrentPage: (pageTitle, pageUrl) =>
    set((state) => ({
      breadcrumbItems: [...state.breadcrumbItems, { label: pageTitle, href: pageUrl }],
    })),
  resetBreadcrumb: () => set({ breadcrumbItems: [] }),
}));

export default useBreadcrumbStore;

// import { create } from 'zustand';

// const useBreadcrumbStore = create((set) => ({
//   breadcrumbItems: [],
  
//   // Function to set the current page's breadcrumb, replacing existing breadcrumbs if on the same path
//   setCurrentPage: (pageTitle, pageUrl) =>
//     set((state) => {
//       // Check if the breadcrumb item already exists to prevent duplicates
//       const existingItemIndex = state.breadcrumbItems.findIndex(item => item.href === pageUrl);
      
//       if (existingItemIndex !== -1) {
//         // If item exists, update the breadcrumb item
//         const updatedBreadcrumbItems = state.breadcrumbItems.map((item, index) => 
//           index === existingItemIndex ? { label: pageTitle, href: pageUrl } : item
//         );
//         return { breadcrumbItems: updatedBreadcrumbItems };
//       }
      
//       // If the item does not exist, append it to the list
//       return {
//         breadcrumbItems: [...state.breadcrumbItems, { label: pageTitle, href: pageUrl }],
//       };
//     }),
  
//   // Function to reset the breadcrumb items
//   resetBreadcrumb: () => set({ breadcrumbItems: [] }),

//   // Optional: Function to remove a specific breadcrumb by URL
//   removeBreadcrumb: (pageUrl) =>
//     set((state) => ({
//       breadcrumbItems: state.breadcrumbItems.filter(item => item.href !== pageUrl),
//     })),
// }));

// export default useBreadcrumbStore;
