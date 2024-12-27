let humidityChart;

async function fetchHumidityHistory() {
    try {
        const response = await fetch('/api/weather/history');
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        return data.history;
    } catch (error) {
        console.error('Error fetching humidity history:', error);
        return [];
    }
}

function formatDateTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
}

function updateHumidityStats(history) {
    if (!history || history.length === 0) return;
    
    // Calculate statistics
    const humidities = history.map(record => record.main.humidity);
    const maxHumidity = Math.max(...humidities);
    const minHumidity = Math.min(...humidities);
    const avgHumidity = humidities.reduce((a, b) => a + b, 0) / humidities.length;
    const humidityRange = maxHumidity - minHumidity;
    
    // Find timestamps for max and min
    const maxHumidityRecord = history.find(record => record.main.humidity === maxHumidity);
    const minHumidityRecord = history.find(record => record.main.humidity === minHumidity);
    
    // Update UI
    document.getElementById('maxHumidity').textContent = `${maxHumidity}%`;
    document.getElementById('minHumidity').textContent = `${minHumidity}%`;
    document.getElementById('avgHumidity').textContent = `${avgHumidity.toFixed(1)}%`;
    document.getElementById('humidityRange').textContent = `${humidityRange}%`;
    
    document.getElementById('maxHumidityTime').textContent = formatDateTime(maxHumidityRecord.dt);
    document.getElementById('minHumidityTime').textContent = formatDateTime(minHumidityRecord.dt);
}

function initHumidityChart(history) {
    const ctx = document.getElementById('humidityChart').getContext('2d');
    
    // Prepare data
    const labels = history.map(record => new Date(record.dt * 1000));
    const humidities = history.map(record => record.main.humidity);
    
    // Destroy existing chart if it exists
    if (humidityChart) {
        humidityChart.destroy();
    }
    
    // Create new chart
    humidityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Humidity (%)',
                data: humidities,
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
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
                    text: 'Humidity History (Last 24 Hours)'
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
                        text: 'Humidity (%)'
                    },
                    min: 0,
                    max: 100
                }
            }
        }
    });
}

async function updateHumidityData() {
    const history = await fetchHumidityHistory();
    if (history && history.length > 0) {
        updateHumidityStats(history);
        initHumidityChart(history);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    updateHumidityData();
    
    // Update data every 5 minutes
    setInterval(updateHumidityData, 5 * 60 * 1000);
});
