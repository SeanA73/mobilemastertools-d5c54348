# MobileToolsBox - All-in-One Productivity Suite

MobileToolsBox is a comprehensive productivity application featuring 20+ powerful tools for managing tasks, notes, habits, timers, and more. Available on Web, iOS, and Android.

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open at http://localhost:5000
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📱 Mobile Apps

### iOS
```bash
# Build and sync
npm run build
npx cap sync ios

# Open in Xcode
npx cap open ios
```

### Android
```bash
# Build and sync
npm run build
npx cap sync android

# Open in Android Studio
npx cap open android
```

## 🌟 Features

- ✅ **Todo Management** - Organize tasks with priorities and due dates
- 📝 **Note Taking** - Rich text editor with markdown support
- 🎯 **Habit Tracking** - Build positive habits with streaks and analytics
- 🃏 **Flashcards** - Study efficiently with spaced repetition
- 🎤 **Voice Recordings** - Quick audio notes and reminders
- ⏱️ **Pomodoro Timer** - Focus sessions with break management
- 🔢 **Unit Converter** - Convert between different measurement units
- 🔐 **Password Generator** - Create secure, memorable passwords
- 🌍 **World Clock** - Track time across multiple time zones
- 🧠 **IQ Tester** - Challenge your cognitive abilities
- 🔢 **Calculator** - Built-in scientific calculator
- 📷 **QR Scanner** - Scan and generate QR codes
- 📊 **Project Timer** - Track time spent on projects
- 📁 **File Converter** - Convert between file formats
- 🎨 **Theme Customizer** - Personalize your experience

## 📦 Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS, Shadcn UI
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL (Drizzle ORM)
- **Mobile**: Capacitor
- **Build**: Vite
- **Auth**: Passport.js
- **Payments**: Stripe
- **Email**: SendGrid

## 🔧 Configuration

### Environment Variables

Copy `env.production.template` to `.env.production` and fill in your values:

```bash
cp env.production.template .env.production
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `SENDGRID_API_KEY` - Email service API key
- `STRIPE_SECRET_KEY` - Payment processing key
- `VITE_ADSENSE_CLIENT_ID` - Google AdSense ID

## 📚 Documentation

- [Deployment Instructions](./DEPLOYMENT_INSTRUCTIONS.md) - Full deployment guide
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md) - Step-by-step checklist
- [Planning Documents](./Planning-Dir/) - Feature specs and guides
- [Deployment Plan](./multi-platform-deployment-plan.plan.md) - Comprehensive deployment strategy

## 🏗️ Project Structure

```
├── client/              # Frontend React application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utility functions
│   └── public/          # Static assets
├── server/              # Backend Express server
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API routes
│   └── db.ts            # Database configuration
├── shared/              # Shared types and schemas
├── android/             # Android Capacitor project
├── resources/           # App icons and splash screens
└── dist/                # Production build output
```

## 🚀 Deployment

### Web Deployment

See [DEPLOYMENT_INSTRUCTIONS.md](./DEPLOYMENT_INSTRUCTIONS.md) for detailed steps.

Quick start:
```bash
# Build
./build-for-production.sh

# Deploy with PM2
pm2 start ecosystem.config.js
```

### Mobile Deployment

```bash
# Prepare mobile apps
./build-mobile-apps.sh

# Follow platform-specific instructions in output
```

## 🔒 Security

- All sensitive credentials in `.env.production` (never committed)
- SSL/TLS encryption for all connections
- Secure password hashing with bcrypt
- CSRF protection enabled
- Rate limiting on API endpoints
- Regular security updates

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

This is a private project. For issues or feature requests, please contact the development team.

## 📧 Support

- Email: support@yourdomain.com
- Website: https://yourdomain.com
- Documentation: See Planning-Dir/

## 🎉 Acknowledgments

Built with modern web technologies and best practices for performance, security, and user experience.

---

**Ready to deploy?** Check out the [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md) to get started! 🚀

