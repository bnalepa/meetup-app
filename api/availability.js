const axios = require('axios');
const https = require('https');

const apiClient = axios.create({
  baseURL: 'https://localhost:7001',
  headers: {
    'Content-Type': 'application/json',
  },
  httpsAgent: new https.Agent({ rejectUnauthorized: false }) // Ignorowanie certyfikatu SSL
});


async function getUserAvailability(userId) {
  try {
      const response = await apiClient.get(`/users/${userId}/availabilities`);
      console.log(response)
      return response.data;
  } catch (error) {
      console.error('Error fetching user availability:', error.message);
      throw error; // Rzuć błąd, aby można było go obsłużyć w `app.js`
  }
}


module.exports = {
  apiClient,
  getUserAvailability
};
