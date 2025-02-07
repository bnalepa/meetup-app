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
async function getGroups(userId) {
  try {
    // Pobierz wszystkie grupy
    const groupsResponse = await apiClient.get('/groups');
    const allGroups = groupsResponse.data;

    // Pobierz wszystkie członkostwa
    const membershipsResponse = await apiClient.get('/memberships');
    const allMemberships = membershipsResponse.data;

    // Filtruj członkostwa, aby znaleźć tylko te, które należą do zalogowanego użytkownika
    const userGroupIds = allMemberships
      .filter(membership => membership.userId.value === userId) // Znajdź członkostwa użytkownika
      .map(membership => membership.groupId.value); // Pobierz ID grup

    // Filtruj grupy, pozostawiając tylko te, do których użytkownik należy
    const userGroups = allGroups.filter(group => userGroupIds.includes(group.id.value));

    return userGroups;
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

async function getUserRole(userId, groupId) {
  try {
    // Pobierz wszystkie członkostwa
    const response = await apiClient.get(`/memberships`);
    const allMemberships = response.data;

    // Filtruj członkostwa, aby znaleźć te, które pasują do userId
    const userMemberships = allMemberships.filter(member => member.userId.value === userId && member.groupId.value == groupId);
    // Jeśli znaleziono członkostwa, zwróć obiekt zawierający `id.value` oraz `role`
    if (userMemberships.length > 0) {
      return {
        memberId: userMemberships[0].id.value, // ID członkostwa
        role: userMemberships[0].role    // Rola użytkownika
      };
    } else {
      return null; // Jeśli nie znaleziono członkostwa, zwróć null
    }
  } catch (error) {
    console.error('Błąd podczas pobierania informacji o członkostwach:', error.message);
    throw error;
  }
}


// Funkcja do pobierania członków dla danej grupy (filtrowanie po stronie aplikacji)
async function getGroupMembers(groupId) {
  try {
    const response = await apiClient.get(`/groups/${groupId}/users`);
    const groupMembers = response.data;
    return groupMembers;
  } catch (error) {
    console.error('Błąd podczas pobierania członków grupy:', error.message);
    throw error;
  }
}

// Funkcja do pobierania wydarzeń dla danej grupy
async function getGroupEvents(groupId) {
  try {
    const response = await apiClient.get(`/groups/${groupId}/events`);

    // Jeśli odpowiedź jest pusta lub nie ma danych, zwróć pustą tablicę
    if (!response.data || response.data.length === 0) {
      return [];
    }

    // Zwróć dane wydarzeń
    return response.data;
  } catch (error) {
    //console.error('Błąd podczas pobierania wydarzeń dla grupy:', error.message);

    // W przypadku błędu zwróć pustą tablicę, aby strona się nie wywalała
    return [];
  }
}

async function getEventHistory(groupId) {
  try {
    const response = await apiClient.get(`/groups/${groupId}/event-history`);
    if (!response.data || response.data.length === 0) {
      return [];
    }

    return response.data;

  } catch (error) {
    console.error('Error fetching event history:', error.message);
    return []; // Zwróć pustą tablicę w przypadku błędu
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

// Funkcja do pobierania miejsc dla danej grupy
async function getGroupVenues(groupId) {
  try {
    const response = await apiClient.get(`/groups/${groupId}/venues`);
    return response.data || []; // Zwróć pustą tablicę, jeśli brak danych
  } catch (error) {
    console.error('Błąd podczas pobierania miejsc dla grupy:', error.message);
    return []; // Obsługa błędu, zwracamy pustą tablicę zamiast błędu
  }
}

// Funkcja do pobierania proponowanych miejsc dla wydarzenia
async function getProposedVenuesForEvent(eventId) {
  try {
    const response = await apiClient.get(`/events/${eventId}/proposed-venues`);
    return response.data || []; // Zwróć pustą tablicę, jeśli brak danych
  } catch (error) {
    console.error('Błąd podczas pobierania proponowanych miejsc dla wydarzenia:', error.message);
    return []; // Obsługa błędu, zwracamy pustą tablicę zamiast błędu
  }
}

// Funkcja do pobierania wyników głosowania dla wydarzenia
async function getVotingResults(eventId) {
  try {
    const response = await apiClient.get(`/events/${eventId}/voting-results`);
    return response.data || []; // Zwróć pustą tablicę, jeśli brak danych
  } catch (error) {
    console.error('Błąd podczas pobierania wyników głosowania:', error.message);
    return []; // Obsługa błędu, zwracamy pustą tablicę zamiast błędu
  }
}


module.exports = {
  apiClient,
  getGroups,
  getGroupInfo,
  getGroupEvents,
  getGroupMembers,
  getUserNameSurname,
  getUserRole,
  getGroupVenues,
  getProposedVenuesForEvent,
  getVotingResults,
  getEventHistory

};
