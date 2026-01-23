# 🚀 Quick Setup & Run Guide - TNtrends E-commerce

Follow these steps to get your application running locally.

## Prerequisites Checklist

Before starting, ensure you have:
- ✅ Node.js 18+ installed (`node --version`)
- ✅ npm installed (`npm --version`)
- ✅ Git installed (optional)

## Step-by-Step Setup

### Step 1: Install Dependencies (All Packages)

Open 3 terminal windows in VS Code (Terminal → New Terminal) and run:

**Terminal 1 - Shared Types:**
```bash
cd "d:\personal\Projects\Riyas\TNtrends Ecommerce\Site2\shared"
npm install
```

**Terminal 2 - Backend:**
```bash
cd "d:\personal\Projects\Riyas\TNtrends Ecommerce\Site2\backend"
npm install
```

**Terminal 3 - Frontend:**
```bash
cd "d:\personal\Projects\Riyas\TNtrends Ecommerce\Site2\frontend"
npm install
```

⏱️ This will take 2-3 minutes total.

---

### Step 2: Set Up Environment Variables

#### Backend Configuration

1. Navigate to backend folder:
```bash
cd "d:\personal\Projects\Riyas\TNtrends Ecommerce\Site2\backend"
```

2. Copy the example file:
```bash
copy .env.example .env
```

3. Open `backend/.env` and fill in your credentials:

```env
PORT=5000
NODE_ENV=development

# Firebase Admin SDK (from Firebase Console)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Key-Here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Cloudinary (from cloudinary.com dashboard)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Razorpay (from razorpay.com dashboard - use TEST keys)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your-razorpay-secret

# Resend (from resend.com)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxx
FROM_EMAIL=orders@yourdomain.com

# CORS (your frontend URL)
FRONTEND_URL=http://localhost:3000
```

#### Frontend Configuration

1. Navigate to frontend folder:
```bash
cd "d:\personal\Projects\Riyas\TNtrends Ecommerce\Site2\frontend"
```

2. Copy the example file:
```bash
copy .env.example .env.local
```

3. Open `frontend/.env.local` and fill in:

```env
# Firebase Client SDK (from Firebase Console → Project Settings → Web App)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:xxxxxxxxxx

# Backend API URL (local development)
NEXT_PUBLIC_API_URL=http://localhost:5000

# Razorpay (same TEST key as backend)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
```

---

### Step 3: Quick Start Without Credentials (For Testing Structure)

If you don't have credentials yet, you can still test the application structure:

**Skip environment setup temporarily** and proceed to run the servers. The frontend will load, but API calls will fail (expected).

---

### Step 4: Run the Application

#### Option A: Run Both Servers Simultaneously

**Terminal 1 - Backend:**
```bash
cd "d:\personal\Projects\Riyas\TNtrends Ecommerce\Site2\backend"
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd "d:\personal\Projects\Riyas\TNtrends Ecommerce\Site2\frontend"
npm run dev
```

You should see:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Ready in 3.2s
```

#### Option B: Quick Test Commands (Copy-Paste)

**For Backend:**
```bash
cd "d:\personal\Projects\Riyas\TNtrends Ecommerce\Site2\backend" && npm run dev
```

**For Frontend:**
```bash
cd "d:\personal\Projects\Riyas\TNtrends Ecommerce\Site2\frontend" && npm run dev
```

---

### Step 5: Access the Application

Once both servers are running:

#### Frontend URLs:
- **Homepage**: http://localhost:3000
- **Products**: http://localhost:3000/category/men
- **Login**: http://localhost:3000/auth/login
- **Cart**: http://localhost:3000/cart
- **Admin** (after login): http://localhost:3000/admin

#### Backend URLs:
- **Health Check**: http://localhost:5000/health
- **API Products**: http://localhost:5000/api/products
- **API Settings**: http://localhost:5000/api/settings

---

### Step 6: Verify Everything Works

#### Test Backend:
Open browser and visit: http://localhost:5000/health

Expected response:
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

#### Test Frontend:
Open browser and visit: http://localhost:3000

You should see:
- TNtrends homepage
- Hero section
- Category cards (Men, Women, Kids)
- Footer

---

## 🔧 Troubleshooting

### Backend Won't Start

**Error: "Port 5000 is already in use"**
```bash
# Windows: Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <process-id> /F
```

**Error: "Firebase initialization failed"**
- Check FIREBASE_PROJECT_ID is correct
- Verify FIREBASE_PRIVATE_KEY has proper line breaks (`\n`)
- Ensure FIREBASE_CLIENT_EMAIL matches your service account

### Frontend Won't Start

**Error: "Module not found"**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Error: "Environment variables not loading"**
- Ensure file is named `.env.local` (not `.env`)
- All variables start with `NEXT_PUBLIC_`
- Restart the dev server after changing env vars

### API Calls Failing

**If you see CORS errors:**
- Verify FRONTEND_URL in backend `.env` is `http://localhost:3000`
- Restart backend server

**If you see "Unauthorized" errors:**
- Backend is running but Firebase credentials are missing
- Login won't work without proper Firebase setup

---

## 📝 What to Do Without Credentials

If you don't have Firebase/Cloudinary/Razorpay accounts yet:

1. **Frontend will still work** - You can see all pages and UI
2. **Static features work** - Navigation, cart (local), design system
3. **API calls will fail** - Login, products, checkout won't work

**To test with dummy data:**
You can manually create products in the frontend state or mock API responses.

---

## 🎯 Next Steps After Running

1. **Create Firebase Project**: https://console.firebase.google.com
2. **Set up Cloudinary**: https://cloudinary.com (free tier)
3. **Get Razorpay Test Keys**: https://razorpay.com (test mode)
4. **Get Resend API Key**: https://resend.com (free tier)
5. **Configure environment variables** with real credentials
6. **Create first admin user** (follow ADMIN_SETUP.md)

---

## 🚀 Quick Command Reference

```bash
# Install all dependencies
cd shared && npm install && cd ../backend && npm install && cd ../frontend && npm install

# Start backend (Terminal 1)
cd backend && npm run dev

# Start frontend (Terminal 2)
cd frontend && npm run dev

# Build for production
cd backend && npm run build
cd frontend && npm run build
```

---

## ✅ Success Checklist

- [ ] Node.js and npm installed
- [ ] All dependencies installed (`node_modules` in all 3 folders)
- [ ] Environment files created (`.env` in backend, `.env.local` in frontend)
- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Homepage loads successfully
- [ ] Backend health check responds

---

**You're ready to start development! 🎉**

Visit http://localhost:3000 to see your TNtrends e-commerce platform!
