import API from "../MasterApiHooks/api";

export const getProjectById = async (projectId) => {
  try {
    const response = await API.get(`/Project/${projectId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching project:', error);
    throw error;
  }
}

export const getAllProcesses = async () => {
  try {
    const response = await API.get('/Processes');
    return response.data;
  } catch (error) {
    console.error('Error fetching processes:', error);
    throw error;
  }
}

export const getProcessesByTypeId = async (typeid) => {
  try {
    const response = await API.get(`/PaperTypes/${typeid}/Processes`);
    return response.data;
  } catch (error) {
    console.error('Error fetching processes by typeid:', error);
    throw error;
  }
}