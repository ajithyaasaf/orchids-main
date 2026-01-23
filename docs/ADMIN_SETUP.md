# Admin Setup Guide - TNtrends E-commerce

This guide explains how to set up the first superadmin user and manage admin roles.

## Creating the First Superadmin

### Step 1: Register a User Account

1. Start your application (frontend + backend)
2. Navigate to the registration page: `http://localhost:3000/auth/register`
3. Create an account with your admin email
4. Verify the email if Firebase email verification is enabled

### Step 2: Get the User UID

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Authentication** → **Users**
4. Find your newly created user
5. Copy the **User UID** (it looks like: `xY3kL9mN2pQ...")`

### Step 3: Update Firestore User Document

1. In Firebase Console, go to **Firestore Database**
2. Navigate to the `users` collection
3. Find the document with your User UID
4. Click on the document to edit it
5. Update the `role` field to `"superadmin"`
6. Save the changes

### Step 4: Set Firebase Custom Claims

Custom claims are required for backend authentication to work properly.

**Option A: Using Firebase Console (Not directly available - use Option B)**

**Option B: Using Firebase Admin SDK (Recommended)**

Create a Node.js script to set custom claims:

```javascript
// scripts/set-admin.js
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./path-to-your-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const setAdminClaim = async (uid) => {
  try {
    await admin.auth().setCustomUserClaims(uid, { role: 'superadmin' });
    console.log(`✅ Successfully set superadmin role for user: ${uid}`);
    
    // Verify
    const user = await admin.auth().getUser(uid);
    console.log('Custom claims:', user.customClaims);
  } catch (error) {
    console.error('Error setting custom claims:', error);
  }
  
  process.exit();
};

// Replace with your user UID
const userUID = 'YOUR_USER_UID_HERE';
setAdminClaim(userUID);
```

Run the script:
```bash
node scripts/set-admin.js
```

**Option C: Using Backend API Endpoint**

You can also add an endpoint in your backend (temporarily, for setup only):

```typescript
// backend/src/routes/setup.ts (REMOVE AFTER SETUP!)
import express from 'express';
import { auth } from '../config/firebase';

const router = express.Router();

router.post'/set-superadmin', async (req, res) => {
  const { uid, secretKey } = req.body;
  
  // Use a secret key to protect this endpoint
  if (secretKey !== process.env.SETUP_SECRET_KEY) {
    return res.status(403).json({ error: 'Invalid secret key' });
  }
  
  try {
    await auth.setCustomUser Claims(uid, { role: 'superadmin' });
    res.json({ success: true, message: 'Super admin role set successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to set role' });
  }
});

export default router;
```

Call it via API:
```bash
curl -X POST http://localhost:5000/api/setup/set-superadmin \
  -H "Content-Type: application/json" \
  -d '{"uid": "YOUR_USER_UID", "secretKey": "YOUR_SECRET_KEY"}'
```

**⚠️ IMPORTANT: Remove or disable this endpoint after setup!**

### Step 5: Logout and Login Again

1. Logout from your account
2. Login again
3. The new custom claims will be loaded

### Step 6: Access Admin Panel

Navigate to `http://localhost:3000/admin` - you should now have full access!

## User Roles Explained

### Superadmin
**Permissions:**
- ✅ Full access to all features
- ✅ Create, edit, delete products
- ✅ Manage product stock
- ✅ View and manage all orders
- ✅ Update order statuses
- ✅ Manage global settings (shipping, COD, return policy)
- ✅ Create and manage other admins
- ✅ Delete products
- ✅ Access all admin panel features

**Use Case:** Site owner, technical admin

### Admin
**Permissions:**
- ✅ Create and edit products
- ✅ Manage product stock
- ✅ View and manage orders
- ✅ Update order statuses
- ❌ Cannot delete products
- ❌ Cannot manage global settings
- ❌ Cannot create other admins

**Use Case:** Store manager, inventory manager

### Customer
**Permissions:**
- ✅ Browse products
- ✅ Add to cart and checkout
- ✅ View own orders
- ✅ Update own profile
- ❌ No admin panel access

**Use Case:** Regular shoppers

## Creating Additional Admins

### As Superadmin:

1. Have the new admin register a regular account
2. Login to admin panel as superadmin
3. Navigate to **Admin Panel** → **User Management** (if implemented)
4. Find the user and change their role to `admin` or `superadmin`

### Programmatically:

Use the same script as above, but set the role to `"admin"` instead:

```javascript
await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
```

## Role-Based Access Control Flow

```
User Registration
    ↓
User Created (role: "customer" by default)
    ↓
Superadmin changes role in Firestore
    ↓
Backend sets Firebase custom claims
    ↓
User logs out and logs in again
    ↓
Auth token includes role claim
    ↓
Backend verifies role from token
    ↓
Access granted based on role
```

## Security Best Practices

1. **Protect the Superadmin Account**
   - Use a strong, unique password
   - Enable two-factor authentication in Firebase
   - Don't share credentials

2. **Limit Superadmin Users**
   - Only create superadmin accounts when absolutely necessary
   - Use regular admin accounts for day-to-day operations

3. **Audit Trail**
   - Log all admin actions
   - Review logs regularly for suspicious activity

4. **Regular Review**
   - Periodically review admin users
   - Remove admin access for users who no longer need it

## Troubleshooting

### "Access Denied" or "Forbidden" Errors

**Solutions:**
1. Verify `role` field in Firestore `users` collection is set correctly
2. Ensure Firebase custom claims are set (use `admin.auth().getUser(uid)` to check)
3. Logout and login again to refresh the auth token
4. Check backend logs for authentication errors

### Custom Claims Not Working

**Solutions:**
1. Verify Firebase Admin SDK is initialized correctly
2. Check that the service account has proper permissions
3. Ensure the user logged out and back in after claims were set
4. Check the auth token in browser dev tools (Application → Local Storage → Firebase)

### Can't Access Admin Panel

**Solutions:**
1. Verify you're logged in
2. Check the role in Firestore matches the URL you're trying to access
3. Check browser console for JavaScript errors
4. Verify backend is running and accessible

## Default Settings

After creating a superadmin, you should configure the global settings:

1. Navigate to `admin/settings`
2. Configure:
   - **Shipping Charge**: ₹50 (default)
   - **Free Shipping Above**: ₹999 (default)
   - **COD Enabled**: true (default)
   - **Return Policy Days**: 7 (default)

## Quick Reference

### Firestore User Document Structure
```json
{
  "uid": "user-uid-here",
  "name": "Admin Name",
  "email": "admin@example.com",
  "phone": "+919876543210",
  "role": "superadmin",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Firebase Custom Claims
```json
{
  "role": "superadmin"
}
```

---

**Admin setup complete! You can now manage your TNtrends store. 🎉**
