let temperatureChart;

async function fetchTemperatureHistory() {
    try {
        const response = await fetch('/api/weather/history');
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        return data.history;
    } catch (error) {
        console.error('Error fetching temperature history:', error);
        return [];
    }
}

function formatDateTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
}

function updateTemperatureStats(history) {
    if (!history || history.length === 0) return;
    
    // Calculate statistics
    const temps = history.map(record => record.main.temp);
    const maxTemp = Math.max(...temps);
    const minTemp = Math.min(...temps);
    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
    const tempRange = maxTemp - minTemp;
    
    // Find timestamps for max and min
    const maxTempRecord = history.find(record => record.main.temp === maxTemp);
    const minTempRecord = history.find(record => record.main.temp === minTemp);
    
    // Update UI
    document.getElementById('maxTemp').textContent = `${maxTemp.toFixed(1)}°C`;
    document.getElementById('minTemp').textContent = `${minTemp.toFixed(1)}°C`;
    document.getElementById('avgTemp').textContent = `${avgTemp.toFixed(1)}°C`;
    document.getElementById('tempRange').textContent = `${tempRange.toFixed(1)}°C`;
    
    document.getElementById('maxTempTime').textContent = formatDateTime(maxTempRecord.dt);
    document.getElementById('minTempTime').textContent = formatDateTime(minTempRecord.dt);
}

function initTemperatureChart(history) {
    const ctx = document.getElementById('temperatureChart').getContext('2d');
    
    // Prepare data
    const labels = history.map(record => new Date(record.dt * 1000));
    const temperatures = history.map(record => record.main.temp);
    
    // Destroy existing chart if it exists
    if (temperatureChart) {
        temperatureChart.destroy();
    }
    
    // Create new chart
    temperatureChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperature (°C)',
                data: temperatures,
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Temperature History (Last 24 Hours)'
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'hour',
                        displayFormats: {
                            hour: 'HH:mm'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Time'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Temperature (°C)'
                    }
                }
            }
        }
    });
}

async function updateTemperatureData() {
    const history = await fetchTemperatureHistory();
    if (history && history.length > 0) {
        updateTemperatureStats(history);
        initTemperatureChart(history);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    updateTemperatureData();
    
    // Update data every 5 minutes
    setInterval(updateTemperatureData, 5 * 60 * 1000);
});
