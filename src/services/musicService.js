import axios from 'axios';

const API_URL = "";

export const musicService = {
  getMusicById: async (musicId) => {
    try {
      const response = await axios.get(`${API_URL}/musics${musicId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching music:', error);
      throw error;
    }
  }
}; 