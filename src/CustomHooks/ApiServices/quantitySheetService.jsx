import API from "../MasterApiHooks/api";

const quantitySheetService = {
  // Create new quantity sheets (accepts array of quantity sheets)
  createQuantitySheets: async (quantitySheets) => {
    try {
      const response = await API.post('/QuantitySheet', quantitySheets);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update existing quantity sheet
  updateQuantitySheet: async (id, quantitySheet) => {
    try {
      const response = await API.put(`/QuantitySheet/${id}`, quantitySheet);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete quantity sheet
  deleteQuantitySheet: async (id) => {
    try {
      const response = await API.delete(`/QuantitySheet/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get lots by project ID
  getLots: async (projectId) => {
    try {
      const response = await API.get('/QuantitySheet/Lots', {
        params: { ProjectId: projectId }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get columns
  getColumns: async () => {
    try {
      const response = await API.get('/QuantitySheet/Columns');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get catch by project ID and lot number
  getCatch: async (projectId, lotNo) => {
    try {
      const response = await API.get('/QuantitySheet/Catch', {
        params: {
          ProjectId: projectId,
          lotNo: lotNo
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get catch by project ID
  getCatchByProject: async (projectId) => {
    try {
      const response = await API.get('/QuantitySheet/CatchByproject', {
        params: { ProjectId: projectId }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Check all quantity sheets
  checkAllQuantitySheets: async () => {
    try {
      const response = await API.get('/QuantitySheet/check-all-quantity-sheets');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default quantitySheetService;

