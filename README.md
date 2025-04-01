# Ziggo Movie Database

A modern, responsive web application for discovering movies, TV shows, and more. Built with Next.js, TypeScript, and Tailwind CSS, featuring a Node.js backend with Redis caching.

![Ziggo Movie Database](docs/screenshots/app-preview.png)

## Features

- 🔍 **Search**: Find movies, TV shows, and episodes by title, year, or type
- 📱 **Responsive**: Fully optimized for desktop and mobile devices
- 🖤 **Dark Mode**: Toggle between light and dark themes
- ⭐ **Favorites**: Save your favorite movies for quick access
- ⚡ **Performance**: Server-side rendering and caching for fast load times
- 🧪 **Testing**: Comprehensive unit and e2e tests

## Tech Stack

### Frontend
- **Next.js** with TypeScript
- **Tailwind CSS** for styling
- **React Testing Library** for component testing
- **Playwright** for end-to-end testing

### Backend
- **Node.js** API server
- **Express** for routing
- **Redis** for caching API responses
- **Winston** for logging

### DevOps
- **Docker** for containerization
- **Kubernetes** for orchestration
- **GitHub Actions** for CI/CD

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker (for containerized development)
- Redis (for caching, optional for development)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ziggo-movie-app.git
   cd ziggo-movie-app
   ```

2. Install dependencies:
   ```bash
   # Install frontend dependencies
   cd frontend
   npm install

   # Install backend dependencies
   cd ../backend
   npm install
   ```

3. Set up environment variables:
   ```bash
   # Create .env files from examples
   cp frontend/.env.example frontend/.env.local
   cp backend/.env.example backend/.env
   ```

4. Get an API key from [OMDb API](https://www.omdbapi.com/apikey.aspx) and add it to `backend/.env`

### Running Locally

#### Development mode

1. Start the backend:
   ```bash
   cd backend
   npm run dev
   ```

2. In a separate terminal, start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

#### Production mode

1. Build both applications:
   ```bash
   cd frontend
   npm run build

   cd ../backend
   npm run build
   ```

2. Start the applications:
   ```bash
   cd backend
   npm start

   # In another terminal
   cd frontend
   npm start
   ```

### Docker Development

Run the entire application stack with Docker Compose:

```bash
docker-compose up -d
```

This will start the frontend, backend, and Redis services. Access the application at [http://localhost:3000](http://localhost:3000).

## Kubernetes Deployment

### Local Kubernetes Development

1. Start Minikube:
   ```bash
   minikube start
   ```

2. Deploy the application:
   ```bash
   # From the project root
   ./scripts/k8s-local-setup.sh
   ```

3. Access the application at the URL provided by the script (typically `http://<minikube-ip>:30000`)

### AWS Kubernetes Deployment

The application is configured to deploy to a Kubernetes cluster on AWS using GitHub Actions:

1. Required GitHub Secrets:
   - `AWS_ACCESS_KEY_ID`: AWS access key with ECR/EKS permissions
   - `AWS_SECRET_ACCESS_KEY`: Corresponding AWS secret key
   - `AWS_ACCOUNT_ID`: Your AWS account ID
   - `KUBE_CONFIG_DATA`: Base64-encoded Kubernetes config file
   - `REDIS_URL`: Redis connection URL for production
   - `OMDB_API_KEY`: Your OMDB API key

2. Kubernetes Manifests:
   - Located in `k8s/aws/` directory
   - Include deployment, service, secrets, and namespace configurations

3. Deployment Process:
   - Triggered by pushes to the main branch
   - Builds Docker image and pushes to ECR
   - Applies Kubernetes manifests to your EKS cluster

## Project Structure

```
ziggo-movie-app/
├── frontend/          # Next.js application
├── backend/           # Node.js API server
├── k8s/               # Kubernetes manifests
│   ├── local/         # Local development manifests
│   └── aws/           # AWS production manifests
├── scripts/           # Helper scripts
├── e2e/               # End-to-end tests
├── Dockerfile         # Main application Dockerfile
└── docker-compose.yml # Local development with Docker
```

## Testing

### Frontend Tests

```bash
cd frontend
# Run unit tests
npm test

# Run with coverage
npm run test:coverage
```

### Backend Tests

```bash
cd backend
# Run unit tests
npm test

# Run with coverage
npm run test:coverage
```

### End-to-End Tests

```bash
# From project root
npm run e2e
```

## CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment:

1. On pull requests:
   - Runs linting and unit tests
   - Verifies build process

2. On merge to main:
   - Runs all tests including e2e
   - Builds Docker image
   - Deploys to Kubernetes cluster on AWS

## Architecture Decisions

### Frontend Architecture

- **Custom Hooks**: Extracted complex logic into reusable hooks
- **Memoization**: Optimized rendering with React.memo and custom memoization utilities
- **TypeScript**: Strong typing for better developer experience and fewer bugs
- **Component Structure**: Followed atomic design principles for component organization

### Backend Architecture

- **Layered Architecture**: Separated controllers, services, and data access
- **Middleware**: Added validation to ensure data integrity
- **Error Handling**: Implemented consistent error handling patterns
- **Caching**: Added Redis caching to optimize API calls and improve performance

### Performance Optimizations

- **SSR/SSG**: Leveraged Next.js server-side rendering for SEO and initial load performance
- **Image Optimization**: Used Next.js Image component with responsive sizing
- **Code Splitting**: Automatic code splitting for smaller bundles
- **Memoization**: Prevents unnecessary re-renders

## Trade-offs and Considerations

- **Local Storage for Favorites**: Used localStorage for simplicity. In a production environment, we would implement user authentication and store favorites in a database.
- **Environment Setup**: Development environment uses local Redis. Production would use managed Redis service.
- **API Caching Strategy**: Implemented different TTLs for search (10 min) vs details (24 hours) based on data volatility.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information. 