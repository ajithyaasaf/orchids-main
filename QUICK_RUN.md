# 🎯 Quick Start Commands - TNtrends E-commerce

## ✅ Step 1: Dependencies Installed!

I've started installing all dependencies for you. This may take 2-3 minutes.

---

## 🚀 Step 2: Run the Application

Once installation completes, follow these commands:

### Option A: Manual Start (Recommended for First Time)

**Terminal 1 - Start Backend:**
```powershell
cd "d:\personal\Projects\Riyas\TNtrends Ecommerce\Site2\backend"
npm run dev
```

**Terminal 2 - Start Frontend:**
```powershell
cd "d:\personal\Projects\Riyas\TNtrends Ecommerce\Site2\frontend"
npm run dev
```

### Option B: One-Line Commands

**Backend:**
```powershell
cd "d:\personal\Projects\Riyas\TNtrends Ecommerce\Site2\backend"; npm run dev
```

**Frontend:**
```powershell
cd "d:\personal\Projects\Riyas\TNtrends Ecommerce\Site2\frontend"; npm run dev
```

---

## 📍 Access Your Application

### Frontend (User Interface):
- **Homepage**: http://localhost:3000
- **Products**: http://localhost:3000/category/men
- **Login**: http://localhost:3000/auth/login
- **Register**: http://localhost:3000/auth/register
- **Cart**: http://localhost:3000/cart
- **Admin Panel**: http://localhost:3000/admin

### Backend (API):
- **Health Check**: http://localhost:5000/health
- **Products API**: http://localhost:5000/api/products
- **Settings API**: http://localhost:5000/api/settings

---

## ⚠️ Important: Environment Variables Needed

Before the app works fully, you need to set up credentials:

### Backend (.env file needed):
1. Create file: `backend/.env`
2. Copy from: `backend/.env.example`
3. Fill in your credentials for:
   - Firebase (for authentication)
   - Cloudinary (for images)
   - Razorpay (for payments)
   - Resend (for emails)

### Frontend (.env.local file needed):
1. Create file: `frontend/.env.local`
2. Copy from: `frontend/.env.example`
3. Fill in:
   - Firebase client config
   - Backend URL: `http://localhost:5000`
   - Razorpay key

---

## 🎨 What Works Without Credentials:

Even without credentials, you can see:
- ✅ Complete UI/UX design
- ✅ All pages and navigation
- ✅ Responsive design
- ✅ Cart functionality (local storage)
- ✅ Component library

What won't work:
- ❌ User login/registration
- ❌ Fetching products from backend
- ❌ Image uploads
- ❌ Payment processing
- ❌ Email notifications

---

## 🔑 Getting Credentials (All Free Tier):

### 1. Firebase (Authentication + Database)
- Visit: https://console.firebase.google.com
- Create new project
- Enable Authentication (Email/Password)
- Enable Firestore Database
- Get credentials from Project Settings

### 2. Cloudinary (Image Storage)
- Visit: https://cloudinary.com
- Sign up for free
- Get API credentials from dashboard

### 3. Razorpay (Payment Gateway)
- Visit: https://razorpay.com
- Sign up
- Use TEST mode keys for development

### 4. Resend (Email Service)
- Visit: https://resend.com
- Sign up for free
- Get API key from dashboard

---

## ✅ Verification Steps

### After starting servers:

**1. Check Backend:**
```powershell
# Should see: {"status":"ok","message":"Server is running"}
curl http://localhost:5000/health
```

**2. Check Frontend:**
- Open browser: http://localhost:3000
- Should see TNtrends homepage with hero section

**3. Check API:**
```powershell
# Should return products array (empty if no credentials)
curl http://localhost:5000/api/products
```

---

## 🛠️ Troubleshooting

### Port Already in Use:
```powershell
# Find and kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <pid> /F

# Find and kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <pid> /F
```

### Dependencies Failed:
```powershell
# Clean and reinstall
cd backend
rmdir node_modules /s /q
del package-lock.json
npm install
```

### Environment Variables Not Loading:
- Restart the server after changing .env files
- Ensure frontend env vars start with `NEXT_PUBLIC_`
- Check file is `.env.local` not `.env` in frontend

---

## 📚 Next Steps

1. ✅ Install dependencies (in progress)
2. ⏭️ Start backend server
3. ⏭️ Start frontend server
4. ⏭️ Visit http://localhost:3000
5. ⏭️ Set up credentials for full functionality
6. ⏭️ Create first admin user (see ADMIN_SETUP.md)
7. ⏭️ Add test products
8. ⏭️ Test complete flow

---

## 🎯 Quick Reference

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | User interface |
| Backend | http://localhost:5000 | API server |
| Admin | http://localhost:3000/admin | Admin panel |
| API Docs | See API_DOCUMENTATION.md | All endpoints |
| Setup Guide | See SETUP_AND_RUN.md | Detailed setup |

---

**Ready to launch! Just run the two start commands above! 🚀**
