# Deployment Guide - TNtrends E-commerce

This guide covers deploying the TNtrends platform to production.

## Overview

- **Frontend**: Vercel (recommended for Next.js)
- **Backend**: DigitalOcean App Platform
- **Database**: Firebase Firestore (cloud-hosted)
- **Images**: Cloudinary CDN
- **Domain**: Custom domain setup

## Prerequisites

- GitHub account (for code hosting)
- Vercel account
- DigitalOcean account
- Custom domain (optional)
- Production Firebase project
- Production Cloudinary account
- Production Razorpay account
- Production Resend account

## Part 1: Frontend Deployment (Vercel)

### Step 1: Prepare Repository

1. Create a GitHub repository
2. Push your code:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/tntrends.git
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### Step 3: Environment Variables

Add these environment variables in Vercel dashboard (Settings → Environment Variables):

```env
# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=your-production-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-production-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Backend API URL (update after backend deployment)
NEXT_PUBLIC_API_URL=https://tntrends-api.ondigitalocean.app

# Razorpay (use production keys)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxx
```

### Step 4: Custom Domain (Optional)

1. Go to Vercel Project → Settings → Domains
2. Add your domain (e.g., `tntrends.shop`)
3. Update DNS records as instructed by Vercel
4. Wait for SSL certificate provisioning

### Step 5: Deploy

1. Click "Deploy"
2. Vercel will build and deploy your site
3. Your site will be live at `https://your-project.vercel.app`

## Part 2: Backend Deployment (DigitalOcean)

### Step 1: Prepare Backend

Ensure your backend has a `package.json` with proper start script:

```json
{
  "scripts": {
    "start": "node dist/index.js",
    "build": "tsc"
  }
}
```

### Step 2: Create App on DigitalOcean

1. Go to [DigitalOcean](https://www.digitalocean.com)
2. Navigate to "App Platform"
3. Click "Create App"
4. Choose "GitHub" as source
5. Authorize and select your repository
6. Choose branch: `main`
7. Source Directory: `backend`

### Step 3: Configure Build Settings

**Build Command:**
```bash
npm install && npm run build
```

**Run Command:**
```bash
npm start
```

**HTTP Port:** `5000` (or use environment variable PORT)

### Step 4: Environment Variables

Add these in DigitalOcean App Platform (Settings → App-Level Environment Variables):

```env
# Server
PORT=8080
NODE_ENV=production

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-production-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour actual private key here (with \n for line breaks)\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Cloudinary (production account)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Razorpay (production keys)
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your-production-secret

# Resend
RESEND_API_KEY=re_your_production_key
FROM_EMAIL=orders@tntrends.shop

# CORS (your Vercel frontend URL)
FRONTEND_URL=https://tntrends.vercel.app
```

**Important for FIREBASE_PRIVATE_KEY:**
- The private key must have `\n` converted to actual newlines
- Or keep as string with `\\n` and handle in code with `.replace(/\\n/g, '\n')`

### Step 5: Deploy

1. Review settings
2. Click "Create Resources"
3. DigitalOcean will build and deploy
4. Your API will be live at `https://your-app-name.ondigitalocean.app`

### Step 6: Update Frontend

Go back to Vercel and update the `NEXT_PUBLIC_API_URL` environment variable with your DigitalOcean API URL, then redeploy.

## Part 3: Firebase Configuration

### Firestore Security Rules

Update Firestore security rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Products - read for all, write for admin only
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null && 
                      (request.auth.token.role == 'admin' || 
                       request.auth.token.role == 'superadmin');
    }
    
    // Orders - users can read their own, write their own, admins can read/write all
    match /orders/{orderId} {
      allow read: if request.auth != null && 
                     (resource.data.userId == request.auth.uid || 
                      request.auth.token.role == 'admin' || 
                      request.auth.token.role == 'superadmin');
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && 
                       (request.auth.token.role == 'admin' || 
                        request.auth.token.role == 'superadmin');
    }
    
    // Users - users can read/write their own, admins can read all
    match /users/{userId} {
      allow read: if request.auth != null && 
                     (request.auth.uid == userId || 
                      request.auth.token.role == 'admin' || 
                      request.auth.token.role == 'superadmin');
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Settings - read for all, write for superadmin only
    match /settings/{settingId} {
      allow read: if true;
      allow write: if request.auth != null && 
                      request.auth.token.role == 'superadmin';
    }
  }
}
```

### Create Firestore Indexes

For better query performance, create these indexes:

1. Go to Firebase Console → Firestore → Indexes
2. Create composite indexes:

**Products Index:**
- Collection: `products`
- Fields: `category` (Ascending), `createdAt` (Descending)

**Orders Index:**
- Collection: `orders`
- Fields: `userId` (Ascending), `createdAt` (Descending)

## Part 4: Domain Setup (Optional)

### For Frontend (Vercel)
1. Add domain in Vercel dashboard
2. Configure DNS:
   - Type: `A Record`
   - Name: `@`
   - Value: Vercel IP (provided by Vercel)
   - TTL: 3600

### For Backend (DigitalOcean)
1. Go to DigitalOcean App → Settings → Domains
2. Add `api.tntrends.shop` (or your subdomain)
3. Configure DNS:
   - Type: `CNAME`
   - Name: `api`
   - Value: Your DigitalOcean app domain
   - TTL: 3600

## Part 5: Post-Deployment Checklist

- [ ] Frontend is accessible and loads correctly
- [ ] Backend API health check works (`/health`)
- [ ] User registration and login work
- [ ] Products are displayed correctly
- [ ] Cart functionality works
- [ ] Razorpay payment integration works (test mode first!)
- [ ] Email notifications are sent
- [ ] Admin panel is accessible
- [ ] Image uploads to Cloudinary work
- [ ] All environment variables are set correctly
- [ ] HTTPS is enabled on both frontend and backend

## Part 6: Monitoring and Maintenance

### Vercel
- Monitor deployments in Vercel dashboard
- Check Analytics for performance metrics
- Review function logs for errors

### DigitalOcean
- Monitor app metrics in DigitalOcean dashboard
- Set up alerts for high CPU/memory usage
- Review runtime logs regularly

### Firebase
- Monitor Firestore usage in Firebase Console
- Check Authentication metrics
- Review Firebase Crashlytics (if enabled)

## Troubleshooting

### Frontend Issues
1. **Build fails**: Check Node version compatibility
2. **Environment variables not working**: Ensure they start with `NEXT_PUBLIC_`
3. **API calls fail**: Verify CORS settings and API URL

### Backend Issues
1. **Firebase initialization fails**: Check private key format
2. **CORS errors**: Verify `FRONTEND_URL` matches your domain
3. **Cloudinary uploads fail**: Verify API credentials

### Performance Issues
1. Run Lighthouse audit
2. Check image optimization settings
3. Review bundle size in Vercel analytics
4. Optimize Firestore queries

## Security Considerations

- [ ] Use production Firebase project (separate from development)
- [ ] Enable Firebase App Check
- [ ] Use Razorpay production keys (not test keys)
- [ ] Set up proper Firestore security rules
- [ ] Enable HTTPS only
- [ ] Use strong passwords for admin accounts
- [ ] Regularly update dependencies
- [ ] Monitor for suspicious activity

## Cost Estimates

**Free Tiers:**
- Vercel: Free (Hobby plan)
- Firebase: Free tier (Spark plan) - upgrade if needed
- Cloudinary: Free tier (25GB storage, 25GB bandwidth/month)

**Paid Services:**
- DigitalOcean App Platform: ~$5-12/month (Basic plan)
- Domain: ~$10-15/year
- Resend: Free tier (100 emails/day) - upgrade if needed

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [DigitalOcean App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

**Deployment Complete! 🎉**

Your TNtrends e-commerce platform is now live and ready for customers.
