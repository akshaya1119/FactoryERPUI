import API from "../MasterApiHooks/api";

const teamsService = {
  // Get all teams
  getAllTeams: async () => {
    try {
      const response = await API.get('/Teams');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new team
  createTeam: async (teamData) => {
    try {
      const response = await API.post('/Teams', teamData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get team by ID
  getTeamById: async (id) => {
    try {
      const response = await API.get(`/Teams/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update team
  updateTeam: async (id, teamData) => {
    try {
      const response = await API.put(`/Teams/${id}`, teamData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete team
  deleteTeam: async (id) => {
    try {
      const response = await API.delete(`/Teams/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get teams by process ID
  getTeamsByProcess: async (processId) => {
    try {
      const response = await API.get(`/Teams/Process/${processId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default teamsService;
