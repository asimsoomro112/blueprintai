# BlueprintAI - AI-Powered Sketch-to-Web Conversion Platform

BlueprintAI is a modern, production-quality SaaS web application that converts hand-drawn UI sketches or wireframes into clean, interactive frontend code (React + Tailwind CSS or standalone HTML/CSS/JS). 

This project was built for academic presentations and web engineering submissions, designed to run entirely on free-tier services. It features a stunning glassmorphism dark-theme design, full Firebase Authentication, dynamic Cloudinary uploads, and direct compilation using the Gemini Developer API (free tier).

---

## 🚀 Key Features

1. **AI Sketch Detection**: Upload or drag-and-drop a wireframe image. Gemini Vision analyzes layout, inputs, forms, sidebars, grids, and cards.
2. **Dual Code Output**: Instantly compiles your wireframe layout into either a modular React component with Tailwind CSS styling or traditional standalone HTML/CSS/JS.
3. **Interactive Code Workbench**: Side-by-side layout containing:
   - Original sketch image preview panel.
   - Monaco Code Editor (VS Code styled) with live editable code.
   - Embedded Codesandbox Sandpack browser preview sandbox with live reloading.
4. **Project Exports**: Download your generated layouts as a complete, ready-to-run ZIP package.
5. **Dashboard & History**: View conversion statistics and browse previous conversions stored in Firebase Firestore.
6. **Graceful Demo Fallback**: No keys? No problem! The application automatically falls back to an elegant "Demo Mode" using mocked conversions, client-side local storage, and simulated processes so the entire app can be tested immediately.

---

## 🛠️ Technology Stack

- **Core Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Programming Language**: [TypeScript](https://www.typescript.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Authentication**: [Firebase Authentication](https://firebase.google.com/products/auth)
- **Database**: [Firebase Firestore](https://firebase.google.com/products/firestore)
- **Image Storage**: [Cloudinary API](https://cloudinary.com/) (using custom server-side API proxy upload)
- **AI Core**: [Gemini Developer API (gemini-2.5-flash)](https://ai.google.dev/)
- **Code Sandbox**: [@codesandbox/sandpack-react](https://sandpack.codesandbox.io/)
- **Code Editor**: [@monaco-editor/react](https://github.com/suren-atoyan/monaco-react)
- **ZIP Compilation**: [JSZip](https://stuk.github.io/jszip/)

---

## 📂 Project Structure

```
blueprint-ai/
├── src/
│   ├── app/
│   │   ├── api/                   # Serverless routes for upload, convert, regenerate, deletions
│   │   ├── convert/               # Sketch upload panel and interactive [id] workspace
│   │   ├── dashboard/             # Protected conversion dashboard
│   │   ├── login/                 # Firebase auth login route
│   │   ├── settings/              # Profile settings and connection diagnostics
│   │   ├── signup/                # User signup route
│   │   ├── globals.css            # Global variables, glassmorphism utilities, ambient blobs
│   │   └── layout.tsx             # Theme provider, auth provider, toast configuration
│   ├── components/
│   │   ├── auth/                  # AuthContext provider and Route Guard wrappers
│   │   └── layout/                # Responsive navigation shells
│   ├── hooks/                     # Custom react hooks (useAuth wrapper)
│   ├── lib/
│   │   ├── firebase/              # Firebase Client and Admin initializers
│   │   ├── cloudinary.ts          # Server-side Cloudinary connection
│   │   ├── gemini.ts              # Gemini client prompts & mock generation fallbacks
│   │   ├── utils.ts               # Date utilities, cn helper, client image compression
│   │   └── zip.ts                 # Project packager helper using JSZip
│   └── types/                     # Shared interface schemas
├── firestore.rules                # Secure firestore document rules
├── package.json                   # Dependency definitions
└── tsconfig.json                  # Compiler specs
```

---

## ⚙️ Setup & Installation

### 1. Clone the project and install dependencies
```bash
cd blueprint-ai
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory (based on `.env.local.example`):
```ini
# Firebase Client Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id

# Firebase Admin Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_UPLOAD_FOLDER=blueprintai-sketches

# Gemini Developer API Configuration
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

# General Configuration
APP_URL=http://localhost:3000
```

*Note: If these variables are not present or contain `"your_"`, the application will seamlessly boot in **Demo Mode**, utilizing standard client local storage for state and mocking AI generations.*

### 3. Apply Firestore Security Rules
Make sure to apply the following rules to Firestore:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /conversions/{conversionId} {
      allow read, write, delete: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## 🏃 Running the Application

### Development Server
Run the local dev server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### Production Build
Compile the project for deployment:
```bash
npm run build
npm run start
```

---

## 🧪 Testing Diagnostic Check
Navigate to the **Settings** page inside the dashboard to run the built-in Connection Diagnostics tool. This will run tests against:
- Cloudinary client config verification.
- Firebase integration checks.
- Gemini API key verification.
- Output mode toggles (Demo vs Real API connectivity).
