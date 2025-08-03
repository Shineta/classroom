# Classroom Walkthrough Tool

## Overview

This is a full-stack classroom observation and walkthrough documentation platform built for educational institutions. The application enables instructional teams to schedule, conduct, and document classroom observations with real-time collaboration features. The system supports comprehensive observation forms with multimedia attachments, rating systems, and detailed feedback mechanisms.

The platform serves three main user roles: observers (who conduct walkthroughs), administrators (who manage the system), and coaches (who provide instructional feedback). It includes features for teacher management, walkthrough scheduling, real-time collaborative editing, file uploads, and detailed reporting.

## Recent Changes (August 2025)

- **Enhanced Lesson Plan File Upload System**: Improved AI-powered auto-population functionality
  - Fixed file processing for Word documents using mammoth library for proper text extraction
  - Enhanced PDF processing with comprehensive error handling and content analysis
  - Enhanced regex patterns for better data extraction from structured lesson plans and educational activities
  - Improved form field mapping to properly populate title, subject, grade level, objectives, activities, materials, duration, and standards
  - Added comprehensive debug logging for troubleshooting extraction issues
  - Updated AI prompt engineering for more accurate field recognition and data formatting
  - Extended support for educational activity guides and PLTW curriculum materials
- **Completed Admin Dashboard System**: Implemented comprehensive administrative interface with red gradient styling
  - Built complete AdminDashboard with user management, teacher roster, and location management
  - Added role-based access control restricting dashboard to admin users only
  - Implemented user search/filter capabilities with role assignment and account creation
  - Created system overview cards showing total users, active teachers, locations, and system health
  - Added data export functionality for comprehensive system reporting
  - Integrated comprehensive backend API endpoints with proper admin authorization
- **Enhanced Data Model with AI & Automation Features**: Extended schema to support advanced tracking capabilities
  - Added standards tracking (standardsCovered) with support for Common Core, CSP, NGSS, and CSTA standards
  - Implemented student count tracking (studentCount) for class size metrics  
  - Added lesson topics field (lessonTopics) for enhanced content description beyond objectives
  - Created growth tracking features (previousFeedbackAddressed, growthNotes) for teacher development
  - Built comprehensive standards library with subject-specific curriculum standards
  - Added AI services for standards suggestion, feedback generation, and pattern analysis
  - Implemented Google Classroom integration foundation with modular provider architecture
- **AI-Powered Automation Services**: Integrated OpenAI for intelligent assistance
  - Created AI standards suggestion based on lesson objectives and subject areas
  - Built automated feedback generation with confidence scoring and human oversight
  - Implemented pattern analysis across multiple observations for organizational insights
  - Added automated report generation for leadership with comprehensive analytics
  - Enhanced admin settings to display AI capabilities and integration status
- **Completed Coach-Specific Features**: Implemented comprehensive instructional coach capabilities per requirements document
  - Created CoachDashboard with tabbed interface for pending, in-progress, and completed reviews
  - Built ReviewFeedbackModal with side-by-side layout for observation review and structured feedback
  - Developed CoachInsights page with analytics dashboards, observer activity metrics, and engagement trends
  - Added coach-specific API endpoints for analytics data including observer activity, engagement trends, subject distribution, and overview statistics
  - Integrated real-time chart visualizations using Recharts for data analysis
  - Enhanced review cards with priority badges, follow-up dates, location info, and review timestamps
  - Added "View Report" buttons for all review states and coaching feedback templates
  - Implemented proper coaching workflow with "Start Review" → "Complete Review" progression
  - Added navigation between Coach Dashboard and Analytics with proper header layout
- **Completed Review Workflow System**: Implemented comprehensive review workflow with email notifications
  - Added review status tracking (pending, in-progress, completed) with database schema updates
  - Enhanced main Dashboard with "My Walkthroughs" and "Review Dashboard" tabs
  - Implemented SendGrid email notifications for review assignments and completion
  - Added proper authorization checks ensuring only assigned reviewers can review walkthroughs
- **Fixed Complete Walkthrough Functionality**: Resolved database foreign key constraint errors and navigation issues
  - Fixed assigned reviewer validation to handle empty strings properly
  - Added automatic navigation to dashboard after completion
  - Implemented proper toast message handling for different operation types
- **Enhanced File Upload Experience**: Improved upload feedback and auto-save behavior
  - Separated file upload success messages from form update notifications  
  - Added smart auto-save after file uploads without showing redundant success toasts
- **Improved Real-time Collaboration**: Fixed WebSocket connection handling and error recovery
- **Database Validation**: Added robust validation for user references and foreign key constraints
- **Teachers Management**: Updated teacher roster to include Claude Hawkins and Antonio Cea, with previous teachers marked inactive
- **Branding Update**: Updated report footer to display "This report was generated by Horton Tech Innovations" with link to company website

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript in a Vite-powered single-page application
- **UI Framework**: Shadcn/UI components built on Radix UI primitives with Tailwind CSS styling
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Real-time Features**: WebSocket integration for live collaboration during walkthroughs

### Backend Architecture
- **Framework**: Express.js server with TypeScript
- **API Design**: RESTful endpoints with structured error handling and request logging
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit-based OIDC authentication with session management
- **File Upload**: Uppy integration with direct-to-cloud storage capabilities
- **Real-time Communication**: WebSocket server for collaborative features

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **Schema Management**: Drizzle migrations with versioned schema definitions
- **Session Storage**: PostgreSQL-backed session store for authentication persistence
- **File Storage**: Google Cloud Storage integration with ACL-based access control

### Authentication and Authorization
- **Authentication Provider**: Replit OIDC for seamless platform integration
- **Session Management**: Express sessions with PostgreSQL persistence
- **Access Control**: Role-based permissions (observer, admin, coach) with middleware enforcement
- **Security**: HTTP-only cookies, secure session handling, and CSRF protection

### File Management System
- **Upload Strategy**: Direct-to-cloud uploads using presigned URLs
- **Access Control**: Custom ACL system for fine-grained file permissions
- **Storage Provider**: Google Cloud Storage with Replit sidecar authentication
- **File Types**: Support for lesson plans, observation artifacts, and multimedia content

## External Dependencies

### Cloud Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Google Cloud Storage**: Object storage for file uploads with Replit sidecar authentication
- **Replit OIDC**: Authentication provider for user management and SSO

### Third-party Libraries
- **UI Components**: Radix UI primitives for accessible component foundation
- **File Upload**: Uppy ecosystem for robust file handling and AWS S3 compatibility
- **Real-time**: WebSocket (ws) library for bidirectional communication
- **Validation**: Zod for runtime type validation and schema definition
- **Styling**: Tailwind CSS with CSS variables for theming support

### Development Tools
- **Build System**: Vite for fast development and optimized production builds
- **TypeScript**: Full type safety across frontend, backend, and shared schemas
- **Database Tools**: Drizzle Kit for schema management and migrations
- **Code Quality**: ESBuild for backend bundling and TSX for development server