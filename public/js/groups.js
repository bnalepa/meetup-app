function showAddMemberPopup(groupId) {
    const popupContent = `<input type="text" id="inputMember" placeholder="Enter User Email">`
    showPopup(
        'Add Member',
        popupContent,
        'Add Member',
        'Cancel',
        () => addMember(groupId)
    );
  }

async function addMember(groupId) {
    const emailToAdd = document.getElementById('inputMember').value;

    if (!emailToAdd) {
        alert('Please enter a valid email address');
        return;
    }

    try {

        const payload = {
            groupId: { value: groupId }, 
            email: emailToAdd 
        };

        // Wyślij żądanie POST do endpointu /memberships
        const response = await fetch(`/memberships`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload), // Przekaż dane w treści żądania
        });

        if (!response.ok) {
            throw new Error('Failed to add member');
        }

        const data = await response.json(); // Odbierz odpowiedź z serwera
        alert(`User with email ${emailToAdd} has been added to the group!`);
        location.reload(); // Odśwież stronę, aby zaktualizować listę członków
        console.log(`User with email ${emailToAdd} has been added to the group!`);
    } catch (error) {
        console.error('Error adding member:', error.message);
        alert('Failed to add member. Please try again.');
    }
}

function showChangeRolePopup(memberId, currentRole) {
    const popupContent = `
        <label for="newRole">New role:</label>
        <select id="newRole">
            <option value="1" ${currentRole == 1 ? 'selected' : ''}>Moderator</option>
            <option value="2" ${currentRole == 2 ? 'selected' : ''}>Member</option>
        </select>
    `;

    showPopup(
        'Change Role for Member', 
        popupContent, 
        'Save',
        'Cancel', 
        () => updateRole(memberId)
    );
}

// Funkcja do aktualizacji roli
async function updateRole(memberId) {
    const newRole = document.getElementById('newRole').value;
    try {
        const response = await fetch(`/memberships/${memberId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ role: parseInt(newRole, 10) }),
        });

        if (!response.ok) {
            throw new Error('Failed to update role');
        }

        console.log('Role updated successfully');
        location.reload();
        
        console.log('Role updated successfully');
    } catch (error) {
        console.error('Error updating role:', error.message);
        alert('Failed to update role. Please try again.');
    }
}

function showRenameGroupPopup(groupId,groupName) {

    //<label for="newName">New name:</label>
    const popupContent = `
        
        <input type="text" id="inputNewNameGroup" placeholder="Enter New Group Name" value="${groupName}">
    `;

    showPopup(
        'Rename Group', 
        popupContent, 
        'Rename',
        'Cancel', 
        () => updateGroupName(groupId,groupName)
    );
}

async function updateGroupName(groupId,groupName) {

    const newGroupName = document.getElementById('inputNewNameGroup').value;    
    console.log(groupId,groupName,newGroupName,JSON.stringify(
        { name: newGroupName }
    ))
    try {
        const response = await fetch(`/groups/${groupId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(
                { name: newGroupName }
            )
        });

        console.log(`/groups/${groupId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(
                { name: newGroupName }
            )
        } )

        if (!response.ok) {
            throw new Error('Failed to update group name');
        }

        location.reload();
    } catch (error) {
        console.error('Error updating group name:', error.message);
        alert('Failed to update. Please try again.');
    }
}


function showDeleteEventPopup(eventId) {
    // Zdefiniuj treść pop-upu z select
    const popupContent = `
        Are you sure?
    `;

    // Wywołaj funkcję do wyświetlenia pop-upu
    showPopup(
        'Delete Event', 
        popupContent, 
        'Yes',
        'No', 
        () => deleteEvent(eventId)
    );
}

async function deleteEvent(eventId) {
    try {
        const response = await fetch(`/events/${eventId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        location.reload();    
        if (response.status === 204) { 
            return null; // 204 oznacza brak treści, więc zwracamy null
        }

        if (!response.ok) {
            throw new Error(`Failed to delete event. Status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error deleting event:', error.message);
        alert('Error: ' + error.message);
        throw error;
    }
}



function showRemoveMemberPopup(memberId) {
    const popupContent = `
        <p>Are you sure you want to remove this user from the group?</p>
    `;

    showPopup(
        'Remove User from Group',
        popupContent,
        'Yes',
        'No',
        async () => {

                await removeMember(memberId);
                location.reload(); 

        }
    );
}

async function removeMember(memberId) {
    try {
        const response = await fetch(`/memberships/${memberId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.status === 204) { 
            return null; // 204 oznacza brak treści, więc zwracamy null
        }

        if (!response.ok) {
            throw new Error(`Failed to remove user. Status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error removing user:', error.message);
        alert('Error: ' + error.message);
        throw error;
    }
}


function showMoveEventPopup(eventId) {
    const popupContent = `
        <p>Are you sure you want to move this event to the next phase?</p>
    `;

    showPopup(
        'Move Event to Next Phase',
        popupContent,
        'Yes',
        'No',
        async () => {
            await moveEventToNextPhase(eventId);
            location.reload(); // Odświeżenie widoku po udanej zmianie
        }
    );
}

async function moveEventToNextPhase(eventId) {
    try {
        const response = await fetch(`/events/${eventId}/progress`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        // Pobieramy treść odpowiedzi
        const text = await response.text();
        const data = text ? JSON.parse(text) : {};
        if (!response.ok) {
            const errorDetail = data.error || `Failed to move event. Status: ${error}`;
            throw new Error(errorDetail);
        }

        return data;
    } catch (error) {
        console.error('Error moving event to next phase:', error);
        alert(error);
        throw error;
    }
}



// Funkcja do wyświetlania popupu dodawania wydarzenia
function showAddEventPopup(groupId) {
    const popupContent = `
        <form id="add-event-form">
            <label for="event-name">Event Name:</label>
            <input type="text" id="event-name" required><br>

            <label for="event-description">Description:</label>
            <textarea id="event-description" required></textarea><br>
        </form>
    `;

    showPopup(
        'Add New Event',
        popupContent,
        'Add',
        'Cancel',
        () => addEvent(groupId)
    );
}


// Funkcja do dodawania nowego wydarzenia
async function addEvent(groupId) {
  const eventName = document.getElementById('event-name').value;
  const eventDescription = document.getElementById('event-description').value;

  const eventData = {
    name: eventName,
    description: eventDescription,
    isRecurring: false,
    groupId: {
      value: groupId // ID grupy
    }
  };

  try {
    const response = await fetch('/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      throw new Error('Failed to add event');
    }
    const newEvent = await response.json();
    location.reload(); // Odśwież stronę, aby zobaczyć nowe wydarzenie
  } catch (error) {
    console.error('Error adding event:', error.message);
    alert('Failed to add event. Please try again.');
  }
}


// Funkcja wyświetlająca pop-up potwierdzający usunięcie grupy
function showDeleteGroupPopup(groupId) {
    const popupContent = `
        <p>Are you sure you want to delete this group? This action cannot be undone.</p>
    `;

    showPopup(
        'Delete Group',
        popupContent,
        'Yes, Delete',
        'Cancel',
        async () => {
            await deleteGroup(groupId);
            location.reload();
        }
    );
}

// Funkcja usuwająca grupę
async function deleteGroup(groupId) {
    try {
        const response = await fetch(`/groups/${groupId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        location.href = "/";
    } catch (error) {
        console.error('Error deleting group:', error.message);
        alert('Failed to delete group. Please try again.');
    }
}






window.showChangeRolePopup = showChangeRolePopup;
window.showAddMemberPopup = showAddMemberPopup;
window.addMember = addMember;
window.moveEventToNextPhase = moveEventToNextPhase;
