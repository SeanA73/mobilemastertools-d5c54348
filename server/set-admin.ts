#!/usr/bin/env npx tsx

/**
 * Set or update a user's role
 * Usage: npx tsx server/set-admin.ts <userId> [role]
 */

import { storage } from "./storage";

const userId = process.argv[2];
const role = process.argv[3] || 'admin'; // Default to 'admin' if not specified

if (!userId) {
  console.error("❌ Usage: npx tsx server/set-admin.ts <userId> [role]");
  console.error("Example: npx tsx server/set-admin.ts 927070657 admin");
  console.error("Example: npx tsx server/set-admin.ts 927070657 user");
  console.error("Example: npx tsx server/set-admin.ts 927070657 superuser");
  console.error("\nValid roles: user, admin, superuser");
  process.exit(1);
}

// Validate role
const validRoles = ['user', 'admin', 'superuser'];
if (!validRoles.includes(role)) {
  console.error(`❌ Invalid role: ${role}`);
  console.error(`Valid roles: ${validRoles.join(', ')}`);
  process.exit(1);
}

async function setUserRole() {
  try {
    const user = await storage.getUser(userId);
    
    if (!user) {
      console.error(`❌ User not found: ${userId}`);
      console.error(`Creating new user with role: ${role}`);
      
      // Create user with specified role
      const newUser = await storage.upsertUser({
        id: userId,
        role: role,
      });
      
      console.log(`✅ Successfully created user ${userId} with role: ${role}`);
      console.log(`   Email: ${newUser.email || 'N/A'}`);
      console.log(`   Name: ${newUser.firstName || ''} ${newUser.lastName || ''}`);
      process.exit(0);
    }

    // Update existing user role
    const updatedUser = await storage.updateUserRole(userId, role);
    
    console.log(`✅ Successfully updated user ${userId}`);
    console.log(`   Role: ${role}`);
    console.log(`   Email: ${updatedUser.email || 'N/A'}`);
    console.log(`   Name: ${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating user role:', error);
    process.exit(1);
  }
}

setUserRole();

