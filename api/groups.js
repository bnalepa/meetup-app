const axios = require('axios');
const https = require('https');

const apiClient = axios.create({
  baseURL: 'https://localhost:7001',
  headers: {
    'Content-Type': 'application/json',
  },
  httpsAgent: new https.Agent({ rejectUnauthorized: false }) // Ignorowanie certyfikatu SSL
});

// Funkcja do pobierania grup
async function getGroups() {
  try {
    const response = await apiClient.get('/groups');
    return response.data;
  } catch (error) {
    console.error('Błąd podczas pobierania grup:', error.message);
    throw error;
  }
}

async function getGroupInfo(groupId) {
  try {
    const response = await apiClient.get(`/groups/${groupId}`);
    const groupName = response.data.name;
    return groupName;
  } catch (error) {
    console.error('Błąd podczas pobierania informacji o grupie:', error.message);
    throw error;
  }
}

// Funkcja do pobierania wydarzeń dla danej grupy
async function getGroupEvents(groupId) {
  try {
      const response = await apiClient.get(`/groups/${groupId}/events`);
      return response.data;
  } catch (error) {
    console.error('Błąd podczas pobierania wydarzeń dla grupy:', error.message);
    throw error;
  }
}

// Funkcja do pobierania członków dla danej grupy (filtrowanie po stronie aplikacji)
async function getGroupMembers(groupId) {
  try {
    const response = await apiClient.get('/memberships');
    const allMemberships = response.data;
    const groupMembers = allMemberships.filter(member => member.groupId === groupId); // Filtracja członków
    return groupMembers;
  } catch (error) {
    console.error('Błąd podczas pobierania członków grupy:', error.message);
    throw error;
  }
}


async function getUserNameSurname(userId)
{
  try {
    const response = await apiClient.get(`/users/${userId}`);
    const userInfo = response.data;
    return userInfo;
  } catch (error) {
    console.error('Błąd podczas pobierania informacji o użytkowniku:', error.message);
    throw error;
  }
}



module.exports = {
  apiClient,
  getGroups,
  getGroupInfo,
  getGroupEvents,
  getGroupMembers,
  getUserNameSurname
};
