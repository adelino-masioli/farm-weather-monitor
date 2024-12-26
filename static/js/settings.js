// Load settings from server
async function loadSettings() {
    try {
        const response = await fetch('/api/settings');
        const settings = await response.json();
        
        if (settings.error) {
            throw new Error(settings.error);
        }
        
        // Units
        document.querySelector(`input[name="units"][value="${settings.units}"]`).checked = true;
        
        // Update frequency
        document.getElementById('updateFrequency').value = settings.update_frequency;
        
        // Farm location
        document.getElementById('latitude').value = settings.farm_latitude;
        document.getElementById('longitude').value = settings.farm_longitude;
        
    } catch (error) {
        console.error('Error loading settings:', error);
        alert('Error loading settings: ' + error.message);
    }
}

// Save settings to server
async function saveSettings(event) {
    event.preventDefault();
    
    // Get form values
    const settings = {
        units: document.querySelector('input[name="units"]:checked').value,
        update_frequency: parseInt(document.getElementById('updateFrequency').value),
        location: {
            latitude: parseFloat(document.getElementById('latitude').value),
            longitude: parseFloat(document.getElementById('longitude').value)
        }
    };
    
    try {
        // Save to server
        const response = await fetch('/api/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Show success message
        alert('Settings saved successfully!');
        
        // Reload page to apply changes
        window.location.reload();
        
    } catch (error) {
        console.error('Error saving settings:', error);
        alert('Error saving settings: ' + error.message);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load saved settings
    loadSettings();
    
    // Add form submit handler
    document.getElementById('settingsForm').addEventListener('submit', saveSettings);
});
