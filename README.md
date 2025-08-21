# Register App

A full-stack application with Vue.js frontend, Node.js backend, and PostgreSQL database.

## Docker Setup

### Environment Variables

Create a `.env` file in the root directory with the following variables:


### Production

To run the application in production mode:

```bash
npm run docker:prod
# or
docker-compose up --build
```

This will start:
- Frontend: http://localhost
- Backend: http://localhost:3000
- Database: localhost:5432

### Development

To run the application in development mode with hot reloading:

```bash
npm run docker:dev
# or
docker-compose -f docker-compose.dev.yml up --build
```

This will start:
- Frontend: http://localhost:5173 (Vite dev server)
- Backend: http://localhost:3000 (with nodemon)
- Database: localhost:5432

## Available Commands

### Start/Stop Services
```bash
npm run docker:prod              # Start production environment
npm run docker:dev               # Start development environment
npm run docker:stop              # Stop production containers
npm run docker:stop:dev          # Stop development containers
```

### View Logs
```bash
npm run docker:logs              # View production logs
npm run docker:logs:dev          # View development logs
```

### Cleanup
```bash
npm run docker:clean             # Clean up production containers and volumes
npm run docker:clean:dev         # Clean up development containers and volumes
```

### Rebuild
```bash
npm run docker:rebuild           # Rebuild production containers
npm run docker:rebuild:dev       # Rebuild development containers
```

### Container Shell Access
```bash
npm run docker:shell:frontend    # Access production frontend shell
npm run docker:shell:backend     # Access production backend shell
npm run docker:shell:db          # Access production database
npm run docker:shell:frontend:dev # Access development frontend shell
npm run docker:shell:backend:dev  # Access development backend shell
npm run docker:shell:db:dev       # Access development database
```

### Other Commands
```bash
npm run docker:restart           # Restart production containers
npm run docker:restart:dev       # Restart development containers
npm run docker:status            # Check production container status
npm run docker:status:dev        # Check development container status
```

### Database

The PostgreSQL database data is persisted in a Docker volume named `postgres_data`. The database will be automatically created with the configured credentials.

### Network

All services are connected through the `register_app_network` bridge network for secure communication.
