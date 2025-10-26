# Admin User Setup Guide

This guide explains how to set up and manage admin users in MobileToolsBox.

## Overview

The Revenue Dashboard and user testing controls are restricted to admin users only. Regular users cannot access these administrative features.

## User Roles

- **user** (default) - Regular user with access to all tools
- **admin** - Administrator with access to Revenue Dashboard and user testing
- **superuser** - Same privileges as admin

## Setting Up an Admin User

### Method 1: Using the Set Admin Script

1. Start your application and note your user ID from the mock auth (default: `927070657`)

2. Run the set-admin script:
   ```bash
   npx tsx server/set-admin.ts 927070657
   ```

3. You should see:
   ```
   ✅ Successfully set user 927070657 as admin
      Email: N/A
      Name:  
   ```

### Method 2: Manual Database Update

If you have direct database access:

```sql
UPDATE users 
SET role = 'admin', updated_at = NOW() 
WHERE id = '927070657';
```

### Method 3: For Development (First User Auto-Admin)

You can modify the server to automatically make the first user an admin:

In `server/routes.ts`, find the mock auth section and add:
```javascript
if (!user) {
  user = await storage.upsertUser({
    id: '927070657',
    role: 'admin', // Add this line
  });
}
```

## Verifying Admin Access

1. **Frontend Check**:
   - Log in to the application
   - Navigate to Settings category
   - You should see the "Revenue Dashboard" tool (only visible to admins)

2. **API Check**:
   - Try accessing: `http://localhost:5000/api/test-statistics`
   - Non-admin users will receive: `403 Forbidden: Admin access required`
   - Admin users will receive statistics data

## Admin-Only Features

### Revenue Dashboard
- **Location**: Settings → Revenue Dashboard
- **Features**:
  - Total users count
  - Revenue tracking
  - Conversion rate analytics
  - A/B testing controls
  - User test group management

### Protected API Endpoints

The following endpoints require admin authentication:

- `GET /api/test-statistics` - Retrieve revenue and user statistics
- `POST /api/update-user-test-status` - Update user test groups and subscription tiers

## Security Notes

1. **Server-side Validation**: All admin routes are protected with middleware that checks:
   - User is authenticated
   - User role is 'admin' or 'superuser'

2. **Frontend Protection**: The Revenue Dashboard tool is hidden from non-admin users

3. **Production Best Practices**:
   - Never hardcode admin credentials
   - Use environment variables for initial admin setup
   - Implement proper user authentication (Replit Auth, OAuth, etc.)
   - Regularly audit admin access
   - Use database migrations to manage role assignments

## Removing Admin Access

To revoke admin access:

```bash
npx tsx server/set-admin.ts 927070657 user
```

Or via database:
```sql
UPDATE users 
SET role = 'user', updated_at = NOW() 
WHERE id = '927070657';
```

## Development vs Production

### Development (Current Setup)
- Uses mock authentication with user ID `927070657`
- Can set any user as admin via script
- Revenue Dashboard visible on localhost

### Production Recommendations
- Implement proper authentication system
- Use environment variables for initial admin user
- Add admin invitation system
- Implement 2FA for admin accounts
- Add audit logging for admin actions
- Set up role-based access control (RBAC) middleware

## Troubleshooting

### "Revenue Dashboard not showing"
1. Verify user role: Check database or API response
2. Check browser console for errors
3. Ensure server is running and database is connected

### "403 Forbidden" when accessing admin endpoints
1. Confirm user is logged in
2. Verify user role is 'admin' or 'superuser'
3. Check server logs for authentication errors

### Script Errors
- Ensure database is running and accessible
- Check DATABASE_URL environment variable
- Verify user ID exists in database

## Example Admin Workflow

```bash
# 1. Start the application
npx tsx server/index.ts

# 2. In another terminal, set admin
npx tsx server/set-admin.ts 927070657

# 3. Refresh browser and navigate to Settings
# 4. Click on "Revenue Dashboard" (now visible)
# 5. View analytics and manage test users
```

## API Examples

### Get Statistics (Admin Only)
```bash
curl http://localhost:5000/api/test-statistics \
  -H "Cookie: your-session-cookie"
```

### Update User Test Group (Admin Only)
```bash
curl -X POST http://localhost:5000/api/update-user-test-status \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "userId": "927070658",
    "testGroup": "variant_a",
    "subscriptionTier": "pro"
  }'
```

## Support

For issues or questions about admin setup, check:
- Server logs for authentication errors
- Database connection status
- User table for role assignments

