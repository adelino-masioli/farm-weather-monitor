# Farm Weather Monitor

A real-time weather monitoring system for precision agriculture using the OpenWeatherMap API. This application helps farmers optimize their agricultural practices by providing current weather data and automated recommendations for irrigation, fertilization, and crop protection.

## Features

- Real-time weather monitoring
- Automated farming recommendations based on weather conditions
- Web-based dashboard with responsive design
- Periodic weather data logging
- RESTful API endpoints for weather data

## Tech Stack

- Backend: Python/Flask
- Frontend: HTML5, Bootstrap 5, JavaScript
- API: OpenWeatherMap
- Deployment: Railway

## Prerequisites

- Python 3.7+
- OpenWeatherMap API key
- Git

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/farm-weather-monitor.git
cd farm-weather-monitor
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit `.env` and add your OpenWeatherMap API key and farm coordinates.

4. Run the application:
```bash
python app.py
```

The application will be available at `http://localhost:8080`

## Environment Variables

- `OPENWEATHERMAP_API_KEY`: Your OpenWeatherMap API key
- `FARM_LATITUDE`: Latitude of your farm location
- `FARM_LONGITUDE`: Longitude of your farm location

## API Endpoints

- `GET /`: Web dashboard
- `GET /api/weather`: Current weather data and recommendations

## Deployment

### Railway

1. Create a new project on Railway
2. Connect your GitHub repository
3. Add environment variables in Railway dashboard
4. Deploy!

Railway will automatically detect the Procfile and deploy the application.

## Development

To run the application in development mode:

```bash
flask run --debug --port 8080
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenWeatherMap for providing the weather data API
- Bootstrap for the frontend framework
- Flask for the web framework
