# MobileToolsBox - Productivity Suite

## Overview

MobileToolsBox is a comprehensive productivity suite that combines 15+ essential tools into one seamless application. It's designed as a Progressive Web App (PWA) with mobile-first architecture, offering everything from todo lists and note-taking to timers, habit tracking, and advanced features like voice recordings and flashcards.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **UI Components**: Radix UI with Tailwind CSS and shadcn/ui
- **State Management**: Zustand for client-side state, TanStack Query for server state
- **Mobile Support**: Capacitor for native mobile app compilation
- **PWA Features**: Service worker, offline support, installable web app

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth integration (with mock auth for demo)
- **API Design**: RESTful endpoints with JSON responses
- **Payment Processing**: Stripe integration for donations/support

### Build System
- **Bundler**: Vite for fast development and optimized builds
- **Mobile Builds**: Capacitor CLI for iOS/Android compilation
- **Deployment**: Static web hosting with server-side API

## Key Components

### Core Tools
1. **Enhanced Todo System**: Natural language parsing, Eisenhower Matrix, recurring tasks
2. **Advanced Notes**: Rich text editor, voice recordings, tagging system
3. **Voice Recorder**: Audio capture with transcription capabilities
4. **Project Timer**: Time tracking with analytics and project management
5. **Habit Tracker**: Daily habit monitoring with streaks and statistics
6. **Flashcards**: Spaced repetition learning system
7. **Pomodoro Timer**: Focus sessions with break management
8. **Calculator & Utilities**: Basic calculator, unit converter, password generator
9. **World Clock**: Multi-timezone time display
10. **QR Scanner**: QR code reading functionality

### Gamification System
- **Achievements**: 15+ unlockable achievements across different categories
- **User Stats**: Level progression, experience points, streak tracking
- **Activity Tracking**: Automatic progress monitoring for all tools

### Monetization Features
- **Donation System**: Stripe-powered voluntary support (coffee donations)
- **Ad Banners**: Non-intrusive support requests within the app
- **A/B Testing**: User testing controls for different pricing strategies

## Data Flow

### User Data Management
1. **Local Storage**: Primary data storage using browser localStorage
2. **Database Sync**: PostgreSQL backend for data persistence
3. **Offline Support**: Service worker caches for offline functionality
4. **Real-time Updates**: TanStack Query for optimistic updates

### Authentication Flow
1. **Demo Mode**: Mock authentication for development/demo
2. **Replit Auth**: Production authentication system
3. **Session Management**: Express sessions with PostgreSQL storage

### Mobile App Flow
1. **PWA First**: Web app that works as mobile app
2. **Capacitor Builds**: Optional native app store distribution
3. **Hybrid Approach**: Same codebase for web and mobile

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database driver
- **drizzle-orm**: Type-safe database ORM
- **@stripe/stripe-js**: Payment processing
- **@capacitor/core**: Mobile app compilation
- **@tanstack/react-query**: Server state management
- **framer-motion**: Animations and transitions

### Development Tools
- **drizzle-kit**: Database migrations and schema management
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production

### UI Framework
- **@radix-ui/***: Unstyled, accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library

## Deployment Strategy

### Web Deployment
- **Target**: Static hosting (Vercel, Netlify, or similar)
- **Build Output**: Optimized SPA with SSG capabilities
- **API**: Express.js server for backend functionality
- **Database**: PostgreSQL (Neon, Supabase, or similar)

### Mobile App Store Deployment
- **PWA Route**: Direct installation via browser (recommended)
- **Native Apps**: Optional App Store/Play Store distribution
- **Build Tools**: Capacitor for iOS/Android compilation
- **Assets**: Automated icon and splash screen generation

### Revenue Strategy
- **Free-to-Use**: All features available without payment
- **Voluntary Support**: Coffee donations via Stripe
- **No Subscriptions**: One-time voluntary contributions only
- **Ad-Free Experience**: Minimal support prompts, no traditional ads

The application is designed with a mobile-first approach, ensuring excellent user experience across all devices while maintaining the flexibility to deploy as either a PWA or native mobile app.