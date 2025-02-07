// Funkcja do wyświetlania pop-upu z formularzem dodawania miejsca
function showAddVenuePopup(groupId) {
    console.log(groupId)
    const popupContent = `
        <label for="venueName">Name:</label>
        <input type="text" id="venueName" placeholder="Enter venue name"> <br>
        
        <label for="venueLocation">Location:</label>
        <input type="text" id="venueLocation" placeholder="Enter venue location"><br>
    `;

    showPopup(
        'Add Venue',
        popupContent,
        'Save',
        'Cancel',
        async () => {
            await addVenue(groupId);
            location.reload(); 

    }
    );
}

// Funkcja do dodawania nowego miejsca
async function addVenue(groupId) {
    const name = document.getElementById('venueName').value;
    const location = document.getElementById('venueLocation').value;
    const createdBy = 'e0767d15-acc0-47ce-8e36-5e7b993ed633'; // Mockowany userId

    if (!name || !location) {
        alert('Please fill all fields.');
        return;
    }

    try {
        const response = await fetch('/venues', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                location,
                groupId,
                createdBy
            }),
        });

        if (!response.ok) {
            //throw new Error('Failed to add venue');
        }

        location.reload();
    } catch (error) {
        console.error('Error adding venue:', error.message);
        location.reload();
    }

}

// Funkcja do ładowania i wyświetlania miejsc
async function loadVenues(groupId) {
    const venueList = document.getElementById('venue-list');

    try {
        const response = await fetch(`/groups/${groupId}/venues`);
        if (!response.ok) {
            throw new Error('Failed to fetch venues');
        }
        const venues = await response.json();

        venueList.innerHTML = "";

        if (venues.length === 0) {
            venueList.innerHTML = "<li>No venues added.</li>";
            return;
        }

        venues.forEach(venue => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <li class="event-item"><span><strong>${venue.name}</strong> <br> ${venue.location}</span>
                        <span>
                         <button onclick="showDeleteEventPopup('<%= event.eventId.value %>')">
                            <img src="/icons/delete.png" alt="Delete" class="white-icon">
                        </button>
                        </span>
                <li>
            `;
            venueList.appendChild(listItem);
        });

    } catch (error) {
        console.error('Error fetching venues:', error.message);
        venueList.innerHTML = "<li>Failed to load venues.</li>";
    }
}

// Funkcja do wyświetlania pop-upu z wyborem grupy do przeniesienia miejsca
function showCopyVenuePopup(venueId, currentGroupId) {
    // Pobierz listę grup (załóżmy, że masz funkcję getGroups)
    fetch('/groups')
        .then(response => response.json())
        .then(groups => {
            // Filtruj grupy, aby wykluczyć bieżącą grupę
            const filteredGroups = groups.filter(group => group.id.value !== currentGroupId);

            // Tworzymy opcje dla selecta
            const groupOptions = filteredGroups.map(group => `
                <option value="${group.id.value}">${group.name}</option>
            `).join('');

            const popupContent = `
                <label for="targetGroup">Select target group:</label>
                <select id="targetGroup">
                    ${groupOptions}
                </select>
            `;

            showPopup(
                'Copy Venue to Group',
                popupContent,
                'Copy',
                'Cancel',
                () => copyVenueToGroup(venueId, currentGroupId)
            );
        })
        .catch(error => {
            console.error('Error fetching groups:', error.message);
            alert('Failed to load groups. Please try again.');
        });
}

// Funkcja do przenoszenia miejsca do innej grupy
async function copyVenueToGroup(venueId, currentGroupId) {
    const targetGroupId = document.getElementById('targetGroup').value;
    const requestedByUserId = 'e0767d15-acc0-47ce-8e36-5e7b993ed633'; // Mockowany userId

    if (!targetGroupId) {
        alert('Please select a target group.');
        return;
    }

    try {
        const response = await fetch(`/venues/${venueId}/copy-to-group/${targetGroupId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                requestedByUserId: { value: requestedByUserId }
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to copy venue to group');
        }

        location.reload();
    } catch (error) {
        console.error('Error copying venue:', error.message);
        alert('Failed to copy venue. Please try again.');
    }
}

// Funkcja do wyświetlania pop-upu z wyborem grupy do przeniesienia miejsca
function showCopyVenuePopup(venueId, currentGroupId) {
    // Pobierz listę grup
    fetch('/groups')
        .then(response => response.json())
        .then(groups => {
            // Filtruj grupy, aby wykluczyć bieżącą grupę
            const filteredGroups = groups.filter(group => group.id.value !== currentGroupId);

            // Tworzymy opcje dla selecta
            const groupOptions = filteredGroups.map(group => `
                <option value="${group.id.value}">${group.name}</option>
            `).join('');

            const popupContent = `
                <label for="targetGroup">Select target group:</label>
                <select id="targetGroup">
                    ${groupOptions}
                </select>
            `;

            showPopup(
                'Copy Venue to Group',
                popupContent,
                'Copy',
                'Cancel',
                () => copyVenueToGroup(venueId, currentGroupId)
            );
        })
        .catch(error => {
            console.error('Error fetching groups:', error.message);
            alert('Failed to load groups. Please try again.');
        });
}

// Funkcja do przenoszenia miejsca do innej grupy
async function copyVenueToGroup(venueId, currentGroupId) {
    const targetGroupId = document.getElementById('targetGroup').value;
    const requestedByUserId = 'e0767d15-acc0-47ce-8e36-5e7b993ed633'; // Mockowany userId

    if (!targetGroupId) {
        alert('Please select a target group.');
        return;
    }

    try {
        const response = await fetch(`/venues/${venueId}/copy-to-group/${targetGroupId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                requestedByUserId: { value: requestedByUserId }
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to copy venue to group');
        }

        location.reload(); // Odświeżenie strony po przeniesieniu miejsca
    } catch (error) {
        console.error('Error copying venue:', error.message);
        alert('Failed to copy venue. Please try again.');
    }
}

// Funkcja do wyświetlania pop-upu potwierdzającego usunięcie miejsca
function showDeleteVenuePopup(venueId) {
    const popupContent = `
        <p>Are you sure you want to delete this venue?</p>
    `;

    showPopup(
        'Delete Venue',
        popupContent,
        'Yes',
        'No',
        () => deleteVenue(venueId)
    );
}

// Funkcja do usuwania miejsca
async function deleteVenue(venueId) {
    try {
        const response = await fetch(`/venues/${venueId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete venue');
        }

        location.reload();
    } catch (error) {
        console.error('Error deleting venue:', error.message);
        alert('Failed to delete venue. Please try again.');
    }
}

// Funkcja do proponowania miejsca dla wydarzenia
async function proposeVenueForEvent(eventId, venueId) {
    try {
        const response = await fetch(`/events/${eventId}/propose-venue`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                venueId: { value: venueId }
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to propose venue for event');
        }
        location.reload();
    } catch (error) {
        console.error('Error proposing venue:', error.message);
        alert('Failed to propose venue. Please try again.');
    }
}

// Funkcja do wyboru miejsca dla wydarzenia
async function selectVenueForEvent(eventId, venueId) {
    const userId = 'a423cec6-39bd-eb69-59bb-403fdce6bb6d'; // Mockowany userId

    try {
        const response = await fetch(`/events/${eventId}/select-venue`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                venueId: { value: venueId },
                userId: { value: userId }
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to select venue for event');
        }

        alert('Venue selected successfully!');
        location.reload(); // Odświeżenie strony po wyborze miejsca
    } catch (error) {
        console.error('Error selecting venue:', error);
        alert('Failed to select venue. Please try again.');
    }
}

// Funkcja do wyświetlania pop-upu z wyborem preferowanego czasu i liczby uczestników
function showBestMeetingTimePopup(groupId, eventId) {
    const popupContent = `
        <label for="preferredTimeRange">Preferred Time Range:</label>
        <select id="preferredTimeRange">
            <option value="Afternoon">Afternoon (10-17)</option>
            <option value="Evening">Evening (17-20)</option>
            <option value="LateEvening">Late Evening (20-23)</option>
        </select>
        <br>
        <label for="minimumParticipants">Minimum Participants (min 2):</label>
        <input type="number" id="minimumParticipants" placeholder="Enter minimum participants" min="2">
    `;

    showPopup(
        'Find Best Meeting Time',
        popupContent,
        'Find',
        'Cancel',
        () => findBestMeetingTime(groupId, eventId)
    );
}

// Funkcja do pobierania najlepszego czasu spotkania
async function findBestMeetingTime(groupId, eventId) {
    const preferredTimeRange = document.getElementById('preferredTimeRange').value;
    const minimumParticipants = document.getElementById('minimumParticipants').value;

    if (!preferredTimeRange || !minimumParticipants) {
        alert('Please fill all fields.');
        return;
    }

    try {
        const response = await fetch(`/groups/${groupId}/best-meeting-time?preferredTimeRange=${preferredTimeRange}&minimumParticipants=${minimumParticipants}`);
        if (!response.ok) {
            throw new Error('Failed to find best meeting time');
        }

        const responseJSON = await response.json();
        // Wyświetl pop-up z najlepszym czasem spotkania
        showBestMeetingTimeResultPopup(groupId, eventId, responseJSON);
    } catch (error) {
        console.error('Error finding best meeting time:', error.message);
        alert('Failed to find best meeting time. Please try again.');
    }
}

// Funkcja do wyświetlania wyniku najlepszego czasu spotkania
function showBestMeetingTimeResultPopup(groupId, eventId, responseJSON) {
    const popupContent = `
        <p><strong>Date:</strong> ${responseJSON.date.split("T")[0]}</p>
        <p><strong>Start Time:</strong> ${responseJSON.startTime}</p>
        <p><strong>Participants Available:</strong> ${responseJSON.participantsAvailable} / ${responseJSON.totalParticipants}</p>
        
        <p>Do you want to set this date for the event?</p>
    `;

    showPopup(
        'Best Meeting Time',
        popupContent,
        'Set Date',
        'Cancel',
        () => setEventDate(groupId, eventId, responseJSON) // Przekazujemy eventId i responseJSON
    );
}

async function setEventDate(groupId, eventId, bestMeetingTime) {
    

    const date = new Date(bestMeetingTime.date.split("T")[0])
    const time = bestMeetingTime.startTime;

    // Formatowanie daty i czasu
    const formattedDate = date.toISOString().split('T')[0]; // Pobierz datę w formacie YYYY-MM-DD
    const formattedTime = time;
    const formattedDateTime = `${formattedDate}T${formattedTime}`;
    console.log(eventId,"xd",formattedDateTime)
    try {

        // Przygotuj dane do aktualizacji
        const eventData = {
            startDate: formattedDateTime // Ustaw nową datę rozpoczęcia
        };

        // Wyślij żądanie PUT do endpointu /events/{id}
        const response = await fetch(`/events/${eventId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Błąd: ${errorData.title} - ${errorData.detail}`);
        }

        // Jeśli aktualizacja się powiedzie, wyświetl komunikat i odśwież stronę
        alert('Event date set successfully!');
        location.reload(); // Odświeżenie strony po ustawieniu daty

    } catch (error) {
        console.error('Error setting event date:', error.detail);
        alert('Failed to set event date. Please try again.');
    }
}



window.showBestMeetingTimePopup = showBestMeetingTimePopup;
window.showCopyVenuePopup = showCopyVenuePopup;
window.copyVenueToGroup = copyVenueToGroup;
window.showDeleteVenuePopup = showDeleteVenuePopup;
window.deleteVenue = deleteVenue;
window.proposeVenueForEvent = proposeVenueForEvent;
window.showAddVenuePopup = showAddVenuePopup;
window.addVenue = addVenue;
window.loadVenues = loadVenues;
window.selectVenueForEvent = selectVenueForEvent;