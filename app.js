const express = require('express');
const app = express();
const path = require('path');
const { apiClient, getGroups, getGroupEvents, getGroupMembers, getProposedVenuesForEvent, getGroupInfo, getUserRole, getGroupVenues, getVotingResults, getEventHistory } = require('./api/groups'); // Import API functions
const { getUserAvailability, fetchUpcomingEvents } = require('./api/availability'); // Importujemy funkcję pobierającą dostępność

const mockUserId = 'a423cec6-39bd-eb69-59bb-403fdce6bb6d';


app.use(express.json()); // Middleware do obsługi treści JSON
app.use(express.urlencoded({ extended: true })); // Opcjonalne: Obsługa danych przesłanych jako URL-encoded

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to fetch groups for all views
app.use(async (req, res, next) => {
  try {
    const groups = await getGroups(); // Fetch groups from API
    res.locals.groups = groups; // Make groups available in all views
    next();
  } catch (error) {
    console.error('Error loading groups:', error);
    res.locals.groups = []; // Empty list in case of error
    next();
  }
});

// Main page



app.get('/availability', async (req, res) => {
  try {
    // Pobierz dostępności użytkownika
    const userAvailability = await getUserAvailability(mockUserId);

    // Renderuj widok EJS i przekaż dane
    res.render('availability', {
      userAvailability: userAvailability || [] // Przekaż pustą tablicę, jeśli brak danych
    });
  } catch (error) {
    console.error('Error loading availability page:', error.message);
    res.status(500).send('Error loading availability page');
  }
});

app.get('/settings', (req, res) => {
  res.render('settings');
});

// Groups
app.get('/groups/:id/view', async (req, res) => {
  const groupId = req.params.id;
  try {
    const events = await getGroupEvents(groupId);
    const members = await getGroupMembers(groupId);
    const venues = await getGroupVenues(groupId);
    const groupInfo = await getGroupInfo(groupId);
    const historyEvents = await getEventHistory(groupId);
    // Sprawdź, czy są jakieś wydarzenia
    let phaseId = null;
    let eventId = null;

    if (events.length > 0) {
      phaseId = events[0].eventStatus; // Pobierz status pierwszego wydarzenia
      eventId = events[0].eventId.value; // Pobierz ID pierwszego wydarzenia
    }

    // Pobierz proponowane miejsca i wyniki głosowania dla każdego wydarzenia
    const eventsWithProposedVenues = await Promise.all(
      events.map(async (event) => {
        const proposedVenues = await getProposedVenuesForEvent(event.eventId.value);
        const votingResults = await getVotingResults(event.eventId.value);

        return {
          ...event,
          proposedVenues,
          votingResults 
        };
      })
    );

    // Pobierz szczegółowe informacje o członkach (w tym ich role)
    const detailedMembers = await Promise.all(
      members.map(async (member) => {
        const userRoleData = await getUserRole(member.userId.value, groupId);
        try {
        
          return {
            id: member.userId.value,
            memberId: userRoleData.memberId,
            role: userRoleData.role, 
            ...member
          };
        } catch (error) {
          console.error("Error fetching user role:", error.message);
          return {
            id: member.userId.value || '0',
            memberId: userRoleData?.id,
            role: '2',
            ...member
          };
        }
      })
    );

    // Renderowanie widoku z pełnymi danymi grupy
    res.render('group', {
      events: eventsWithProposedVenues,
      members: detailedMembers,
      venues,
      groupId: groupId,
      groupName: groupInfo,
      phaseId,
      eventId ,
      historyEvents
    });

  } catch (error) {
    console.error('Error loading group details:', error.message);
    res.status(500).send('Error loading group details');
  }
});


app.post('/memberships', async (req, res) => {
  const { email, groupId } = req.body; 
    const role = 2; // Member
  try {
    if (!email || !groupId.value) {
      return res.status(400).json({ error: 'Missing email' }); 
    }
    console.log(`Adding member with email: ${email} to group ${groupId.value}`);


    // Wywołanie API backendowego do dodania członka
    const response = await apiClient.post('/memberships', {
      email,
      role,
      groupId: { value: groupId.value }, 
    });


    // Obsługa odpowiedzi
    const addedMember = response.data;

    // Zwracamy odpowiedź z sukcesem
    res.status(201).json(addedMember);
  } catch (error) {
    console.error('Error adding member:', error.message);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

app.put('/memberships/:id', async (req, res) => {
  const { id } = req.params; // ID członkostwa z URL
  const { role } = req.body; // Nowa rola z treści żądania
  try {
      const response = await apiClient.put(`/memberships/${id}`, { role }); // Wywołanie API backendowego
      if (response.status === 204) {
          res.status(204).send(); // Odpowiedź bez treści
      } else {
          res.status(response.status).json(response.data);
      }
  } catch (error) {
      console.error('Error updating role:', error.message);
      res.status(500).json({ error: 'Failed to update role' });
  }
});

app.put('/groups/:id', async (req, res) => {
  const { id } = req.params; // Pobranie ID grupy z URL
  const { name } = req.body; // Pobranie nowej nazwy grupy

  if (!name) {
      return res.status(400).json({ error: "New group name is required" });
  }

  try {
      const response = await apiClient.put(`/groups/${id}`, { name });

      if (response.status === 204) {
          return res.status(204).send();
      } else {
          return res.status(response.status).json(response.data);
      }
  } catch (error) {
      console.error('Error renaming group:', error.message);
      res.status(500).json({ error: 'Failed to rename group' });
  }
});

app.delete('/memberships/:id', async (req, res) => {
  const { id } = req.params;

  try {
      const response = await apiClient.delete(`/memberships/${id}`);

      if (response.status === 204) {
          return res.status(204).send(); // Brak treści w odpowiedzi
      }

      return res.status(response.status).json(response.data);
  } catch (error) {
      console.error('Error removing user from group:', error.message);
      res.status(500).json({ error: 'Failed to remove user from group' });
  }
});


// Availabilities


app.get('/users/:userId/availabilities', async (req, res) => {
  //const { userId } = req.params;
  userId = mockUserId
  try {
      const availability = await getUserAvailability(userId);
      res.json(availability);
  } catch (error) {
      console.error('Error fetching user availability:', error.message);
      res.status(500).json({ error: 'Failed to fetch user availability' });
  }
});

app.post('/users/:userId/availabilities', async (req, res) => {
  //const { userId } = req.params;
  const { startTime, endTime } = req.body;

  userId = mockUserId;
  try {
      const response = await apiClient.post(`/users/${userId}/availabilities`, {
          startTime,
          endTime
      });

      console.log(`Backend API response:`, response.status, response.data); // 🔍 Logowanie odpowiedzi API

      if (response.status !== 201) {
          return res.status(response.status).json({ error: 'Failed to add availability' });
      }

      res.status(201).json(response.data);
  } catch (error) {
      console.error('Error adding availability:', error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to add availability', details: error.response?.data });
  }
});


app.delete('/users/:userId/availabilities/:availabilityId', async (req, res) => {
  //const { userId, availabilityId } = req.params;
  const { availabilityId } = req.params;
  userId = mockUserId;
  try {
      const response = await apiClient.delete(`/users/availabilities/${availabilityId}`);

      if (response.status === 204) {
          return res.status(204).send(); // Zwracamy pustą odpowiedź zgodnie ze standardami API
      }

      return res.status(response.status).json(response.data);
  } catch (error) {
      console.error('Error deleting availability:', error.message);
      res.status(500).json({ error: 'Failed to delete availability' });
  }
});

// Venues

// Pobierz miejsca dla grupy
app.get('/groups/:groupId/venues', async (req, res) => {
  const { groupId } = req.params;
  try {
    const venues = await getGroupVenues(groupId);
    res.render(venues);
} catch (error) {
    console.error('Error fetching group venues:', error.message);
    res.status(500).json({ error: 'Failed to fetch group venues' });
}
});



// Dodaj nowe miejsce
app.post('/venues', async (req, res) => {
  const { name, location, groupId, createdBy } = req.body;

  try {
      const response = await apiClient.post('/venues', {
          name,
          location,
          groupId: { value: groupId },
          createdBy: { value: createdBy },
      });

      res.status(201).json(response.data);

      location.ref
  } catch (error) {
      console.error('Error adding venue:', error.message);
      res.status(500).json({ error: 'Internal server error' });
  }
});

// Przenoszenie miejsca do innej grupy
app.post('/venues/:venueId/copy-to-group/:groupId', async (req, res) => {
  const { venueId, groupId } = req.params;
  const { requestedByUserId } = req.body;

  try {
      const response = await apiClient.post(`/venues/${venueId}/copy-to-group/${groupId}`, {
          requestedByUserId: { value: requestedByUserId.value }
      });

      if (response.status !== 200) {
          return res.status(response.status).json({ error: 'Failed to copy venue to group' });
      }

      res.json(response.data);
  } catch (error) {
      console.error('Error copying venue:', error.message);
      res.status(500).json({ error: 'Internal server error' });
  }
});

// Usuwanie miejsca
app.delete('/venues/:venueId', async (req, res) => {
  const { venueId } = req.params;

  try {
      const response = await apiClient.delete(`/venues/${venueId}`);

      if (response.status === 204) {
          return res.status(204).send();
      }

      return res.status(response.status).json(response.data);
  } catch (error) {
      console.error('Error deleting venue:', error.message);
      res.status(500).json({ error: 'Failed to delete venue' });
  }
});

// Proponowanie miejsca dla wydarzenia
app.post('/events/:eventId/propose-venue', async (req, res) => {
  const { eventId } = req.params;
  const { venueId } = req.body;

  try {
      const response = await apiClient.post(`/events/${eventId}/propose-venue`, {
          venueId: { value: venueId.value }
      });

      if (response.status !== 200) {
          return res.status(response.status).json({ error: 'Failed to propose venue for event' });
      }

      res.json(response.data);
  } catch (error) {
      console.error('Error proposing venue:', error.message);
      res.status(500).json({ error: 'Internal server error' });
  }
});




// Events

// Endpoint do dodawania nowego wydarzenia
app.post('/events', async (req, res) => {
  const { name, description, isRecurring, createdBy, groupId } = req.body;

  try {
    if (!name || !description || isRecurring === undefined || !createdBy?.value || !groupId?.value) {
      return res.status(400).json({ error: "Missing required fields or invalid JSON format" });
    }

    const eventPayload = {
      name,
      description,
      isRecurring,
      startDate: "2010-01-01T00:00:00.000Z", 
      createdBy: { value: createdBy.value }, 
      groupId: { value: groupId.value }
    };

    const response = await apiClient.post('/events', eventPayload);

    if (response.status !== 201) {
      return res.status(response.status).json({ error: 'Failed to add event' });
    }

    res.status(201).json(response.data);
  } catch (error) {
    console.error('Error adding event:', error.message);
    res.status(500).json({ error: 'Failed to add event' });
  }
});


app.put('/events/:eventId/progress', async (req, res) => {
  const { eventId } = req.params;

  try {
      const response = await apiClient.put(`/events/${eventId}/progress`);

      res.json(response.data);
  } catch (error) {
      console.error('Error moving event to next phase:', error.response?.data?.detail || error.message);
      res.status(500).json({ error: error.response?.data?.detail || 'Internal server error' });
  }
});

app.delete('/events/:eventId', async (req, res) => {
  const { eventId } = req.params;

  try {
      const response = await apiClient.delete(`/events/${eventId}`);

      console.log('External API response:', response.status, response.data);

      if (response.status === 204) {
          return res.status(204).send(); // 204 oznacza brak treści
      }

      return res.status(response.status).json(response.data);
  } catch (error) {
      res.status(500).json({ error: 'Failed to delete event' });
  }
});

app.post('/events/:eventId/vote', async (req, res) => {
  const { eventId } = req.params;
  const { userId, venueId, decision } = req.body;

  try {
      const response = await apiClient.post(`/events/${eventId}/vote`, {
          userId,
          venueId,
          decision
      });

      if (response.status !== 200) {
          return res.status(response.status).json({ error: "Failed to register vote" });
      }

      res.json(response.data);
  } catch (error) {
      console.error("Error voting:", error.message);
      res.status(500).json({ error: "Internal server error" });
  }
});



app.post('/venues/:venueId/copy-to-group/:groupId', async (req, res) => {
  const { venueId, groupId } = req.params;
  const { requestedByUserId } = req.body;

  try {
      const response = await apiClient.post(`/venues/${venueId}/copy-to-group/${groupId}`, {
          requestedByUserId: { value: requestedByUserId.value }
      });

      if (response.status !== 200) {
          return res.status(response.status).json({ error: 'Failed to copy venue to group' });
      }

      res.json(response.data);
  } catch (error) {
      console.error('Error copying venue:', error.message);
      res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/groups/:id/view', async (req, res) => {
  const groupId = req.params.id;
  try {
    const events = await getGroupEvents(groupId);
    const members = await getGroupMembers(groupId);
    const groupName = await getGroupInfo(groupId);
    const venues = await getGroupVenues(groupId);
    // Pobierz proponowane miejsca i wyniki głosowania dla każdego wydarzenia
    const eventsWithDetails = await Promise.all(
      events.map(async (event) => {
        const proposedVenues = await getProposedVenuesForEvent(event.eventId.value);
        const votingResults = await getVotingResults(event.eventId.value);
        return {
          ...event,
          proposedVenues, // Dodaj proponowane miejsca do obiektu wydarzenia
          votingResults // Dodaj wyniki głosowania do obiektu wydarzenia
        };
      })
    );

    // Fetch names and surnames for each member
    const detailedMembers = await Promise.all(
      members.map(async (member) => {
        try {
          let role = await getUserRole(member.userId.value, groupId);
          console.log(role)
          return {
            id: member.userId.value,
            role: role !== null ? role : 2, // Domyślna rola to 2 (członek), jeśli rola nie została znaleziona
            ...member
          };
        } catch (error) {
          console.error(`Error fetching role for user ${member.userId.value}:`, error.message);
          return {
            id: member.userId.value,
            role: 2, // Domyślna rola w przypadku błędu
            ...member
          };
        }
      })
    );

    // Render group view with events, members, venues, proposed venues, and voting results
    res.render('group', {
      events: eventsWithDetails,
      members: detailedMembers,
      venues,
      groupName,
      groupId
    });
  } catch (error) {
    console.error('Error loading group details:', error);
    res.status(500).send('Error loading group details');
  }
});

app.post('/events/:eventId/select-venue', async (req, res) => {
  const { eventId } = req.params;
  const { venueId, userId } = req.body;

  try {
      const response = await apiClient.post(`/events/${eventId}/select-venue`, {
          venueId: { value: venueId.value },
          userId: { value: userId.value }
      });

      if (response.status !== 200) {
          return res.status(response.status).json({ error: 'Failed to select venue for event' });
      }

      res.json(response.data);
  } catch (error) {
      console.error('Error selecting venue:', error.message);
      res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/groups/:groupId/best-meeting-time', async (req, res) => {
  const { groupId } = req.params;
  const { preferredTimeRange, minimumParticipants } = req.query;

  try {
      const response = await apiClient.get(`/groups/${groupId}/best-meeting-time`, {
          params: {
              preferredTimeRange,
              minimumParticipants
          }
      });
      if (response.status !== 200) {
          return res.status(response.status).json({ error: 'Failed to find best meeting time' });
      }

      res.json(response.data);
  } catch (error) {
      console.error('Error finding best meeting time:', error.message);
      res.status(500).json({ error: 'Internal server error' });
  }
});

// Aktualizacja wydarzenia
app.put('/events/:id', async (req, res) => {
  const { id } = req.params; // Pobierz ID wydarzenia z parametrów URL
  const { startDate } = req.body; // Pobierz dane z ciała żądania
  console.log(id, startDate)
  try {
    // Wysłanie żądania PUT do backendowego API
    const response = await apiClient.put(`/events/${id}`, {
      startDate
    });

    // Jeśli odpowiedź jest poprawna, zwróć dane
    if (response.status === 200) {
      return res.status(200).json(response.data);
    } else {
      // Jeśli odpowiedź nie jest poprawna, zwróć błąd
      return res.status(response.status).json({ error: 'Failed to update event' });
    }
  } catch (error) {
    console.error('Error updating event:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/', async (req, res) => {
  try {
    // Pobierz nadchodzące wydarzenia dla mockowanego użytkownika
    const upcomingEvents = await fetchUpcomingEvents(mockUserId);

    // Renderuj widok EJS i przekaż dane
    res.render('homepage', {
      upcomingEvents: upcomingEvents || [] // Przekaż pustą tablicę, jeśli brak danych
    });
  } catch (error) {
    console.error('Error loading homepage:', error.message);
    res.status(500).send('Error loading homepage');
  }
});

// Endpoint do pobierania dostępności
app.get('/users/:userId/availabilities', async (req, res) => {
  try {
    const availabilities = await getUserAvailability(mockUserId);
    res.json(availabilities);
  } catch (error) {
    console.error('Error fetching availabilities:', error.message);
    res.status(500).json({ error: 'Failed to fetch availabilities' });
  }
});

// Endpoint do pobierania nadchodzących wydarzeń
app.get('/users/events/:userId/upcoming', async (req, res) => {
  try {
    const upcomingEvents = await fetchUpcomingEvents(mockUserId);
    res.json(upcomingEvents);
  } catch (error) {
    console.error('Error fetching upcoming events:', error.message);
    res.status(500).json({ error: 'Failed to fetch upcoming events' });
  }
});





// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
