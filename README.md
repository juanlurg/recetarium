# Recetarium

Family recipe manager with Instagram import and shopping list.

## Setup

1. Clone the repository
2. Copy `.env.example` to `.env.local` and fill in values:
   - `APP_PASSWORD`: Shared password for app access
   - Firebase config: Get from Firebase Console
   - `GOOGLE_GENERATIVE_AI_API_KEY`: Get from Google AI Studio

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

## Deployment to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel project settings
4. Deploy

## Firebase Setup

1. Create Firebase project at console.firebase.google.com
2. Enable Firestore Database
3. Enable Storage
4. Copy config to `.env.local`
5. Apply security rules from `firestore.rules`
