document.addEventListener('DOMContentLoaded', function () {
    var calendarEl = document.getElementById('calendar');
  
    var calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      events: function (fetchInfo, successCallback, failureCallback) {
        const userId = 'e0767d15-acc0-47ce-8e36-5e7b993ed633'; // Mockowany userId
  
        // Pobierz dostępności
        fetch(`/users/${userId}/availabilities`)
          .then(response => {
            if (!response.ok) {
              throw new Error('Failed to fetch availabilities');
            }
            return response.json();
          })
          .then(availabilities => {
            // Pobierz nadchodzące wydarzenia
            fetch(`/users/events/${userId}/upcoming`)
              .then(response => {
                if (!response.ok) {
                  throw new Error('Failed to fetch upcoming events');
                }
                return response.json();
              })
              .then(upcomingEvents => {
                // Połącz dane i przekaż do kalendarza
                const events = [
                  // Dostępności (zielone)
                  ...availabilities.map(availability => ({
                    title: `🕒 ${formatDate(availability.startTime)} - ${formatDate(availability.endTime)}`,
                    start: availability.startTime,
                    end: availability.endTime,
                    allDay: false,
                    classNames: ['availabilities-event']
                  })),
                  // Nadchodzące wydarzenia (czerwone)
                  ...upcomingEvents.map(event => ({
                    title: `🎉 ${formatDate(event.startDate)} ${event.name}`,
                    start: event.startDate,
                    end: event.endDate || event.startDate, // Jeśli nie ma endDate, użyj startDate
                    allDay: false,
                    classNames: ['upcoming-event']
                  })),
                ];
  
                successCallback(events);
              })
              .catch(error => {
                console.error(error);
                failureCallback(error);
              });
          })
          .catch(error => {
            console.error( error);
            failureCallback(error);
          });
      },
      eventClick: function (info) {
        alert(info.event.title);
      }
    });
  
    calendar.render();
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