# Register App Frontend

Vue.js frontend application for the Register App.

## 🚀 Development

### Local Development
```bash
cd webapp
npm install
npm run dev
```

### Docker Development
```bash
# From root directory
npm run docker:dev
```

## 🏗️ Build

### Local Build
```bash
npm run build
```

### Docker Production Build
```bash
# From root directory
npm run docker:prod
```

## 📁 Structure

```
webapp/
├── src/
│   ├── components/          # Vue components
│   │   ├── CreatePatient.vue
│   │   ├── CreateSurgery.vue
│   │   ├── EditPatient.vue
│   │   ├── EditSurgery.vue
│   │   ├── HelloWorld.vue
│   │   ├── ShowPatients.vue
│   │   └── ShowSurgeries.vue
│   ├── services/
│   │   └── api.js          # API service layer
│   ├── router/
│   │   └── index.js        # Vue router configuration
│   ├── App.vue             # Main app component
│   └── main.js             # App entry point
├── Dockerfile              # Production Dockerfile
├── Dockerfile.dev          # Development Dockerfile
├── Dockerfile.prod         # Production Dockerfile
├── nginx.conf              # Development Nginx config
├── nginx.prod.conf         # Production Nginx config
└── vite.config.js          # Vite configuration
```

## 🔧 Configuration

### Environment Variables

- `VITE_API_BASE_URL`: Backend API base URL (default: http://localhost:8001)

### API Integration

The frontend communicates with the backend through the API service layer in `src/services/api.js`. This includes:

- Authentication (JWT)
- Patient management
- Surgery records
- File uploads
- Image proxy for S3 files

## 🐳 Docker

### Development Container
- Uses Vite dev server with hot reloading
- Exposes port 5173
- Volume mounting for live code changes

### Production Container
- Multi-stage build with Nginx
- Optimized for production
- Security headers and caching
- Reverse proxy to backend API

## 🔒 Security

- JWT token management
- Secure API communication
- XSS protection
- CSRF protection through proper headers
