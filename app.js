const express = require('express');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const { apiClient, getGroups, getGroupEvents, getGroupMembers, getProposedVenuesForEvent, getGroupInfo, getUserRole, getGroupVenues, getVotingResults, getEventHistory } = require('./api/groups'); // Import API functions
const { getUserAvailability, fetchUpcomingEvents } = require('./api/availability'); // Importujemy funkcję pobierającą dostępność





app.use(express.json()); // Middleware do obsługi treści JSON
app.use(express.urlencoded({ extended: true })); // Opcjonalne: Obsługa danych przesłanych jako URL-encoded
app.use(cookieParser());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware: Udostępnij ciasteczka w EJS
app.use((req, res, next) => {
  res.locals.cookies = req.cookies;

  next();
});



// Middleware do autoryzacji użytkownika
app.use((req, res, next) => {
  const userId = req.cookies.userId;

  if (!userId && req.path !== '/' && req.path !== '/auth/login') {
    res.cookie('redirectAlert', 'You have been redirected to the homepage. Please log in.', { maxAge: 1000, httpOnly: false });
    return res.redirect('/');
  }

  res.locals.userId = userId; // Przekazujemy userId do widoków (np. EJS)
  next();
});




// Middleware to fetch groups for all views
app.use(async (req, res, next) => {
  const userId = req.cookies.userId;

  if (!userId) {
    res.locals.groups = []; // Brak zalogowanego użytkownika -> pusta lista grup
    return next();
  }

  try {
    const groups = await getGroups(userId); // Pobierz grupy użytkownika
    res.locals.groups = groups; // Udostępnij je we wszystkich widokach
  } catch (error) {
    console.error('Error loading groups:', error);
    res.locals.groups = []; // W razie błędu zwróć pustą tablicę
  }

  next();
});



// Auth
app.post('/auth/login', async (req, res) => {
  const { loginOrEmail, password } = req.body;

  try {
      // 🔹 Logowanie użytkownika
      const loginResponse = await apiClient.post('/auth/login', { loginOrEmail, password });

      if (loginResponse.status !== 200) {
          return res.status(loginResponse.status).json({ error: 'Invalid credentials' });
      }

      const userId = loginResponse.data.userId.value;
      const token = loginResponse.data.token;
      // 🔹 Pobranie pełnych danych użytkownika z `/users/{id}`
      const userResponse = await apiClient.get(`/users/${userId}`);

      if (userResponse.status !== 200) {
          return res.status(userResponse.status).json({ error: 'Failed to fetch user data' });
      }

      const user = userResponse.data;

      // 🔹 Zapisujemy pełne dane użytkownika w ciasteczkach
      res.cookie('userId', userId, { httpOnly: true, secure: true, sameSite: 'Strict', maxAge: 24 * 60 * 60 * 1000 });
      res.cookie('userEmail', user.email, { secure: true, sameSite: 'Strict', maxAge: 24 * 60 * 60 * 1000 });
      res.cookie('userName', user.name, { secure: true, sameSite: 'Strict', maxAge: 24 * 60 * 60 * 1000 });
      res.cookie('userSurname', user.surname, { secure: true, sameSite: 'Strict', maxAge: 24 * 60 * 60 * 1000 });
      res.cookie('userToken', token, { secure: true, sameSite: 'Strict', maxAge: 24 * 60 * 60 * 1000 });

      res.json({ message: 'Login successful', userId: userId, userEmail: user.email, name: user.name, surname: user.surname });
  } catch (error) {
      console.error('Login error:', error.message);
      res.status(500).json({ error: 'Login failed' });
  }
});


app.post('/auth/logout', (req, res) => {
  res.clearCookie('userId');
  res.clearCookie('userEmail');
  res.clearCookie('userName');
  res.clearCookie('userSurname');
  res.clearCookie('userToken');
  res.json({ message: 'Logout successful' });
});

app.get('/auth/logout', (req, res) => {
  res.clearCookie('userId');
  res.clearCookie('userEmail');
  res.clearCookie('userName');
  res.clearCookie('userSurname');
  res.clearCookie('userToken');
  res.redirect('/'); // Przekierowanie na stronę główną po wylogowaniu
});



app.get('/auth/me', (req, res) => {
  const userId = req.cookies.userId;
  const userEmail = req.cookies.userEmail;
  const userName = req.cookies.userName;
  const userSurname = req.cookies.userSurname;
  const userToken = req.cookies.userToken;

  if (!userId) {
      return res.status(401).json({ error: 'Not logged in' });
  }

  res.json({ userId, userEmail, name: userName, surname: userSurname , userToken});
});


app.get('/', async (req, res) => {
  const userId = req.cookies.userId;
  try {

    // Jeśli użytkownik nie jest zalogowany, przekazujemy pustą listę wydarzeń
    if (!userId) {
      return res.render('homepage', { upcomingEvents: [] });
    }

    // Pobierz nadchodzące wydarzenia dla zalogowanego użytkownika
    const upcomingEvents = await fetchUpcomingEvents(userId);

    // Renderuj widok EJS i przekaż dane
    res.render('homepage', {
      upcomingEvents: upcomingEvents || []
    });
  } catch (error) {
    console.error('Error loading homepage:', error.message);
    res.status(500).send('Error loading homepage');
  }
});
// Main page

app.get('/availability', async (req, res) => {
  try {
    // Pobierz dostępności użytkownika
    const userId = req.cookies.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const userAvailability = await getUserAvailability(userId);

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
  const userId = req.cookies.userId;
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
    let loggedUserRole = 2;
    // Pobierz szczegółowe informacje o członkach (w tym ich role)
    const detailedMembers = await Promise.all(
      members.map(async (member) => {
        const userRoleData = await getUserRole(member.userId.value, groupId);
          if(member.userId.value == userId)
            loggedUserRole = userRoleData.role;
        try {
        
          return {
            id: member.userId.value,
            memberId: userRoleData.memberId,
            role: userRoleData.role, 
            ...member,
          };
        } catch (error) {
          console.error("Error fetching user role:", error.message);
          return {
            id: member.userId.value || '0',
            memberId: userRoleData?.id,
            role: '2',
            ...member,
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
      historyEvents,
      loggedUserRole
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

app.delete('/groups/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
      const response = await apiClient.delete(`/groups/${id}`);

      res.cookie('redirectAlert', 'You have been redirected to the homepage. Please log in.', { maxAge: 1000, httpOnly: false });
      return res.redirect('/');
  } catch (error) {

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
  
  const userId = req.cookies.userId;
if (!userId) return res.status(401).json({ error: 'Unauthorized' });

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

  const userId = req.cookies.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
      const response = await apiClient.post(`/users/${userId}/availabilities`, {
          startTime,
          endTime
      });

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
  const userId = req.cookies.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
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

app.post('/groups', async (req, res) => {
  const { name } = req.body;
  const userId = req.cookies.userId; 
  console.log(userId)
  if (!name ){
      return res.status(400).json({ error: 'Group name is required' });
  }
  console.log(userId, name)
  try {
      const response = await apiClient.post('/groups', {
          name,
          createdBy: { value: userId }
      });

      if (response.status !== 201) {
          return res.status(response.status).json({ error: 'Failed to create group' });
      }

      res.status(201).json(response.data);
  } catch (error) {
      console.error('Error creating group:', error.message);
      res.status(500).json({ error: 'Failed to create group' });
  }
});



// Dodaj nowe miejsce
app.post('/venues', async (req, res) => {
  const { name, location, groupId} = req.body;
  const userId = req.cookies.userId; 
  console.log({
    name,
    location,
    groupId: { value: groupId },
    createdBy: { value: userId },
})
  try {
      const response = await apiClient.post('/venues', {
          name,
          location,
          groupId: { value: groupId },
          createdBy: { value: userId },
      });

      res.status(201).json(response.data);


  } catch (error) {
      console.error('Error adding venue:', error.message);
      res.status(500).json({ error: 'Internal server error' });
  }
});

// Przenoszenie miejsca do innej grupy
app.post('/venues/:venueId/copy-to-group/:groupId', async (req, res) => {
  const { venueId, groupId } = req.params;
  const { requestedByUserId } = req.body;
  console.log(venueId, groupId, requestedByUserId)
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
  const { name, description, isRecurring, groupId } = req.body;
  const userId = req.cookies.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  try {
    if (!name || !description || isRecurring === undefined || !groupId?.value) {
      return res.status(400).json({ error: "Missing required fields or invalid JSON format" });
    }

    const eventPayload = {
      name,
      description,
      isRecurring,
      startDate: "2010-01-01T00:00:00.000Z", 
      createdBy: { value: userId }, 
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
  const userId = req.cookies.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { eventId } = req.params;
  const { venueId, decision } = req.body;

  try {
      const response = await apiClient.post(`/events/${eventId}/vote`, {
          userId: { value: userId },
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


// Endpoint do pobierania dostępności
app.get('/users/:userId/availabilities', async (req, res) => {
  try {
    const availabilities = await getUserAvailability(userId);
    res.json(availabilities);
  } catch (error) {
    console.error('Error fetching availabilities:', error.message);
    res.status(500).json({ error: 'Failed to fetch availabilities' });
  }
});

// Endpoint do pobierania nadchodzących wydarzeń
app.get('/users/events/:userId/upcoming', async (req, res) => {
  const userId = req.cookies.userId;
  try {
    const upcomingEvents = await fetchUpcomingEvents(userId);
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
