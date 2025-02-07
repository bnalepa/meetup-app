function addNewGroup() {
    const popupContent = `
        <label for="groupName">Group Name:</label>
        <input type="text" id="groupName" placeholder="Enter group name">
    `;

    showPopup(
        'Create New Group',
        popupContent,
        'Create',
        'Cancel',
        async () => {
            await createGroup();
            location.reload(); 
        }
    );
}

async function createGroup() {
    const groupName = document.getElementById('groupName').value;

    if (!groupName ) {
        alert('Group name is required.');
        return;
    }

    try {
        const response = await fetch('/groups', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: groupName,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to create group');
        }

        alert('Group created successfully!');
        location.reload();
    } catch (error) {
        console.error('Error creating group:', error.message);
        alert('Failed to create group. Please try again.');
    }
}
