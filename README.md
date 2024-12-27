# Weather Application

A weather monitoring application with real-time updates and recommendations.

## Project Structure

```
weather/
├── backend/           # Python Flask backend
│   ├── src/          # Source code
│   ├── migrations/   # Database migrations
│   ├── config/       # Configuration files
│   └── requirements.txt
│
└── frontend/         # Next.js frontend
    ├── src/         # Source code
    ├── public/      # Static files
    └── package.json
```

## Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Copy .env.example to .env and fill in your credentials:
```bash
cp .env.example .env
```

5. Run the development server:
```bash
python app.py
```

## Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

## Environment Variables

### Backend (.env)
- OPENWEATHERMAP_API_KEY
- APPWRITE_ENDPOINT
- APPWRITE_PROJECT_ID
- APPWRITE_API_KEY
- APPWRITE_DATABASE_ID
- PORT

### Frontend (.env.local)
- NEXT_PUBLIC_API_URL=http://localhost:5000/api

## Features

- Real-time weather updates
- Historical weather data
- Weather recommendations
- Location customization
- Responsive design

## Tech Stack

- Backend: Python/Flask
- Frontend: Next.js
- API: OpenWeatherMap
- Deployment: Railway

## Prerequisites

- Python 3.7+
- OpenWeatherMap API key
- Git

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
- Next.js for the frontend framework
- Flask for the web framework
