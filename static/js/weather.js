// Initialize map
function initMap(lat, lon) {
    const map = L.map('map').setView([lat, lon], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: 'OpenStreetMap contributors'
    }).addTo(map);

    // Add marker for farm location
    L.marker([lat, lon])
        .addTo(map)
        .bindPopup('Farm Location - Alentejo Region')
        .openPopup();

    return map;
}

function getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(((degrees %= 360) < 0 ? degrees + 360 : degrees) / 22.5) % 16;
    return `${degrees}° ${directions[index]}`;
}

function formatTime(timestamp) {
    return new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
    
    return beaufortScale.find(b => windSpeed <= b.maxSpeed);
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
            class: ''
        };
    }
    return null;
}

function generateRecommendations(weatherData) {
    const temp = weatherData.main.temp;
    const humidity = weatherData.main.humidity;
    const windSpeed = weatherData.wind.speed;
    const description = weatherData.weather[0].description.toLowerCase();
    const rain = weatherData.rain ? weatherData.rain['1h'] : 0;

    // 1. Crop Management
    let cropRec = "Monitor crop growth and development";
    if (temp < 10) {
        cropRec = "Protect sensitive crops from frost damage";
    } else if (temp > 30) {
        cropRec = "Watch for signs of heat stress in crops";
    } else if (temp >= 20 && temp <= 25) {
        cropRec = "Optimal conditions for crop development";
    }

    // 2. Water Management
    let waterRec = "Maintain regular irrigation schedule";
    if (rain > 0) {
        waterRec = `Rainfall detected (${rain}mm). Adjust irrigation accordingly`;
    } else if (humidity < 30) {
        waterRec = "Increase irrigation to combat low humidity";
    } else if (humidity > 80) {
        waterRec = "Reduce irrigation due to high humidity";
    }

    // 3. Field Operations
    let operationsRec = "Conditions suitable for general field work";
    if (windSpeed > 10) {
        operationsRec = "High winds - postpone spraying activities";
    } else if (description.includes('rain')) {
        operationsRec = "Wet conditions - focus on indoor tasks";
    } else if (description.includes('clear') && windSpeed < 5) {
        operationsRec = "Perfect conditions for spraying operations";
    }

    // 4. Risk Management
    let riskRec = "No significant risks identified";
    if (humidity > 80 && temp > 20) {
        riskRec = "High disease risk - monitor crop health";
    } else if (windSpeed > 15) {
        riskRec = "Strong winds - check for structural damage";
    } else if (rain > 10) {
        riskRec = "Heavy rain - monitor field drainage";
    }

    return [
        { icon: 'seedling', text: cropRec },
        { icon: 'tint', text: waterRec },
        { icon: 'tractor', text: operationsRec },
        { icon: 'exclamation-triangle', text: riskRec }
    ];
}

function calculateSunTimes(sunrise, sunset) {
    const now = new Date();
    const sunriseDate = new Date(sunrise * 1000);
    const sunsetDate = new Date(sunset * 1000);
    
    // Calculate daylight hours
    const daylightHours = (sunset - sunrise) / 3600;
    
    // Calculate progress of the day
    const totalDaySeconds = sunset - sunrise;
    const currentSeconds = now.getTime() / 1000 - sunrise;
    const progress = Math.min(100, Math.max(0, (currentSeconds / totalDaySeconds) * 100));
    
    // Calculate civil dawn/dusk (about 30 minutes before sunrise/after sunset)
    const civilDawn = sunrise - 1800; // 30 minutes before sunrise
    const civilDusk = sunset + 1800; // 30 minutes after sunset
    
    // Calculate golden hours (about 1 hour after sunrise and 1 hour before sunset)
    const morningGoldenHour = sunrise + 3600; // 1 hour after sunrise
    const eveningGoldenHour = sunset - 3600; // 1 hour before sunset
    
    // Calculate time until next sunrise/sunset
    let sunriseTimeLeft = '';
    let sunsetTimeLeft = '';
    
    if (now < sunriseDate) {
        const diff = sunriseDate - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        sunriseTimeLeft = `Sunrise in ${hours}h ${minutes}m`;
    } else {
        sunriseTimeLeft = 'Sunrise has passed';
    }
    
    if (now < sunsetDate) {
        const diff = sunsetDate - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        sunsetTimeLeft = `Sunset in ${hours}h ${minutes}m`;
    } else {
        sunsetTimeLeft = 'Sunset has passed';
    }
    
    return {
        daylightHours: daylightHours.toFixed(1),
        progress,
        sunriseTimeLeft,
        sunsetTimeLeft,
        civilDawn,
        civilDusk,
        morningGoldenHour,
        eveningGoldenHour,
        sunPosition: progress.toFixed(1)
    };
}

function updateWeatherDisplay(data) {
    // Main weather information
    document.getElementById('temperature').textContent = `${Math.round(data.weather.main.temp)}°C`;
    document.getElementById('description').textContent = data.weather.weather[0].description;
    document.getElementById('humidity').textContent = `${data.weather.main.humidity}%`;
    document.getElementById('wind').textContent = `${Math.round(data.weather.wind.speed * 3.6)} km/h`;

    // Detailed metrics
    document.getElementById('feels-like').textContent = `${Math.round(data.weather.main.feels_like)}°C`;
    document.getElementById('pressure').textContent = `${data.weather.main.pressure} hPa`;
    document.getElementById('visibility').textContent = `${(data.weather.visibility / 1000).toFixed(1)} km`;
    document.getElementById('rain').textContent = data.weather.rain ? `${data.weather.rain['1h']} mm` : '0 mm';

    // Wind information
    const windSpeed = Math.round(data.weather.wind.speed * 3.6); // Convert m/s to km/h
    const windDeg = data.weather.wind.deg || 0;
    const windGust = data.weather.wind.gust ? Math.round(data.weather.wind.gust * 3.6) : windSpeed + 5;
    
    // Update wind speed and direction
    document.getElementById('wind-speed').textContent = `${windSpeed} km/h`;
    document.getElementById('wind-direction').textContent = getWindDirection(windDeg);
    document.getElementById('wind-direction-icon').style.transform = `rotate(${windDeg}deg)`;
    
    // Update compass arrow with smooth rotation
    const compassArrow = document.getElementById('compass-arrow');
    compassArrow.style.transform = `rotate(${windDeg}deg)`;
    
    // Update additional wind details
    document.getElementById('wind-gusts').textContent = `${windGust} km/h`;
    
    const beaufort = getBeaufortScale(windSpeed);
    document.getElementById('beaufort-scale').textContent = `${beaufort.scale} - ${beaufort.description}`;
    document.getElementById('wind-conditions').textContent = beaufort.description;
    
    const windChill = calculateWindChill(data.weather.main.temp, windSpeed);
    document.getElementById('wind-chill').textContent = `${windChill}°C`;
    
    // Update wind advisory
    const advisory = getWindAdvisory(windSpeed, windGust);
    const advisoryElement = document.getElementById('wind-advisory');
    if (advisory) {
        advisoryElement.textContent = advisory.message;
        advisoryElement.className = `wind-advisory ${advisory.class}`;
        advisoryElement.style.display = 'block';
    } else {
        advisoryElement.style.display = 'none';
    }

    // Sun schedule
    document.getElementById('sunrise').textContent = formatTime(data.weather.sys.sunrise);
    document.getElementById('sunset').textContent = formatTime(data.weather.sys.sunset);
        
    // Calculate and update sun times
    const sunTimes = calculateSunTimes(data.weather.sys.sunrise, data.weather.sys.sunset);
    
    // Update basic info
    document.getElementById('sunrise-time-left').textContent = sunTimes.sunriseTimeLeft;
    document.getElementById('sunset-time-left').textContent = sunTimes.sunsetTimeLeft;
    document.getElementById('daylight-hours').textContent = `${sunTimes.daylightHours} hours of daylight`;
    document.getElementById('daylight-progress').style.width = `${sunTimes.progress}%`;
    
    // Update additional details
    document.getElementById('civil-dawn').textContent = formatTime(sunTimes.civilDawn);
    document.getElementById('civil-dusk').textContent = formatTime(sunTimes.civilDusk);
    document.getElementById('morning-golden-hour').textContent = formatTime(sunTimes.morningGoldenHour);
    document.getElementById('evening-golden-hour').textContent = formatTime(sunTimes.eveningGoldenHour);
    document.getElementById('dawn-time').textContent = formatTime(sunTimes.civilDawn);
    document.getElementById('dusk-time').textContent = formatTime(sunTimes.civilDusk);
    document.getElementById('sun-position').textContent = `Sun is ${sunTimes.sunPosition}% through the day`;

    // Update weather icon
    const iconMap = {
        '01d': 'sun',
        '01n': 'moon',
        '02d': 'cloud-sun',
        '02n': 'cloud-moon',
        '03d': 'cloud',
        '03n': 'cloud',
        '04d': 'clouds',
        '04n': 'clouds',
        '09d': 'cloud-showers-heavy',
        '09n': 'cloud-showers-heavy',
        '10d': 'cloud-sun-rain',
        '10n': 'cloud-moon-rain',
        '11d': 'bolt',
        '11n': 'bolt',
        '13d': 'snowflake',
        '13n': 'snowflake',
        '50d': 'smog',
        '50n': 'smog'
    };
    const iconCode = data.weather.weather[0].icon;
    const iconClass = iconMap[iconCode] || 'question';
    document.getElementById('weather-icon').innerHTML = 
        `<i class="fas fa-${iconClass}"></i>`;

    // Update recommendations
    const recommendationsList = document.getElementById('recommendations-list');
    const recommendations = generateRecommendations(data.weather);
    
    recommendationsList.innerHTML = recommendations
        .map(rec => `
            <div class="recommendation-item">
                <i class="fas fa-${rec.icon}"></i>
                <span>${rec.text}</span>
            </div>
        `)
        .join('');

    // Update timestamp
    document.getElementById('last-updated').textContent = 
        new Date().toLocaleString();
}

function fetchWeatherData() {
    fetch('/api/weather')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error:', data.error);
                return;
            }
            updateWeatherDisplay(data);
        })
        .catch(error => console.error('Error:', error));
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize map with farm coordinates
    const lat = document.getElementById('coordinates').dataset.lat;
    const lon = document.getElementById('coordinates').dataset.lon;
    initMap(lat, lon);

    // Initial fetch
    fetchWeatherData();

    // Refresh every 5 minutes
    setInterval(fetchWeatherData, 5 * 60 * 1000);
});
