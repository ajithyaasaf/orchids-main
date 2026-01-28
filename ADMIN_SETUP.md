# Admin Access Setup Guide

## Quick Start: Access Admin Dashboard

### Step 1: Create an Account
1. Open your browser and go to: **http://localhost:3000/auth/register**
2. Register with your email and password
3. You'll be automatically logged in as a regular customer

### Step 2: Promote to Admin (Firebase Console)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database**
4. Click on the **users** collection
5. Find your user document (search by your email)
6. Click **Edit document**
7. Change the `role` field from `"customer"` to `"superadmin"`
8. Click **Update**

### Step 3: Logout and Login Again
1. Logout from the app
2. Go to: **http://localhost:3000/auth/login**
3. Login with your credentials
4. You'll be automatically redirected to `/admin` dashboard

### Step 4: Add Wholesale Products
1. Navigate to: **http://localhost:3000/admin/wholesale/products**
2. Click **"+ Add New Product"**
3. Fill in the product form:
   - Product Name
   - Click a **preset button** (e.g., "8-7-5 Split") for quick size distribution
   - Enter **Bundle Price**
   - Set **Available Bundles** (stock)
4. Click **"Save Product"** or **"Save & Add Another"**

---

## Alternative: Programmatic Admin Setup

If you want to create an admin user via script, you can manually update Firestore:

### Using Firebase Admin SDK (Backend)

```javascript
// Run this in your backend console or create a script
const admin = require('firebase-admin');
const db = admin.firestore();

async function makeUserAdmin(email) {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();
    
    if (snapshot.empty) {
        console.log('User not found');
        return;
    }
    
    const userDoc = snapshot.docs[0];
    await userDoc.ref.update({ role: 'superadmin' });
    console.log(`✅ User ${email} promoted to superadmin`);
}

// Usage:
makeUserAdmin('your-email@example.com');
```

---

## Admin Routes Available

Once logged in as admin, you can access:

- **Product Management:** `/admin/wholesale/products`
- **Add New Product:** `/admin/wholesale/products/new`
- **Order Management:** `/admin/wholesale/orders`
- **Settings:** `/admin/settings`

---

## Troubleshooting

### "Access Denied" or redirected to home page
- Make sure your user role is set to `"superadmin"` or `"admin"` in Firestore
- Logout and login again after changing the role

### Can't find user in Firestore
- Make sure you've completed registration
- Check that Firebase Authentication is properly configured
- User documents are created automatically on first registration

### Product form not loading
- Make sure both frontend and backend servers are running
- Check browser console for errors
- Verify API endpoints are accessible at `http://localhost:3001/api`
