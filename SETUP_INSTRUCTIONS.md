# Curtex Furnishing - Production Management App

## 📱 Overview
A comprehensive React Native mobile application for fabric and curtain production management, built with Expo and Firebase. Designed specifically for Curtex Furnishing Pvt. Ltd. to manage inventory, dyeing orders, job cards, and stitching work orders with real-time multi-location sync.

---

## 🚀 Quick Start

### Prerequisites
- Node.js installed
- Expo Go app on your mobile device
- Firebase account (free tier works great!)

### Installation Steps

1. **Navigate to frontend directory:**
```bash
cd /app/frontend
```

2. **Install dependencies:**
```bash
yarn install
```

3. **Set up Firebase (See Firebase Setup below)**

4. **Start the development server:**
```bash
yarn start
```

5. **Scan QR code with Expo Go app** on your mobile device

---

## 🔥 Firebase Setup (CRITICAL - Must Complete)

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add Project"**
3. Enter project name: **"curtex-production"** (or your choice)
4. Disable Google Analytics (optional for this app)
5. Click **"Create Project"**

### Step 2: Add Web App to Firebase Project

1. In Firebase Console, click the **Web icon** `</>`
2. Register app with nickname: **"Curtex Mobile App"**
3. **DO NOT** enable Firebase Hosting
4. Copy the Firebase configuration object

### Step 3: Enable Firestore Database

1. In Firebase Console sidebar, go to **"Firestore Database"**
2. Click **"Create database"**
3. Select **"Start in test mode"** (for development)
4. Choose your preferred location (e.g., `asia-south1` for India)
5. Click **"Enable"**

### Step 4: Configure Firebase Rules (Important for Security)

In Firestore Database → Rules tab, paste this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all operations for development
    // TODO: Add proper authentication before production
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ IMPORTANT:** These rules allow anyone to read/write. Before going to production, implement proper authentication!

### Step 5: Update Firebase Config in App

Open `/app/frontend/firebase.config.ts` and replace with your Firebase credentials:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

**Where to find these values?**
- Firebase Console → Project Settings → General → Your apps → Web app → Config

### Step 6: Initialize Counter Documents (Optional but Recommended)

Firebase will auto-create these, but you can manually create them in Firestore for better control:

1. Go to Firestore Database
2. Create a collection named `counters`
3. Add these documents:
   - Document ID: `rollNumber`, Field: `count` (number) = `0`
   - Document ID: `DYE`, Field: `count` (number) = `0`
   - Document ID: `JOB`, Field: `count` (number) = `0`
   - Document ID: `STW`, Field: `count` (number) = `0`

---

## 📦 Features

### 1. **Dashboard**
- Real-time overview of inventory, job cards, and orders
- Quick stats: Total rolls, quantity, active jobs, pending orders
- Recent activity feed

### 2. **Fabric Inventory Management**
- ✅ Inward entry with auto roll number generation (up to 50,000 capacity)
- ✅ Record fabric details: Code, Design, Width, Lot, Quantity, Location
- ✅ Outward movement tracking
- ✅ Real-time stock status across multiple locations
- ✅ Search and filter by status (Active/Consumed)

### 3. **Dyeing House Orders**
- ✅ Create dyeing orders with fabric specifications
- ✅ Generate PDF orders for sharing
- ✅ Track received/pending status
- ✅ Order details: Fabric code, quantity, color, dyeing house

### 4. **Job Card Management**
- ✅ Comprehensive job card creation with all specifications
- ✅ PO Number, Customer Name, Delivery tracking
- ✅ Raw material specification (Fabric code, design, width)
- ✅ Job order specifications table (Drop, Ready, Width, Pieces, Meters)
- ✅ Additional details: Sets, Hanging mechanism, Velcro, Side fold
- ✅ **5-Stage Production Tracking:**
  1. Fabric Received
  2. Cutting Complete
  3. Stitching Complete
  4. Quality Check
  5. Packing Done
- ✅ PDF generation matching your exact format

### 5. **Stitching Work Orders**
- ✅ Create work orders linked to job cards
- ✅ Reference job card selection
- ✅ Stitching specifications with multiple rows
- ✅ Track issued to (tailor), fabric colour
- ✅ PDF generation for work orders
- ✅ Mark completed/pending status

---

## 📄 PDF Generation

The app generates two types of PDFs exactly matching your provided formats:

### Job Card PDF Structure:
- Header with Job Card number, PO, Customer, Dates
- Raw Material Specification section
- Job Order Specification table (10 rows)
- Additional details (Sets, Hanging, Velcro, etc.)
- Completion and approval fields

### Stitching Work Order PDF Structure:
- Work Order number, Issued to, Reference job
- Stitching Specifications table
- Receipt and specification columns
- Total and completion date

Both PDFs can be shared via WhatsApp, Email, or saved to device!

---

## 🏗️ App Architecture

```
Tech Stack:
- Frontend: React Native (Expo Router)
- Database: Firebase Firestore
- PDF: expo-print
- Navigation: Expo Router with Tabs
- State: React + Firebase Real-time Listeners
```

### File Structure:
```
frontend/
├── app/
│   ├── (tabs)/              # Tab navigation screens
│   │   ├── dashboard.tsx    # Dashboard screen
│   │   ├── inventory.tsx    # Inventory management
│   │   ├── dyeing.tsx       # Dyeing orders
│   │   ├── jobcards.tsx     # Job cards with 5-stage tracking
│   │   └── stitching.tsx    # Stitching work orders
│   ├── job-card-form.tsx    # Job card creation form
│   ├── stitching-form.tsx   # Stitching order form
│   ├── index.tsx            # Welcome/splash screen
│   └── _layout.tsx          # Root layout
├── components/
│   └── FabricInwardForm.tsx # Fabric inward form component
├── utils/
│   ├── firebaseUtils.ts     # Firebase CRUD operations
│   └── pdfGenerator.ts      # PDF generation functions
├── types/
│   └── index.ts             # TypeScript interfaces
└── firebase.config.ts       # Firebase configuration
```

---

## 🔐 Security Recommendations

**Before Production:**
1. **Enable Firebase Authentication:**
   - Add Email/Password or Phone authentication
   - Restrict Firestore rules to authenticated users only

2. **Update Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. **Add User Roles:**
   - Admin: Full access
   - Warehouse Staff: Inventory only
   - Production Staff: Job cards and stitching only

---

## 💰 Firebase Pricing (Free Tier is Generous!)

**Firestore Free Tier:**
- 50,000 document reads/day
- 20,000 document writes/day
- 20,000 deletes/day
- 1 GB storage

**For your use case:**
- 4-5 simultaneous users
- Estimated 500-1000 operations/day
- **You'll stay well within free tier limits!**

**If you exceed limits:**
- Blaze plan: Pay-as-you-go
- First 50K reads are free, then $0.06 per 100K reads
- Very affordable for small businesses

---

## 📱 Testing on Mobile

### Option 1: Expo Go App (Recommended for Testing)
1. Download **Expo Go** app from:
   - iOS: App Store
   - Android: Play Store
2. Scan QR code from terminal
3. App loads instantly!

### Option 2: Build Standalone App (For Production)
```bash
# Build Android APK
eas build --platform android --profile preview

# Build iOS (requires Apple Developer account)
eas build --platform ios --profile preview
```

---

## 🐛 Troubleshooting

### Issue: Firebase Not Working
**Solution:**
- Double-check firebase.config.ts has correct credentials
- Ensure Firestore is enabled in Firebase Console
- Check Firestore rules allow read/write

### Issue: PDF Not Generating
**Solution:**
- On Android: Works out of the box
- On iOS: May need additional permissions in app.json

### Issue: App Not Loading on Phone
**Solution:**
- Ensure phone and computer on same WiFi
- Check firewall isn't blocking connections
- Try restarting Expo dev server

### Issue: Data Not Syncing
**Solution:**
- Check internet connection on device
- Verify Firebase rules aren't blocking writes
- Check Firebase Console → Firestore for errors

---

## 📞 Support & Maintenance

**Created for:** Curtex Furnishing Pvt. Ltd.
**Development Date:** January 2025
**Technology:** React Native + Firebase

**Future Enhancements:**
1. User authentication with roles
2. Offline mode with sync
3. Advanced reporting and analytics
4. Barcode scanning for fabric rolls
5. Image attachments for job cards
6. Push notifications for order updates

---

## 📝 Usage Tips

1. **Start with Inventory:**
   - Add fabric rolls first
   - System auto-generates roll numbers
   - Track inward and outward movements

2. **Create Dyeing Orders:**
   - Simple form with fabric details
   - Generate and share PDFs
   - Mark received when fabric arrives

3. **Job Cards:**
   - Fill comprehensive form
   - Add multiple specification rows
   - Track through 5 production stages
   - Generate professional PDFs

4. **Stitching Orders:**
   - Reference existing job cards
   - Define stitching specifications
   - Track completion status

5. **Multi-Location Sync:**
   - All data syncs in real-time
   - Multiple users can view simultaneously
   - Changes reflect instantly across devices

---

## 🎯 Key Benefits

✅ **No More Excel Sheets:** All data in one organized app
✅ **Real-time Sync:** Multi-location coordination made easy
✅ **Professional PDFs:** Share with dyeing houses and tailors
✅ **Production Tracking:** 5-stage system for complete visibility
✅ **Mobile-First:** Access anywhere, anytime
✅ **Cost-Effective:** Free Firebase tier sufficient
✅ **Easy to Use:** Designed for non-technical staff

---

## 🚀 Next Steps

1. ✅ Set up Firebase (15 minutes)
2. ✅ Update firebase.config.ts with your credentials
3. ✅ Test app on your mobile device
4. ✅ Add sample data (fabric, job card)
5. ✅ Train your team
6. ✅ Go live!

**Happy Production Management! 🎉**
