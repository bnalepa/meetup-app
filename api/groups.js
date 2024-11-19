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



async function addMember(groupId) {
  const userToAdd = document.getElementById('inputMember').value; // Pobierz wpisany ID użytkownika

  if (!userToAdd) {
      alert('Please enter a valid User ID');
      return;
  }

  try {
      // Wyślij żądanie POST do backendu na `/groups/:groupId/members`
      const response = await fetch(`/groups/${groupId}/members`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: userToAdd }), // Przekaż ID użytkownika w treści żądania
      });

      if (!response.ok) {
          throw new Error('Failed to add member');
      }

      const data = await response.json(); // Odbierz odpowiedź z backendu
      alert(`User ${data.userId} has been added to the group!`); // Wyświetl komunikat o sukcesie
      location.reload(); // Odśwież stronę, aby zaktualizować listę członków
  } catch (error) {
      console.error('Error adding member:', error.message);
      alert('Failed to add member. Please try again.');
  }
}



module.exports = {
  apiClient,
  getGroups,
  getGroupEvents,
  getGroupMembers,
  getUserNameSurname
};
