# Movie Explorer Backend

The backend server for the Movie Explorer application providing authentication, favorites management, and OMDB API integration.

## Technologies

- Node.js with Express
- TypeScript
- SQLite for data storage
- Redis for API caching
- JSON Web Tokens for authentication

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Redis server (optional, for caching)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the environment file and edit as needed:
   ```bash
   cp .env.example .env
   ```

3. Set up your OMDB API key in the `.env` file:
   ```
   OMDB_API_KEY=your_api_key_here
   ```

4. Set up the SQLite database:
   ```bash
   npm run setup-db
   ```

### Development

Start the development server:
```bash
npm run dev
```

The server will run on http://localhost:5000 (or the port specified in your .env file)

### Production

Build the application:
```bash
npm run build
```

Start the server:
```bash
npm start
```

## API Endpoints

### Authentication

- **POST /api/auth/register** - Register a new user
- **POST /api/auth/login** - Login a user
- **GET /api/auth/me** - Get current user profile (protected)

### Favorites

- **GET /api/favorites** - Get user favorites (protected)
- **POST /api/favorites** - Add to favorites (protected)
- **DELETE /api/favorites/:movieId** - Remove from favorites (protected)

### Media

- **GET /api/media/search** - Search movies, series, and episodes
- **GET /api/media/:id** - Get details for a specific movie, series, or episode

## Database

The application uses SQLite for data storage. The database file is stored in the `data` directory and is not tracked by git (added to .gitignore).

### Schema

- **users** - Stores user information and authentication data
- **favorites** - Stores user's favorite movies with references to the users table

### Migrations

To reset and recreate the database:
```bash
npm run setup-db
```

## Caching

Redis is used for caching OMDB API responses to improve performance. Caching can be disabled by commenting out the respective section in the `app.ts` file.

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
``` 