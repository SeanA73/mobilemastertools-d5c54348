# Supabase Database Setup Guide

This guide will help you migrate from Neon to Supabase for your MobileToolsBox application.

## ✅ Changes Made

### 1. Database Driver Updated
- **Removed**: `@neondatabase/serverless`
- **Added**: `pg` (node-postgres)
- **Updated**: `server/db.ts` to use `drizzle-orm/node-postgres`

### 2. Files Modified
- `server/db.ts` - Changed to use `pg` Pool instead of Neon Pool
- `package.json` - Updated dependencies
- `env.production.template` - Updated with Supabase connection string format

---

## 🚀 Step 1: Create Supabase Project

1. **Go to**: [https://supabase.com](https://supabase.com)
2. **Sign up** or log in
3. **Click** "New Project"
4. **Fill in**:
   - Project Name: `mobiletoolsbox` (or your preferred name)
   - Database Password: **Save this password securely!**
   - Region: Choose closest to your VPS
5. **Click** "Create new project"

---

## 🔑 Step 2: Get Connection String

1. **In Supabase Dashboard**, go to **Settings** → **Database**
2. **Scroll down** to "Connection string"
3. **Copy** the "Connection Pooling" string (looks like):
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?sslmode=require
   ```
4. **Replace** `[YOUR-PASSWORD]` with your database password

---

## 📝 Step 3: Update Environment Variables

### On Your VPS:

```bash
cd /var/www/mobiletoolsbox

# Edit .env.production
nano .env.production
```

**Update the DATABASE_URL**:
```env
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?sslmode=require
NODE_ENV=production
PORT=5000
SESSION_SECRET=your-generated-secret-here
```

**Save and exit** (Ctrl+X, then Y, then Enter)

---

## 🗄️ Step 4: Push Database Schema

```bash
cd /var/www/mobiletoolsbox

# Pull latest code (with Supabase changes)
git pull origin main

# Install dependencies
npm install

# Push schema to Supabase
npm run db:push
```

This will create all the necessary tables in your Supabase database.

---

## 🏗️ Step 5: Rebuild and Restart

```bash
cd /var/www/mobiletoolsbox

# Build the app
npm run build

# Stop existing PM2 process
pm2 delete mobiletoolsbox

# Start with new environment
export $(cat .env.production | xargs) && pm2 start dist/index.js --name mobiletoolsbox --update-env

# Save PM2 configuration
pm2 save

# Check status
pm2 status

# Check logs
pm2 logs mobiletoolsbox
```

---

## ✅ Step 6: Verify Connection

```bash
# Test the database connection
curl http://localhost:5000

# Check PM2 logs for database connection messages
pm2 logs mobiletoolsbox --lines 50
```

**Expected output**: No "DATABASE_URL not set" warnings

---

## 🔍 Verify in Supabase Dashboard

1. **Go to** Supabase Dashboard
2. **Click** "Table Editor" in sidebar
3. **Verify** these tables exist:
   - `users`
   - `sessions`
   - `todos`
   - `notes`
   - `voice_recordings`
   - `flashcard_decks`
   - `flashcards`
   - `habits`
   - `habit_logs`
   - `projects`
   - `time_entries`
   - `achievements`
   - `user_achievements`
   - `user_stats`
   - `iq_test_sessions`
   - And more...

---

## 🆚 Supabase vs Neon Comparison

| Feature | Neon | Supabase |
|---------|------|----------|
| **Database** | PostgreSQL | PostgreSQL |
| **Connection** | Serverless | Pooled |
| **Drivers** | Special Neon driver | Standard `pg` |
| **Free Tier** | 512 MB storage | 500 MB storage |
| **Connection Pooling** | Yes | Yes |
| **Auto Pause** | Yes (after 5 min idle) | No |
| **Dashboard** | Basic | Advanced |
| **Real-time** | No | Yes |
| **Storage** | No | Yes |
| **Auth** | No | Yes |
| **Edge Functions** | No | Yes |

---

## 🎯 Advantages of Supabase

1. **Standard Driver**: Uses common `pg` package - more compatible
2. **Advanced Dashboard**: Better UI for database management
3. **Additional Features**: Auth, Storage, Real-time (if needed later)
4. **No Auto-pause**: Database doesn't sleep like Neon
5. **Better Monitoring**: Built-in query performance insights

---

## 🔧 Troubleshooting

### Connection Error

```bash
# Check if connection string is correct
cat .env.production | grep DATABASE_URL

# Test connection with psql (if available)
psql "your-connection-string"
```

### Schema Push Failed

```bash
# Check for existing tables
npm run db:push --verbose

# Drop all tables manually in Supabase Dashboard if needed
```

### App Won't Start

```bash
# Check PM2 logs
pm2 logs mobiletoolsbox --err

# Restart with verbose logging
pm2 delete mobiletoolsbox
export $(cat .env.production | xargs) && DEBUG=* pm2 start dist/index.js --name mobiletoolsbox --update-env
```

---

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Connection Pooling Guide](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Supabase vs Neon Comparison](https://www.npmjs.com/package/@supabase/postgres)

---

## 🎉 Migration Complete!

Your MobileToolsBox app is now using Supabase! You should see:
- ✅ No connection errors in logs
- ✅ All database tables created
- ✅ App running smoothly on port 5000
- ✅ No 502 Bad Gateway errors
