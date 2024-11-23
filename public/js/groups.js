
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
        alert(`User with email ${emailToAdd} has been added to the group!`); // Wyświetl komunikat o sukcesie
        location.reload(); // Odśwież stronę, aby zaktualizować listę członków
    } catch (error) {
        console.error('Error adding member:', error.message);
        alert('Failed to add member. Please try again.');
    }
}

function showChangeRolePopup(memberId, currentRole) {
    const popupContent = `
        <label for="newRole">New role:</label>
        <select id="newRole">
            <option value="1" ${currentRole == 1 ? 'selected' : ''}>Cofounder</option>
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

        alert('Role updated successfully');
        location.reload();
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
        () => updateGroupName(groupId)
    );
}

function showDeleteGroupPopup(memberId, currentRole) {
    // Zdefiniuj treść pop-upu z select
    const popupContent = `
        Are you sure?
    `;

    // Wywołaj funkcję do wyświetlenia pop-upu
    showPopup(
        'Delete Gruop', 
        popupContent, 
        'Yes',
        'No', 
        () => updateRole(memberId)
    );
}

function showRemoveMemberPopup(memberId) {
    // Zdefiniuj treść pop-upu z select
    const popupContent = `
        Are you sure?
    `;

    // Wywołaj funkcję do wyświetlenia pop-upu
    showPopup(
        'Remove User From Group ', 
        popupContent, 
        'Yes',
        'No', 
        () => updateRole(memberId)
    );
}

window.showChangeRolePopup = showChangeRolePopup;
window.showAddMemberPopup = showAddMemberPopup;
window.addMember = addMember;
