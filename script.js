var socket = io(); // Connects to your server's Socket.IO instance

function toggleOtherReasonField() {
    var reason = document.getElementById('warningReason').value;
    var otherReasonDiv = document.getElementById('otherReason');
    if (reason === 'Other') {
        otherReasonDiv.style.display = 'block';
    } else {
        otherReasonDiv.style.display = 'none';
        document.getElementById('otherText').value = ''; // Clear the input if 'Other' is not selected
    }
}

// Listen for 'warnings-updated' event from the server
socket.on('warnings-updated', (updatedWarningsList) => {
    console.log("Received updated warnings list:", updatedWarningsList); // For debugging
    updateWarningsDisplay(updatedWarningsList);
});

function updateWarningsDisplay(warningsList) {
    const warningsDisplay = document.getElementById('warningsDisplay');
    warningsDisplay.innerHTML = ''; // Clear the display before updating

    Object.values(warningsList).forEach(child => {
        // Construct the display element for each child
        const childElement = document.createElement('div');
        
        // Append the childElement to warningsDisplay before setting innerHTML to avoid overwriting events
        warningsDisplay.appendChild(childElement);
        
        // Create reset button
        const resetButton = document.createElement('button');
        resetButton.textContent = 'Reset';
        resetButton.addEventListener('click', function() {
            resetChildWarnings(child.name, child.yearGroup);
        });

        // Construct the warnings list HTML
        const warningsListHTML = child.warnings.map(warning => `<li>${warning}</li>`).join('');
        const outMessage = child.outUntil ? ` - Out until ${new Date(child.outUntil).toLocaleDateString()}` : '';
        const warningsCount = child.warnings.length;

        // Set innerHTML for childElement
        childElement.innerHTML = `
            <strong>${child.name} (${child.yearGroup}) - Warnings: ${warningsCount}${outMessage}</strong>
            <ul>${warningsListHTML}</ul>
        `;
        
        // Append resetButton to childElement
        childElement.appendChild(resetButton);
    });
}

function resetChildWarnings(name, yearGroup) {
    // Emit the 'reset-warning' event to the server with the child's name and year group
    socket.emit('reset-warning', {
        childName: name,
        yearGroup: yearGroup
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('warningForm');

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Get form values
        const childName = document.getElementById('childName').value.trim();
        const yearGroup = document.getElementById('yearGroup').value;
        const warningReasonSelect = document.getElementById('warningReason');
        const warningReason = warningReasonSelect.value;
        const otherText = document.getElementById('otherText').value.trim();
        const warningMessage = warningReason === 'Other' ? otherText : warningReason;

        // Emit the 'add-warning' event to the server with the form data
        socket.emit('add-warning', {
            childName: childName,
            yearGroup: yearGroup,
            warning: warningMessage
        });

        // Reset form after submission
        form.reset();
        toggleOtherReasonField(); // Ensure the "other reason" field is hidden if it was shown
    });
});
