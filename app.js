const express = require('express');
const app = express();
const path = require('path');
const { apiClient, getGroups, getGroupEvents, getGroupMembers, getUserNameSurname, getGroupInfo } = require('./api/groups'); // Import API functions

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
app.get('/', (req, res) => {
  res.render('homepage'); // Render homepage
});

app.get('/debt', (req, res) => {
  res.render('debt');
});

app.get('/meetings', (req, res) => {
  res.render('meetings');
});

app.get('/availability', (req, res) => {
  res.render('availability');
});

app.get('/places', (req, res) => {
  res.render('places');
});

app.get('/settings', (req, res) => {
  res.render('settings');
});

// Group detail page
app.get('/groups/:id/view', async (req, res) => {
  const groupId = req.params.id;
  try {
    const events = await getGroupEvents(groupId);
    const members = await getGroupMembers(groupId);
    const groupName = await getGroupInfo(groupId);
    // Fetch names and surnames for each member

    console.log(groupName)
    const detailedMembers = await Promise.all(
      members.map(async (member) => {
        try {
          const userInfo = await getUserNameSurname(member.userId); // Fetch user details
          return {
            ...member,
            name: userInfo.name,
            surname: userInfo.surname,
          };
        } catch {
          return {
            ...member,
            name: 'Unknown',
            surname: 'User',
          };
        }
      })
    );

    // Render group view with events and detailed member data
    res.render('group', 
      {events, members: detailedMembers, groupName , groupId});
  } catch (error) {
    console.error('Error loading group details:', error);
    res.status(500).send('Error loading group details');
  }
});

app.post('/memberships', async (req, res) => {
  const { email, groupId } = req.body; 
    const role = 2; // Member
    console.log(role)
  try {
    if (!email || !groupId.value) {
      return res.status(400).json({ error: 'Missing email' }); 
    }
    console.log(`Adding member with email: ${email} to group ${groupId.value}`);

    console.log({
      email,
      role,
      groupId: { value: groupId.value }, 
    })

    // Wywołanie API backendowego do dodania członka
    const response = await apiClient.post('/memberships', {
      email,
      role,
      groupId: { value: groupId.value }, 
    });


    // Obsługa odpowiedzi
    const addedMember = response.data;
    console.log('Member successfully added:', addedMember);

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



// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
