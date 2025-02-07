async function vote(eventId, venueId, decision) {

    const payload = {
        venueId: { value: venueId },
        decision: decision // true = upVote, false = downVote
    };

    try {
        const response = await fetch(`/events/${eventId}/vote`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Failed to vote. Status: ${response.status}`);
        }

        const data = await response.json();
        location.reload(); 
    } catch (error) {
        console.error("Error voting:", error.message);
    }
}

// 🔹 Funkcja do głosowania na TAK
function upVote(eventId, venueId) {
    vote(eventId, venueId, true);
}

// 🔹 Funkcja do głosowania na NIE
function downVote(eventId, venueId) {
    vote(eventId, venueId, false);
}
