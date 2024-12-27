document.addEventListener('DOMContentLoaded', function() {
    // Get coordinates from the page
    const coordinates = document.getElementById('coordinates');
    const lat = parseFloat(coordinates.dataset.lat);
    const lon = parseFloat(coordinates.dataset.lon);

    // Initialize the map
    const map = L.map('farmMap').setView([lat, lon], 13);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add a marker for the farm location
    const farmMarker = L.marker([lat, lon]).addTo(map);
    farmMarker.bindPopup('<strong>Farm Location</strong><br>Weather monitoring station').openPopup();

    // Add a circle to show approximate coverage area (1km radius)
    L.circle([lat, lon], {
        color: 'blue',
        fillColor: '#30f',
        fillOpacity: 0.1,
        radius: 1000
    }).addTo(map);

    // Add weather layer if available
    fetch('https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=' + OPENWEATHER_API_KEY)
        .then(response => {
            if (response.ok) {
                L.tileLayer('https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=' + OPENWEATHER_API_KEY, {
                    maxZoom: 19,
                    opacity: 0.5
                }).addTo(map);
            }
        })
        .catch(error => console.log('Weather layer not available'));

    // Add map controls
    L.control.scale().addTo(map);

    // Add fullscreen button
    const fullscreenButton = L.control({position: 'topleft'});
    fullscreenButton.onAdd = function(map) {
        const btn = L.DomUtil.create('button', 'leaflet-bar leaflet-control leaflet-control-custom');
        btn.innerHTML = '<i class="fas fa-expand"></i>';
        btn.style.backgroundColor = 'white';
        btn.style.width = '30px';
        btn.style.height = '30px';
        btn.style.cursor = 'pointer';
        btn.title = 'Toggle Fullscreen';
        
        btn.onclick = function() {
            const mapElement = document.getElementById('farmMap');
            if (!document.fullscreenElement) {
                mapElement.requestFullscreen();
                btn.innerHTML = '<i class="fas fa-compress"></i>';
            } else {
                document.exitFullscreen();
                btn.innerHTML = '<i class="fas fa-expand"></i>';
            }
        };
        
        return btn;
    };
    fullscreenButton.addTo(map);

    // Handle fullscreen change
    document.addEventListener('fullscreenchange', function() {
        map.invalidateSize();
    });
});
