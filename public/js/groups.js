
function showAddMemberPopup(groupId) {
    showPopup(
        'Add Member',
        '<input type="text" id="inputMember" placeholder="Enter User Email">', // Zmieniono placeholder na e-mail
        'Add Member',
        'Cancel',
        () => addMember(groupId) // Przekaż ID grupy do funkcji addMember
    );
  }

async function addMember(groupId) {
    const emailToAdd = document.getElementById('inputMember').value; // Pobierz wpisany e-mail użytkownika

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
        alert(`User with email ${emailToAdd} has been added to the group!`); // Wyświetl komunikat o sukcesie
        location.reload(); // Odśwież stronę, aby zaktualizować listę członków
    } catch (error) {
        console.error('Error adding member:', error.message);
        alert('Failed to add member. Please try again.');
    }
}

function showChangeRolePopup(memberId, currentRole) {
    // Zdefiniuj treść pop-upu z select
    const popupContent = `
        <label for="newRole">New role:</label>
        <select id="newRole">
            <option value="1" ${currentRole == 1 ? 'selected' : ''}>Cofounder</option>
            <option value="2" ${currentRole == 2 ? 'selected' : ''}>Member</option>
        </select>
    `;

    // Wywołaj funkcję do wyświetlenia pop-upu
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

        alert('Role updated successfully');
        location.reload();
    } catch (error) {
        console.error('Error updating role:', error.message);
        alert('Failed to update role. Please try again.');
    }
}



window.showChangeRolePopup = showChangeRolePopup;
window.showAddMemberPopup = showAddMemberPopup;
window.addMember = addMember;
