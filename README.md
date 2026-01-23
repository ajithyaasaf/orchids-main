# TNtrends E-commerce Platform

A production-ready full-stack e-commerce application for a clothing brand built with Next.js, Express.js, Firebase, Cloudinary, and Razorpay.

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Authentication**: Firebase Auth
- **Image Optimization**: next/image with Cloudinary
- **Payment**: Razorpay

### Backend
- **Framework**: Express.js with TypeScript
- **Database**: Firebase Firestore
- **Authentication**: Firebase Admin SDK
- **Image Storage**: Cloudinary
- **Payment Gateway**: Razorpay
- **Email Service**: Resend

## 📁 Project Structure

```
tntrends-ecommerce/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/             # Next.js 14 App Router pages
│   │   ├── components/      # React components
│   │   ├── store/           # Zustand stores
│   │   └── lib/             # Utilities and API client
│   ├── public/              # Static assets
│   └── package.json
├── backend/                 # Express.js backend API
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── services/        # Business logic
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Express middleware
│   │   └── index.ts         # Server entry point
│   └── package.json
├── shared/                  # Shared TypeScript types
│   ├── types.ts
│   └── package.json
└── docs/                    # Documentation
    ├── DEPLOYMENT.md
    ├── API_DOCUMENTATION.md
    └── ADMIN_SETUP.md
```

## 🎨 Design System

- **Primary Color**: #00B0B5 (Teal)
- **Secondary Color**: #046E7B (Dark Teal)
- **Background**: #F8FAFC
- **Typography**: Inter font family
- **Design Principles**: Modern, minimal, premium look with ample white space

## ⚙️ Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Firebase project (Auth + Firestore)
- Cloudinary account
- Razorpay account
- Resend account (for emails)

### 1. Clone and Install

```bash
# Install shared types
cd shared
npm install

# Install backend dependencies
cd ../backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Variables

#### Backend (.env)
```env
PORT=5000
NODE_ENV=development

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your-razorpay-secret

# Resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxx
FROM_EMAIL=orders@tntrends.shop

# CORS
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env.local)
```env
# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:xxxxxxxxxx

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:5000

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
```

### 3. Run Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 🔐 Admin Setup

1. Create a user account through the frontend authentication
2. Get the user UID from Firebase Console (Authentication section)
3. Open Firestore Console and navigate to the `users` collection
4. Find your user document and set the `role` field to `"superadmin"`
5. In Firebase Console, go to Authentication → Users → Your User → Custom Claims
6. Add custom claim: `{"role": "superadmin"}`

Now you can access the admin panel at `/admin`

## 📦 Key Features

### Customer Features
- ✅ Browse products by category
- ✅ Product search with filters
- ✅ Product detail with multiple images
- ✅ Size and stock selection
- ✅ Shopping cart with persistence
- ✅ Secure checkout with Razorpay
- ✅ Order history
- ✅ Email confirmations
- ✅ Responsive design

### Admin Features
- ✅ Product management (CRUD)
- ✅ Image upload to Cloudinary
- ✅ Stock management by size
- ✅ Order management
- ✅ Status updates
- ✅ Role-based access control (superadmin/admin)
- ✅ Global settings management

## 🚢 Deployment

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed deployment instructions:
- Frontend: Vercel
- Backend: DigitalOcean App Platform

## 📖 API Documentation

See [API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md) for complete API reference.

## 🎯 Performance Optimizations

- ✅ Static Site Generation (SSG) for key pages
- ✅ next/image for automatic image optimization
- ✅ Cloudinary CDN for images (WebP, auto quality)
- ✅ Code splitting and lazy loading
- ✅ Tailwind CSS purging
- ✅ SWC compiler for faster builds
- ✅ Firestore query indexing

**Target**: 90+ Google Lighthouse score across all metrics

## 🔧 Scripts

### Frontend
```bash
npm run dev       # Development server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run linter
```

### Backend
```bash
npm run dev       # Development server with hot reload
npm run build     # Compile TypeScript
npm run start     # Start production server
```

## 📝 Copyright

© 2026 TNtrends. All rights reserved.

This is proprietary software. Unauthorized copying, distribution, or use of this software is strictly prohibited.

## 📧 Support

For issues or questions, please check the documentation in the `docs/` folder.

---

**Built with ❤️ for TNtrends**
