document.addEventListener('DOMContentLoaded', function () {
  var calendarEl = document.getElementById('calendar');

  var calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      events: function (fetchInfo, successCallback, failureCallback) {
          fetch('/users/e0767d15-acc0-47ce-8e36-5e7b993ed633/availabilities')
              .then(response => {
                  if (!response.ok) {
                      throw new Error('Failed to fetch availabilities');
                  }
                  return response.json();
              })
              .then(events => {
                  console.log("Załadowane wydarzenia:", events);
                  successCallback(events.map(event => ({
                      //id: event.availabilityId,
                      title: `🕒 ${formatDate(event.startTime)} - ${formatDate(event.endTime)}`, // Formatowany tekst
                      start: event.startTime,
                      end: event.endTime,
                      allDay: false,
                  })));
              })  
              .catch(error => {
                  console.error("Błąd ładowania dostępności:", error);
                  failureCallback(error);
              });
      },
      eventClick: function (info) {
          alert('Wydarzenie: ' + info.event.title);
      }
  });

  calendar.render();
  loadUserAvailability();
});

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('en-GB', {
      day: '2-digit',   // np. "03"
      month: 'short',   // np. "Feb"
      hour: '2-digit',  // np. "14"
      minute: '2-digit',// np. "00"
      hour12: false     // Format 24h
  });
}



// Funkcja do pobierania dostępności i wyświetlania listy pod kalendarzem
async function loadUserAvailability() {
  const availabilityList = document.getElementById('availability-list');

  try {
      const response = await fetch('/users/e0767d15-acc0-47ce-8e36-5e7b993ed633/availabilities');
      if (!response.ok) {
          throw new Error('Failed to fetch availabilities');
      }
      const availabilities = await response.json();

      console.log("response", response);

      // Czyszczenie listy przed załadowaniem nowych danych
      availabilityList.innerHTML = "";

      if (availabilities.length === 0) {
          availabilityList.innerHTML = "<p>No availability added.</p>";
          return;
      }

      availabilities.forEach(availability => {
          const listItem = document.createElement('li');
          listItem.innerHTML = `
              <span>${new Date(availability.startTime).toLocaleString()} - ${new Date(availability.endTime).toLocaleString()}</span>
              <button class="red" onclick="deleteAvailability('${availability.availabilityId}')">
                  <img src="/icons/delete.png" alt="Delete" class="white-icon">
              </button>
          `;
          availabilityList.appendChild(listItem);
      });

  } catch (error) {
      console.error('Error fetching availability:', error.message);
      availabilityList.innerHTML = "<p>Failed to load availability.</p>";
  }
}

  

// Funkcja do wyświetlania pop-upu z formularzem dodawania dostępności
function showAddAvailabilityPopup() {
  const popupContent = `
      <label for="startTime">Start Time:</label>
      <input type="text" id="startTime" placeholder="Select start date and time"><br>
      
      <label for="endTime">End Time:</label>
      <input type="text" id="endTime" placeholder="Select end date and time">
  `;

  showPopup(
      'Add Availability',
      popupContent,
      'Save',
      'Cancel',
      () => addAvailability()
  );

const now = new Date();
now.setMinutes(0, 0, 0); // Ustawienie minut, sekund i milisekund na 0 (pełna godzina)

const tomorrow = new Date(now);
tomorrow.setDate(now.getDate() + 1);

  // Inicjalizacja Flatpickr dla startTime (pełna data i godzina)
  flatpickr("#startTime", {
      enableTime: true, // Włącz wybór czasu
      dateFormat: "Y-m-d H:i", // Format: rok-miesiąc-dzień godzina:minuta
      time_24hr: true, // Użyj formatu 24-godzinnego
      minuteIncrement: false, // Pozwól na wybór minut
      defaultDate: now, // Domyślna data to teraz
  });

  // Inicjalizacja Flatpickr dla endTime (pełna data i godzina)
  flatpickr("#endTime", {
      enableTime: true,
      dateFormat: "Y-m-d H:i",
      time_24hr: true,
      minuteIncrement: 0,
      defaultDate: tomorrow,
  });
}

// Funkcja do wysyłania dostępności do API
async function addAvailability() {
  const startTime = document.getElementById('startTime').value;
  const endTime = document.getElementById('endTime').value;
  const userId = 'e0767d15-acc0-47ce-8e36-5e7b993ed633'; // Mockowany userId

  if (!startTime || !endTime) {
      alert('Please select both start and end times.');
      return;
  }

  // Przekształć czas na format ISO (wymagany przez API)
  const startDate = new Date(startTime).toISOString();
  const endDate = new Date(endTime).toISOString();

  try {
      const payload = {
          startTime: startDate,
          endTime: endDate
      };

      const response = await fetch(`/users/${userId}/availabilities`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
      });

      if (!response.ok) {
          throw new Error('Failed to add availability');
      }

      alert('Availability added successfully!');
      location.reload(); // Odświeżenie strony po dodaniu dostępności
  } catch (error) {
      console.error('Error adding availability:', error.message);
      alert('Failed to add availability. Please try again.');
  }
}

function showDeleteAvailabilityPopup(availabilityId) {
  const popupContent = `
      <p>Are you sure you want to delete this availability?</p>
  `;

  showPopup(
      'Delete Availability',
      popupContent,
      'Yes',
      'No',
      () => deleteAvailability(availabilityId) // Wywołujemy funkcję usuwania po potwierdzeniu
  );
}

async function deleteAvailability(availabilityId) {
  const userId = 'e0767d15-acc0-47ce-8e36-5e7b993ed633';
  console.log(availabilityId,userId)
  try {
      const response = await fetch(`/users/${userId}/availabilities/${availabilityId}`, {
          method: 'DELETE',
          headers: {
              'Content-Type': 'application/json',
          }
      });

      if (response.status === 204) {
          console.log(`Availability ${availabilityId} deleted successfully.`);

          // Usunięcie elementu z listy bez przeładowania strony
          document.getElementById(`availability-${availabilityId}`)?.remove();

          // Odświeżenie kalendarza
          location.reload();
      } else {
          throw new Error(`Failed to delete availability. Status: ${response.status}`);
      }
  } catch (error) {
      console.error('Error deleting availability:', error.message);
      alert('Failed to delete availability. Please try again.');
  }
}

