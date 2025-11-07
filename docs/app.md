# Chefcito Application Overview

This document provides a comprehensive overview of the Chefcito restaurant management system, covering the overall architecture, data flow, system requirements, and deployment instructions.

## Application Overview

Chefcito is a comprehensive restaurant management system designed to streamline operations from order taking to kitchen display and reporting. The application consists of three main modules:

1. **Point of Sale (POS)** - Intuitive order taking interface with menu browsing and payment processing
2. **Kitchen Display System (KDS)** - Real-time order tracking and kitchen workflow management
3. **Management Dashboard** - Inventory management, reporting, and user management

## System Architecture

The application follows a client-server architecture with:

### Frontend Layer
- Next.js 15 with React Server Components
- Responsive UI built with Tailwind CSS and Radix UI
- Client-side state management with Zustand
- Data fetching with SWR (Stale-While-Revalidate)
- Real-time updates with Server-Sent Events (SSE)

### Backend Layer
- Next.js API routes for RESTful endpoints
- MongoDB Atlas for data persistence
- Mongoose ODM for data modeling
- JWT-based authentication with NextAuth.js

### Data Flow

1. **User Authentication**
   - Users log in through the authentication system
   - JWT tokens are generated and stored securely
   - Role-based access control determines available features

2. **POS Operations**
   - Staff access menu items through the POS interface
   - Orders are created and sent to the database
   - Real-time updates are pushed to the KDS

3. **KDS Operations**
   - Kitchen staff view incoming orders in real-time
   - Order statuses are updated as items are prepared
   - Completion notifications are sent back to relevant systems

4. **Inventory Management**
   - Stock levels are monitored automatically
   - Low-stock alerts are generated and displayed
   - Inventory adjustments can be made manually

5. **Reporting**
   - Sales data is aggregated from order records
   - Performance metrics are calculated and displayed
   - Reports can be filtered by date ranges and other criteria

## System Requirements

### Development Environment
- Node.js version 18 or higher
- MongoDB Atlas account or local MongoDB installation
- Git for version control
- Code editor (VS Code recommended)

### Production Environment
- Node.js runtime
- MongoDB Atlas or self-hosted MongoDB
- Web server capable of running Next.js applications
- SSL certificate for secure connections

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design supports mobile, tablet, and desktop screens

## Project Structure

```
src/
├── app/                 # Next.js app router
│   ├── (app)/          # Main application pages
│   │   ├── components/ # Shared components for app pages
│   │   ├── kds/        # Kitchen Display System pages
│   │   ├── orders/     # Orders management pages
│   │   ├── pos/        # Point of Sale pages
│   │   ├── profile/    # User profile pages
│   │   ├── reports/    # Reporting dashboard pages
│   │   └── restaurant/ # Restaurant management pages
│   ├── api/            # API routes
│   └── login/          # Login page
├── components/          # Reusable UI components
├── context/            # React context providers
├── lib/                # Library and utility functions
├── locales/            # Internationalization files
├── models/              # MongoDB data models
├── scripts/             # Utility scripts
└── services/            # Business logic services

docs/                    # Documentation
```

## Configuration

### Environment Variables

The application requires the following environment variables, configured in `.env.local`:

- `MONGODB_URI` - MongoDB connection string
- `MONGODB_DB` - Database name (default: "chefcito")
- `NEXTAUTH_SECRET` - Secret key for NextAuth.js
- `NEXT_PUBLIC_APP_URL` - Public URL of the application

### Database Collections

The application uses the following MongoDB collections:
- Users: User accounts with authentication and role-based access
- Staff: Staff member information
- Categories: Menu categories and modifier groups
- MenuItems: Menu items with pricing and availability
- Orders: Customer orders with status tracking
- Inventory: Stock items with low-stock alerts
- Customers: Customer information
- PaymentMethods: Available payment options
- Workstations: Kitchen workstations configuration

## Deployment

### Docker Deployment

The application includes a `docker-compose.yml` file for easy deployment:

```bash
docker-compose up -d
```

This will start both the application and MongoDB services.

### Manual Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start the production server**:
   ```bash
   npm run start
   ```

### Environment Configuration

For production deployment:
- Set `NODE_ENV=production`
- Configure proper MongoDB connection string
- Set up SSL termination (nginx, cloudflare, etc.)
- Configure proper reverse proxy settings if needed

## Data Management

### Initialization Scripts

- `npm run db:schema` - Creates all required collections and indexes
- `npm run db:init` - Populates the database with sample data
- `npm run db:update-workstations` - Updates the workstations collection schema

### Maintenance Scripts

- `npm run check-duplicate-collections` - Checks for duplicate collections
- `npm run fix-duplicate-collections` - Fixes duplicate collections
- `npm run db:test` - Tests database connectivity

## Security Considerations

### Authentication
- Passwords are hashed using bcryptjs with a salt rounds value of 10
- JWT tokens are signed with HS256 algorithm
- Tokens expire after 1 day
- Tokens include the userId in the payload

### Authorization
- Role-based access control with Owner, Admin, and Staff roles
- Feature-based permissions system
- Middleware protection for pages and API routes

### Data Protection
- Environment variables for sensitive configuration
- Proper error handling to avoid exposing sensitive information
- Input validation on both client and server sides

## Performance Optimization

### Frontend Optimizations
- Server-side rendering for initial page loads
- Client-side caching with SWR
- Code splitting with Next.js dynamic imports
- Image optimization with Next.js Image component

### Backend Optimizations
- Database indexing for frequently queried fields
- Connection pooling for database operations
- Lean queries for better memory usage
- Efficient aggregation pipelines for reports

### Caching Strategy
- SWR for client-side data caching
- Database-level caching with MongoDB
- CDN for static assets
- In-memory caching for frequently accessed data

## Monitoring and Logging

### Error Tracking
- Console logging for development and production
- Structured error logging with context information
- Client-side error boundaries for React components

### Performance Monitoring
- Database query performance logging
- API response time monitoring
- Client-side performance metrics

## Troubleshooting

### Common Issues

1. **Authentication Problems**
   - Verify JWT_SECRET is properly configured
   - Check that user accounts exist in the database
   - Ensure password hashing is working correctly

2. **Database Connection Issues**
   - Verify MongoDB connection string
   - Check network connectivity to database
   - Ensure database user has proper permissions

3. **Data Loading Problems**
   - Check that required collections exist
   - Verify data service functions are working
   - Ensure API routes are properly configured

### Debugging Tools

- Browser developer tools for frontend debugging
- MongoDB Atlas dashboard for database monitoring
- Console logs for server-side debugging
- Network tab for API request inspection

## Future Enhancements

### Planned Features
- Mobile application for staff notifications
- Advanced analytics and forecasting
- Integration with third-party delivery services
- Loyalty program implementation
- Advanced inventory management features

### Technical Improvements
- GraphQL API for more flexible data fetching
- Microservice architecture for better scalability
- Enhanced real-time capabilities with WebSockets
- Improved offline support for POS systems

## Contributing

To contribute to the project:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write appropriate tests
5. Submit a pull request

Please follow the existing code style and patterns documented in the frontend and backend documentation.