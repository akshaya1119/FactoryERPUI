import API from '../MasterApiHooks/api';

const getProjectProcessAndFeature = async (userId, projectId) => {
  if (!userId) {
    throw new Error('User ID not provided');
  }

  if (!projectId) {
    throw new Error('Project ID not provided');
  }

  try {
    const response = await API.get(`ProjectProcess?userId=${userId}&projectId=${projectId}`);
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error('Failed to fetch project process and feature data');
    }
  } catch (error) {
    console.error('Error fetching project process and feature:', error);
    throw error;
  }
};

const getProjectProcessByProjectAndSequence = async (projectId, sequenceId) => {
  if (!projectId) {
    throw new Error('Project ID not provided');
  }

  if (!sequenceId) {
    throw new Error('Sequence ID not provided');
  }

  try {
    const response = await API.get(`ProjectProcess/ByProjectAndSequence/${projectId}/${sequenceId}`);
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error('Failed to fetch project process data by project and sequence');
    }
  } catch (error) {
    console.error('Error fetching project process by project and sequence:', error);
    throw error;
  }
};

export { getProjectProcessAndFeature, getProjectProcessByProjectAndSequence };
