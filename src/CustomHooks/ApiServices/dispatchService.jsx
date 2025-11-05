import API from '../MasterApiHooks/api';

export const getAllDispatches = async (projectId, lotNo) => {
    try {
        const response = await API.get(`/Dispatch/project/${projectId}/lot/${lotNo}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching dispatches:', error);
        throw error;
    }
};

export const getDispatchById = async (id) => {
    try {
        const response = await API.get(`/Dispatch/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching dispatch ${id}:`, error);
        throw error;
    }
};

export const createDispatch = async (dispatchData) => {
    try {
        const response = await API.post('/Dispatch', dispatchData);
        return response.data;
    } catch (error) {
        console.error('Error creating dispatch:', error);
        throw error;
    }
};



export const updateDispatch = async (id, dispatchData) => {
    try {
        const response = await API.put(`/Dispatch/${id}`, dispatchData);
        return response.data;
    } catch (error) {
        console.error(`Error updating dispatch ${id}:`, error);
        throw error;
    }
};

export const deleteDispatch = async (id) => {
    try {
        await API.delete(`/Dispatch/${id}`);
    } catch (error) {
        console.error(`Error deleting dispatch ${id}:`, error);
        throw error;
    }
};
