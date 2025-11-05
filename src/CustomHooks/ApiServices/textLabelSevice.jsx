import API from '../MasterApiHooks/api';

export const fetchTextLabels = async () => {
  try {
    const response = await API.get('/TextLabels');
    return response.data;
  } catch (error) {
    console.error('Error fetching TextLabels:', error);
    throw error;
  }
};

export const addTextLabel = async (textLabel) => {
  try {
    const response = await API.post('/TextLabels', textLabel);
    return response.data;
  } catch (error) {
    console.error('Error adding TextLabel:', error);
    throw error;
  }
};

export const updateTextLabel = async (textLabelId, textLabel) => {
  try {
    const response = await API.put(`/TextLabels/${textLabelId}`, textLabel);
    return response.data;
  } catch (error) {
    console.error('Error updating TextLabel:', error);
    throw error;
  }
};

export const deleteTextLabel = async (textLabelId) => {
  try {
    const response = await API.delete(`/TextLabels/${textLabelId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting TextLabel:', error);
    throw error;
  }
};

export const getTextLabelById = async (textLabelId) => {
  try {
    const response = await API.get(`/TextLabels/${textLabelId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching TextLabel by ID:', error);
    throw error;
  }
};

export const textByLanguage = async (language) => {
  try {
    const response = await API.get(`/TextLabels/translations/${language}`);
    return response;
  } catch (error) {
    console.error('Error updating TextLabel:', error);
    throw error;
  }
};