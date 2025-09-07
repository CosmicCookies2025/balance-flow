# BalanceFlow

## Overview

BalanceFlow is a modern financial balance management application that enables users to add funds via Stripe payments and withdraw money through Stripe payouts. The application features a clean, responsive UI built with React and shadcn/ui components, backed by an Express.js server with PostgreSQL database integration using Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with dark theme support
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Session Management**: Simple in-memory authentication (demo purposes)
- **API Design**: RESTful endpoints with JSON responses
- **Error Handling**: Centralized error middleware with proper HTTP status codes

### Database Schema
- **Users Table**: Basic user management with username/password
- **Transactions Table**: Financial transaction records with Stripe integration
- **Balances Table**: Current balance tracking with totals for added/withdrawn amounts
- **Database Provider**: Configured for PostgreSQL via Neon Database

### Authentication & Authorization
- **Authentication**: Simple password-based login (demo password: "demo123")
- **Session Management**: In-memory session state (not production-ready)
- **Route Protection**: Middleware-based authentication checking for protected routes

### Payment Processing Architecture
- **Payment Provider**: Stripe integration for both payments and payouts
- **Payment Flow**: Client-side Stripe Elements for secure card processing
- **Payout System**: Server-side Stripe payout creation for withdrawals
- **Balance Management**: Real-time balance updates with transaction logging

### Component Architecture
- **Layout**: Responsive sidebar navigation with mobile-first design
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Reusable component library following shadcn/ui patterns
- **Mobile Experience**: Bottom navigation bar and responsive design patterns

## External Dependencies

### Payment Services
- **Stripe**: Primary payment processor for deposits and withdrawals
  - Client-side: `@stripe/stripe-js` and `@stripe/react-stripe-js`
  - Server-side: `stripe` package for API integration
  - Required environment variables: `STRIPE_SECRET_KEY`, `VITE_STRIPE_PUBLIC_KEY`

### Database Services
- **Neon Database**: PostgreSQL hosting service
  - Connection via `@neondatabase/serverless`
  - Configured through `DATABASE_URL` environment variable
  - Uses connection pooling for production environments

### Development Tools
- **Replit Integration**: Development environment with hot reload support
- **Drizzle Kit**: Database schema management and migrations
- **TypeScript**: Full type safety across frontend and backend
- **ESBuild**: Production bundle optimization for server code

### UI Framework Dependencies
- **Radix UI**: Accessibility-first component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography
- **Date-fns**: Date manipulation and formatting utilities