// Initialize map
function initMap(lat, lon) {
    const map = L.map('map').setView([lat, lon], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: 'OpenStreetMap contributors'
    }).addTo(map);

    // Add marker for location
    L.marker([lat, lon])
        .addTo(map)
        .bindPopup('Porto Municipality')
        .openPopup();

    return map;
}

function getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(((degrees % 360) / 22.5));
    return directions[index % 16];
}

function getBeaufortScale(windSpeed) {
    const beaufortScale = [
        { scale: 0, description: 'Calm', maxSpeed: 1 },
        { scale: 1, description: 'Light air', maxSpeed: 5 },
        { scale: 2, description: 'Light breeze', maxSpeed: 11 },
        { scale: 3, description: 'Gentle breeze', maxSpeed: 19 },
        { scale: 4, description: 'Moderate breeze', maxSpeed: 28 },
        { scale: 5, description: 'Fresh breeze', maxSpeed: 38 },
        { scale: 6, description: 'Strong breeze', maxSpeed: 49 },
        { scale: 7, description: 'High wind', maxSpeed: 61 },
        { scale: 8, description: 'Gale', maxSpeed: 74 },
        { scale: 9, description: 'Strong gale', maxSpeed: 88 },
        { scale: 10, description: 'Storm', maxSpeed: 102 },
        { scale: 11, description: 'Violent storm', maxSpeed: 117 },
        { scale: 12, description: 'Hurricane', maxSpeed: Infinity }
    ];
    
    const result = beaufortScale.find(b => windSpeed <= b.maxSpeed);
    return { scale: result.scale, description: result.description };
}

function getWindConditions(windSpeed) {
    // Wind speed in km/h
    if (windSpeed < 6) return "Very light";
    if (windSpeed < 12) return "Light";
    if (windSpeed < 20) return "Gentle";
    if (windSpeed < 29) return "Moderate";
    if (windSpeed < 39) return "Fresh";
    if (windSpeed < 50) return "Strong";
    if (windSpeed < 62) return "Near Gale";
    if (windSpeed >= 62) return "Gale or stronger";
    return "Unknown";
}

function updateWindDisplay(data) {
    const windSpeed = data.wind.speed * 3.6; // Convert m/s to km/h
    const windDeg = data.wind.deg;
    const windGust = data.wind.gust ? data.wind.gust * 3.6 : windSpeed + 5;
    const direction = getWindDirection(windDeg);
    const beaufort = getBeaufortScale(windSpeed);
    const conditions = getWindConditions(windSpeed);

    // Update wind speed and direction
    const windSpeedElement = document.getElementById('wind-speed');
    if (windSpeedElement) {
        windSpeedElement.textContent = `${windSpeed.toFixed(1)} km/h`;
    }

    const windDirectionElement = document.getElementById('wind-direction');
    if (windDirectionElement) {
        windDirectionElement.textContent = `${direction} (${windDeg}°)`;
    }

    // Update compass arrow
    const compassArrow = document.getElementById('compass-arrow');
    if (compassArrow) {
        compassArrow.style.transform = `rotate(${windDeg}deg)`;
    }

    // Update direction icon
    const directionIcon = document.getElementById('wind-direction-icon');
    if (directionIcon) {
        directionIcon.style.transform = `rotate(${windDeg}deg)`;
    }

    // Update wind details
    const elements = {
        'wind-gusts': `${windGust.toFixed(1)} km/h`,
        'beaufort-scale': `${beaufort.scale} - ${beaufort.description}`,
        'wind-conditions': conditions,
        'wind-chill': `${Math.round(data.main.feels_like)}°C`
    };

    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });

    // Update wind advisory
    const advisoryElement = document.getElementById('wind-advisory');
    if (advisoryElement) {
        if (windSpeed >= 50 || windGust >= 75) {
            advisoryElement.className = 'wind-advisory mt-3 alert alert-danger';
            advisoryElement.textContent = 'Strong wind warning! Exercise caution outdoors.';
        } else if (windSpeed >= 30 || windGust >= 50) {
            advisoryElement.className = 'wind-advisory mt-3 alert alert-warning';
            advisoryElement.textContent = 'Moderate wind alert. Be aware of gusty conditions.';
        } else {
            advisoryElement.style.display = 'none';
        }
    }
}

function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function calculateWindChill(temp, windSpeed) {
    // Wind chill is only valid for temperatures at or below 10°C (50°F)
    // and wind speeds above 4.8 km/h (3 mph)
    if (temp > 10 || windSpeed < 4.8) {
        return temp;
    }
    
    // Formula: 13.12 + 0.6215T - 11.37V^0.16 + 0.3965TV^0.16
    // where T is temperature in °C and V is wind speed in km/h
    const windChill = 13.12 + 
        0.6215 * temp - 
        11.37 * Math.pow(windSpeed, 0.16) + 
        0.3965 * temp * Math.pow(windSpeed, 0.16);
        
    return Math.round(windChill);
}

function getWindAdvisory(windSpeed, gusts) {
    if (gusts >= 75 || windSpeed >= 60) {
        return {
            message: 'Dangerous wind conditions. Avoid outdoor activities and secure loose objects.',
            class: 'danger'
        };
    } else if (gusts >= 50 || windSpeed >= 40) {
        return {
            message: 'Strong winds may affect outdoor activities. Exercise caution.',
            class: 'warning'
        };
    } else if (windSpeed >= 20) {
        return {
            message: 'Moderate winds present. Consider wind direction for field operations.',
            class: 'info'
        };
    }
    return null;
}

function calculateSunTimes(sunriseTimestamp, sunsetTimestamp) {
    // Get today's date at midnight UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayTimestamp = Math.floor(today.getTime() / 1000);
    
    // Extract hours and minutes from the timestamps
    const sunriseTime = new Date(sunriseTimestamp * 1000);
    const sunsetTime = new Date(sunsetTimestamp * 1000);
    
    // Create new timestamps for today
    const sunrise = todayTimestamp + 
        sunriseTime.getUTCHours() * 3600 + 
        sunriseTime.getUTCMinutes() * 60;
    const sunset = todayTimestamp + 
        sunsetTime.getUTCHours() * 3600 + 
        sunsetTime.getUTCMinutes() * 60;
    
    // Calculate civil dawn (30 minutes before sunrise)
    const civilDawn = sunrise - 1800;
    
    // Calculate civil dusk (30 minutes after sunset)
    const civilDusk = sunset + 1800;
    
    // Calculate golden hours
    const morningGoldenHour = sunrise + 3600; // 1 hour after sunrise
    const eveningGoldenHour = sunset - 3600; // 1 hour before sunset
    
    const now = Math.floor(Date.now() / 1000);
    
    // Calculate daylight hours
    const daylightSeconds = sunset - sunrise;
    const daylightHours = daylightSeconds / 3600;
    
    // Calculate progress through the day
    let progress = 0;
    if (now < sunrise) {
        progress = 0;
    } else if (now > sunset) {
        progress = 100;
    } else {
        progress = ((now - sunrise) / daylightSeconds) * 100;
    }
    
    return {
        daylightHours: daylightHours.toFixed(1),
        progress: Math.min(100, Math.max(0, progress)),
        sunrise,
        sunset,
        civilDawn,
        civilDusk,
        morningGoldenHour,
        eveningGoldenHour
    };
}

async function fetchWeatherData() {
    try {
        const response = await fetch('/api/weather');
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        
        // Update the display with weather data
        updateWeatherDisplay(data.weather);
        // Update recommendations
        updateRecommendations(data.recommendations);
        
    } catch (error) {
        console.error('Error fetching weather:', error);
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.textContent = `Error: ${error.message}`;
            errorDiv.style.display = 'block';
        }
    }
}

function formatDateTime(timestamp) {
    // Check if timestamp is a string in ISO format (from database)
    if (typeof timestamp === 'string') {
        return new Date(timestamp).toLocaleString();
    }
    // If it's a Unix timestamp (number)
    return new Date(timestamp * 1000).toLocaleString();
}

function updateWeatherDisplay(data) {
    try {
        // Main weather information
        const elements = {
            'temperature': `${Math.round(data.main.temp)}°C`,
            'description': data.weather[0].description,
            'humidity': `${data.main.humidity}%`,
            'wind': `${(data.wind.speed * 3.6).toFixed(1)} km/h`,
            'feels-like': `${Math.round(data.main.feels_like)}°C`,
            'pressure': `${data.main.pressure} hPa`,
            'visibility': typeof data.visibility === 'number' ? `${(data.visibility / 1000).toFixed(1)} km` : 'N/A',
            'rain': data.rain ? `${data.rain['1h']} mm` : '0 mm'
        };

        // Update elements that exist in the DOM
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });

        // Update wind information
        updateWindDisplay(data);

        // Weather icon
        const iconElement = document.getElementById('weather-icon');
        if (iconElement) {
            const iconClass = getWeatherIcon(data.weather[0].description);
            iconElement.innerHTML = `<i class="fas fa-${iconClass} fa-3x"></i>`;
        }

        // Sun information
        if (data.sys && data.sys.sunrise && data.sys.sunset) {
            const sunTimes = calculateSunTimes(data.sys.sunrise, data.sys.sunset);
            
            // Update daylight information
            const daylightHoursElement = document.getElementById('daylight-hours');
            if (daylightHoursElement) {
                daylightHoursElement.textContent = `${sunTimes.daylightHours} hours of daylight`;
            }

            const sunPositionElement = document.getElementById('sun-position');
            if (sunPositionElement) {
                sunPositionElement.textContent = `Sun is ${sunTimes.progress.toFixed(1)}% through the day`;
            }

            // Update dawn and dusk times in the progress bar
            const dawnTimeElement = document.getElementById('dawn-time');
            if (dawnTimeElement) {
                dawnTimeElement.textContent = formatTime(sunTimes.civilDawn);
            }

            const duskTimeElement = document.getElementById('dusk-time');
            if (duskTimeElement) {
                duskTimeElement.textContent = formatTime(sunTimes.civilDusk);
            }

            const sunElements = {
                'sunrise': formatTime(sunTimes.sunrise),
                'sunset': formatTime(sunTimes.sunset),
                'sunrise-time-left': getTimeUntil(sunTimes.sunrise),
                'sunset-time-left': getTimeUntil(sunTimes.sunset),
                'civil-dawn': formatTime(sunTimes.civilDawn),
                'civil-dusk': formatTime(sunTimes.civilDusk),
                'morning-golden-hour': formatTime(sunTimes.morningGoldenHour),
                'evening-golden-hour': formatTime(sunTimes.eveningGoldenHour)
            };

            Object.entries(sunElements).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = value;
                }
            });

            // Update progress bar if it exists
            const progressBar = document.getElementById('daylight-progress');
            if (progressBar) {
                progressBar.style.width = `${sunTimes.progress}%`;
            }
        }

        // Last updated
        const lastUpdated = document.getElementById('last-updated');
        if (lastUpdated && data.timestamp) {
            lastUpdated.textContent = formatDateTime(data.timestamp);
        }

    } catch (error) {
        console.error('Error updating display:', error);
    }
}

function getTimeUntil(timestamp) {
    const now = Math.floor(Date.now() / 1000);
    
    const diff = timestamp - now;
    
    if (diff < 0) {
        return 'Passed';
    }
    
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    
    if (hours === 0) {
        return `In ${minutes}m`;
    }
    
    return `In ${hours}h ${minutes}m`;
}

function getWeatherIcon(description) {
    description = description.toLowerCase();
    if (description.includes('rain')) return 'cloud-rain';
    if (description.includes('snow')) return 'snowflake';
    if (description.includes('cloud')) return 'cloud';
    if (description.includes('clear')) return 'sun';
    if (description.includes('thunder')) return 'bolt';
    if (description.includes('fog') || description.includes('mist')) return 'smog';
    return 'cloud';
}

function updateRecommendations(recommendations) {
    const recommendationsContainer = document.getElementById('recommendations-list');
    if (!recommendationsContainer) {
        console.error('Recommendations container not found');
        return;
    }
    
    // Clear existing content
    recommendationsContainer.innerHTML = '';
    
    if (!recommendations || recommendations.length === 0) {
        recommendationsContainer.innerHTML = '<p class="text-center text-muted">No recommendations at this time.</p>';
        return;
    }
    
    // Group recommendations by category
    const groupedRecs = recommendations.reduce((acc, rec) => {
        if (!acc[rec.category]) {
            acc[rec.category] = [];
        }
        acc[rec.category].push(rec);
        return acc;
    }, {});
    
    // Create a list for each category
    Object.entries(groupedRecs).forEach(([category, recs]) => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'recommendation-category mb-3';
        
        const categoryTitle = document.createElement('h6');
        categoryTitle.className = 'text-primary mb-2 d-flex align-items-center';
        categoryTitle.innerHTML = `<i class="fas fa-${getCategoryIcon(category)} me-2"></i> ${formatCategory(category)}`;
        categoryDiv.appendChild(categoryTitle);
        
        const recList = document.createElement('ul');
        recList.className = 'list-unstyled mb-0';
        
        recs.forEach(rec => {
            const recItem = document.createElement('li');
            recItem.className = 'mb-2 p-2 bg-light rounded';
            const priorityIcon = rec.priority === 1 ? 'exclamation-triangle text-warning' : 'info-circle text-info';
            recItem.innerHTML = `
                <div class="d-flex align-items-start">
                    <i class="fas fa-${priorityIcon} me-2 mt-1"></i>
                    <span>${rec.text}</span>
                </div>
            `;
            
            recList.appendChild(recItem);
        });
        
        categoryDiv.appendChild(recList);
        recommendationsContainer.appendChild(categoryDiv);
    });
}

function getCategoryIcon(category) {
    const icons = {
        'temperature': 'thermometer-half',
        'humidity': 'tint',
        'wind': 'wind',
        'rain': 'cloud-rain',
        'default': 'info-circle'
    };
    return icons[category] || icons.default;
}

function formatCategory(category) {
    return category.charAt(0).toUpperCase() + category.slice(1);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get initial weather data
    fetchWeatherData();
    
    // Update weather data every 5 minutes
    setInterval(fetchWeatherData, 5 * 60 * 1000);
    
    // Add refresh button handler
    const refreshButton = document.getElementById('refresh-weather');
    if (refreshButton) {
        refreshButton.addEventListener('click', async function() {
            try {
                this.disabled = true;
                const icon = this.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-spinner fa-spin';
                }
                await fetchWeatherData();
            } catch (error) {
                console.error('Error refreshing weather:', error);
            } finally {
                this.disabled = false;
                const icon = this.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-sync-alt';
                }
            }
        });
    }
});

// Initialize map with farm coordinates
const coordinates = document.getElementById('coordinates');
if (coordinates) {
    const lat = coordinates.dataset.lat;
    const lon = coordinates.dataset.lon;
    if (lat && lon) {
        window.weatherMap = initMap(parseFloat(lat), parseFloat(lon));
    }
}
