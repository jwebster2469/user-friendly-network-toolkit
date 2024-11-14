# Enterprise Listing Assistant

An enterprise-grade, scalable application for managing marketplace listings across multiple platforms with AI-powered optimization. Built with a bootstrapped approach focusing on efficiency and maintainability.

## Enterprise Features

### Core Functionality
- **AI-Powered Content Generation**: Automated title and description generation using OpenAI
- **Multi-Platform Integration**: Seamless listing across Facebook Marketplace and eBay
- **Batch Processing**: High-throughput listing management
- **Advanced Search Capabilities**:
  - Reverse image search via TinEye API
  - Audio description search using Vosk (offline speech recognition)
  - Barcode scanning for product identification
- **Analytics Dashboard**: Real-time performance metrics and insights

### Enterprise-Grade Infrastructure
- **High Availability**: Distributed architecture with failover support
- **Horizontal Scalability**: Microservices-based design
- **Performance Optimization**:
  - Redis caching layer
  - Image optimization with Sharp
  - Efficient file handling with Multer
- **Security**:
  - JWT authentication
  - Rate limiting
  - Helmet security headers
  - Input validation
  - CORS configuration

### Monitoring & Observability
- **Error Tracking**: Sentry integration
- **Performance Monitoring**: New Relic integration
- **Structured Logging**: Winston-based logging system
- **Audit Trail**: Comprehensive activity logging

## Technical Stack

### Backend
- **Runtime**: Node.js (>= 18.0.0)
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Caching**: Redis
- **Authentication**: JWT + bcrypt
- **File Processing**: 
  - Multer for uploads
  - Sharp for image optimization
  - Vosk for offline speech recognition

### Frontend
- **Core**: HTML5, CSS3, JavaScript
- **Styling**: Custom CSS with responsive design
- **Components**:
  - Authentication system
  - Listing creation interface
  - Dashboard analytics
  - Multi-platform management
  - Batch processing tools

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- PostgreSQL
- Redis
- Vosk speech recognition model

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/enterprise-listing-assistant.git
   cd enterprise-listing-assistant
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Download Vosk model:
   ```bash
   # Create models directory
   mkdir -p models/vosk
   cd models/vosk
   
   # Download small model (1.8G) for English
   wget https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip
   unzip vosk-model-small-en-us-0.15.zip
   ```

4. Configure environment:
   - Copy `.env.example` to `.env`
   - Update variables with your configuration
   - Ensure VOSK_MODEL_PATH points to your downloaded model

5. Initialize database:
   ```bash
   psql -U postgres
   CREATE DATABASE listing_assistant;
   ```

### Development

Start the development server:
```bash
npm run dev
```

### Testing

Run the test suite:
```bash
npm test
```

Run linting:
```bash
npm run lint
```

Format code:
```bash
npm run format
```

## Deployment

### Production Setup

1. Configure production environment:
   ```bash
   cp .env.example .env.production
   # Update production environment variables
   ```

2. Build and start:
   ```bash
   NODE_ENV=production npm start
   ```

### Monitoring Setup

1. Configure Sentry:
   - Add SENTRY_DSN to environment variables
   - Errors will be automatically tracked

2. Configure New Relic:
   - Add NEW_RELIC_LICENSE_KEY to environment variables
   - Performance metrics will be automatically collected

### Security Considerations

- All API endpoints are rate-limited
- JWT tokens expire after configured duration
- File uploads are restricted by size and type
- All inputs are validated and sanitized
- Security headers are enforced via Helmet

## Architecture

### System Components

```
├── Frontend (HTML/CSS/JS)
│   ├── Authentication
│   ├── Listing Management
│   ├── Analytics Dashboard
│   └── Multi-platform Integration
│
├── Backend (Node.js/Express)
│   ├── API Routes
│   ├── Controllers
│   ├── Models
│   └── Utilities
│
├── Services
│   ├── Redis Cache
│   ├── PostgreSQL Database
│   ├── File Storage
│   └── External APIs
│
└── Infrastructure
    ├── Monitoring (Sentry/New Relic)
    ├── Logging (Winston)
    └── Security Layer
```

### Data Flow

1. Client requests → Rate Limiting → Authentication → Input Validation
2. Business Logic → Data Access Layer → Cache/Database
3. Response Generation → Output Validation → Client

## Performance Optimization

- Redis caching for frequently accessed data
- Image optimization using Sharp
- Efficient file handling with streams
- Database query optimization
- Frontend asset optimization

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
