async function addMember(groupId) {
    const emailToAdd = document.getElementById('inputMember').value; // Pobierz wpisany e-mail użytkownika

    if (!emailToAdd) {
        alert('Please enter a valid email address');
        return;
    }

    try {
        // Przygotuj dane do żądania
        const payload = {
            userId: { value: "" }, // Puste userId
            role: 0, // Domyślnie rola 0 (np. Member)
            groupId: { value: groupId }, // Przekaż ID grupy
            email: emailToAdd // Wpisany e-mail
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
        alert(`User with email ${emailToAdd} has been added to the group!`); // Wyświetl komunikat o sukcesie
        location.reload(); // Odśwież stronę, aby zaktualizować listę członków
    } catch (error) {
        console.error('Error adding member:', error.message);
        alert('Failed to add member. Please try again.');
    }
}

function showAddMemberPopup(groupId) {
    showPopup(
        'Add Member',
        '<input type="text" id="inputMember" placeholder="Enter User Email">', // Zmieniono placeholder na e-mail
        'Add Member',
        'Cancel',
        () => addMember(groupId) // Przekaż ID grupy do funkcji addMember
    );
  }

window.showAddMemberPopup = showAddMemberPopup;
window.addMember = addMember;
