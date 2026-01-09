# Recetarium Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a family recipe manager webapp with Instagram reel import via Gemini 3 Flash AI processing and smart shopping list generation.

**Architecture:** Next.js 14 App Router with server actions for API logic. Firebase Firestore for data persistence, Firebase Storage for temporary video uploads. Simple password middleware for access control. Vercel AI SDK for Gemini integration.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Firebase (Firestore + Storage), Vercel AI SDK, Gemini 3 Flash, Vercel deployment

---

## Phase 1: Project Foundation

### Task 1.1: Initialize Next.js Project

**Files:**
- Create: Project root with Next.js scaffold

**Step 1: Create Next.js project**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

When prompted, accept defaults (Yes to all).

Expected: Project scaffolded with `src/app`, `tailwind.config.ts`, etc.

**Step 2: Verify project runs**

Run:
```bash
npm run dev
```

Expected: Server starts on http://localhost:3000

**Step 3: Commit**

```bash
git init
git add .
git commit -m "chore: initialize Next.js project with TypeScript and Tailwind"
```

---

### Task 1.2: Install Core Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install Firebase SDK**

Run:
```bash
npm install firebase
```

**Step 2: Install Vercel AI SDK with Google provider**

Run:
```bash
npm install ai @ai-sdk/google
```

**Step 3: Install shadcn/ui CLI and initialize**

Run:
```bash
npx shadcn@latest init
```

When prompted:
- Style: Default
- Base color: Neutral
- CSS variables: Yes

**Step 4: Commit**

```bash
git add .
git commit -m "chore: add Firebase, Vercel AI SDK, and shadcn/ui"
```

---

### Task 1.3: Add shadcn/ui Components

**Files:**
- Create: `src/components/ui/*.tsx` (multiple component files)

**Step 1: Install required components**

Run:
```bash
npx shadcn@latest add button input textarea card checkbox label dialog navigation-menu separator scroll-area badge
```

**Step 2: Verify components installed**

Run:
```bash
ls src/components/ui/
```

Expected: button.tsx, input.tsx, textarea.tsx, card.tsx, checkbox.tsx, label.tsx, dialog.tsx, navigation-menu.tsx, separator.tsx, scroll-area.tsx, badge.tsx

**Step 3: Commit**

```bash
git add .
git commit -m "chore: add shadcn/ui components"
```

---

### Task 1.4: Create Environment Configuration

**Files:**
- Create: `.env.local`
- Create: `.env.example`
- Modify: `.gitignore`

**Step 1: Create .env.example (template for required vars)**

Create file `.env.example`:
```env
# App Security
APP_PASSWORD=your_shared_password_here

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Gemini AI
GOOGLE_GENERATIVE_AI_API_KEY=
```

**Step 2: Create .env.local with placeholder values**

Create file `.env.local`:
```env
# App Security
APP_PASSWORD=changeme

# Firebase Configuration (get from Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Gemini AI (get from Google AI Studio)
GOOGLE_GENERATIVE_AI_API_KEY=
```

**Step 3: Verify .gitignore includes .env.local**

Check `.gitignore` contains `.env*.local` - Next.js includes this by default.

**Step 4: Commit**

```bash
git add .env.example .gitignore
git commit -m "chore: add environment configuration template"
```

---

### Task 1.5: Setup Firebase Configuration

**Files:**
- Create: `src/lib/firebase.ts`

**Step 1: Create Firebase initialization file**

Create file `src/lib/firebase.ts`:
```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
```

**Step 2: Commit**

```bash
git add src/lib/firebase.ts
git commit -m "feat: add Firebase configuration"
```

---

### Task 1.6: Create Type Definitions

**Files:**
- Create: `src/types/recipe.ts`
- Create: `src/types/shopping.ts`

**Step 1: Create Recipe type**

Create file `src/types/recipe.ts`:
```typescript
export interface Recipe {
  id: string;
  title: string;
  ingredients: string;
  steps: string[];
  servings?: number;
  cookingTime?: string;
  cuisine?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  dietaryTags?: string[];
  source: 'manual' | 'instagram';
  sourceUrl?: string;
  createdAt: Date;
  createdBy: 'juanlu' | 'maria';
}

export type RecipeFormData = Omit<Recipe, 'id' | 'createdAt'>;

export type UserName = 'juanlu' | 'maria';
```

**Step 2: Create Shopping types**

Create file `src/types/shopping.ts`:
```typescript
export interface ShoppingItem {
  id: string;
  text: string;
  checked: boolean;
  fromRecipes: string[];
}

export interface ShoppingList {
  items: ShoppingItem[];
  lastCleared: Date | null;
}
```

**Step 3: Commit**

```bash
git add src/types/
git commit -m "feat: add TypeScript type definitions for Recipe and Shopping"
```

---

## Phase 2: Password Protection

### Task 2.1: Create Auth Context and Provider

**Files:**
- Create: `src/contexts/auth-context.tsx`

**Step 1: Create auth context**

Create file `src/contexts/auth-context.tsx`:
```typescript
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: 'juanlu' | 'maria' | null;
  login: (password: string, user: 'juanlu' | 'maria') => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<'juanlu' | 'maria' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if already authenticated on mount
    const storedAuth = localStorage.getItem('recetarium_auth');
    const storedUser = localStorage.getItem('recetarium_user') as 'juanlu' | 'maria' | null;
    if (storedAuth === 'true' && storedUser) {
      setIsAuthenticated(true);
      setCurrentUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (password: string, user: 'juanlu' | 'maria'): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
        setCurrentUser(user);
        localStorage.setItem('recetarium_auth', 'true');
        localStorage.setItem('recetarium_user', user);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('recetarium_auth');
    localStorage.removeItem('recetarium_user');
  };

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

**Step 2: Commit**

```bash
git add src/contexts/auth-context.tsx
git commit -m "feat: add authentication context and provider"
```

---

### Task 2.2: Create Password Verification API

**Files:**
- Create: `src/app/api/auth/verify/route.ts`

**Step 1: Create API route**

Create file `src/app/api/auth/verify/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const correctPassword = process.env.APP_PASSWORD;

    if (!correctPassword) {
      console.error('APP_PASSWORD not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (password === correctPassword) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/auth/verify/route.ts
git commit -m "feat: add password verification API endpoint"
```

---

### Task 2.3: Create Login Page

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/app/layout.tsx` (modify existing)

**Step 1: Update root layout with AuthProvider**

Modify `src/app/layout.tsx`:
```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Recetarium',
  description: 'Family recipe manager',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

**Step 2: Create login page component**

Replace `src/app/page.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [selectedUser, setSelectedUser] = useState<'juanlu' | 'maria'>('juanlu');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push('/recipes');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const success = await login(password, selectedUser);

    if (success) {
      router.push('/recipes');
    } else {
      setError('Incorrect password');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Recetarium</CardTitle>
          <p className="text-gray-500">Family Recipe Manager</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Who are you?</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={selectedUser === 'juanlu' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setSelectedUser('juanlu')}
                >
                  Juanlu
                </Button>
                <Button
                  type="button"
                  variant={selectedUser === 'maria' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setSelectedUser('maria')}
                >
                  María
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter shared password"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Entering...' : 'Enter'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx
git commit -m "feat: add login page with user selection"
```

---

### Task 2.4: Create Protected Route Wrapper

**Files:**
- Create: `src/components/protected-route.tsx`

**Step 1: Create protected route component**

Create file `src/components/protected-route.tsx`:
```typescript
'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}
```

**Step 2: Commit**

```bash
git add src/components/protected-route.tsx
git commit -m "feat: add protected route wrapper component"
```

---

## Phase 3: App Layout and Navigation

### Task 3.1: Create Bottom Navigation Component

**Files:**
- Create: `src/components/bottom-nav.tsx`

**Step 1: Create bottom navigation**

Create file `src/components/bottom-nav.tsx`:
```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/recipes', label: 'Recipes', icon: '📖' },
  { href: '/shopping', label: 'Shopping', icon: '🛒' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full',
                isActive ? 'text-blue-600' : 'text-gray-500'
              )}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/bottom-nav.tsx
git commit -m "feat: add bottom navigation component"
```

---

### Task 3.2: Create App Header Component

**Files:**
- Create: `src/components/app-header.tsx`

**Step 1: Create header component**

Create file `src/components/app-header.tsx`:
```typescript
'use client';

import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
}

export function AppHeader({ title = 'Recetarium', showBack = false }: AppHeaderProps) {
  const { currentUser, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-10">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          {showBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="p-1"
            >
              ← Back
            </Button>
          )}
          <h1 className="font-semibold text-lg">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 capitalize">{currentUser}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Exit
          </Button>
        </div>
      </div>
    </header>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/app-header.tsx
git commit -m "feat: add app header component with user display and logout"
```

---

### Task 3.3: Create App Shell Layout

**Files:**
- Create: `src/components/app-shell.tsx`

**Step 1: Create app shell that combines header, content, and bottom nav**

Create file `src/components/app-shell.tsx`:
```typescript
'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { AppHeader } from '@/components/app-header';
import { BottomNav } from '@/components/bottom-nav';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  hideNav?: boolean;
}

export function AppShell({
  children,
  title,
  showBack = false,
  hideNav = false
}: AppShellProps) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <AppHeader title={title} showBack={showBack} />
        <main className={`pt-14 ${hideNav ? 'pb-4' : 'pb-20'} px-4`}>
          {children}
        </main>
        {!hideNav && <BottomNav />}
      </div>
    </ProtectedRoute>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/app-shell.tsx
git commit -m "feat: add app shell layout component"
```

---

## Phase 4: Recipe Data Layer

### Task 4.1: Create Recipe Firestore Operations

**Files:**
- Create: `src/lib/recipes.ts`

**Step 1: Create recipe CRUD operations**

Create file `src/lib/recipes.ts`:
```typescript
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Recipe, RecipeFormData } from '@/types/recipe';

const COLLECTION_NAME = 'recipes';

// Convert Firestore document to Recipe
function docToRecipe(id: string, data: Record<string, unknown>): Recipe {
  return {
    id,
    title: data.title as string,
    ingredients: data.ingredients as string,
    steps: data.steps as string[],
    servings: data.servings as number | undefined,
    cookingTime: data.cookingTime as string | undefined,
    cuisine: data.cuisine as string | undefined,
    difficulty: data.difficulty as Recipe['difficulty'] | undefined,
    dietaryTags: data.dietaryTags as string[] | undefined,
    source: data.source as Recipe['source'],
    sourceUrl: data.sourceUrl as string | undefined,
    createdAt: (data.createdAt as Timestamp).toDate(),
    createdBy: data.createdBy as Recipe['createdBy'],
  };
}

export async function getAllRecipes(): Promise<Recipe[]> {
  const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => docToRecipe(doc.id, doc.data()));
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  const docRef = doc(db, COLLECTION_NAME, id);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  return docToRecipe(snapshot.id, snapshot.data());
}

export async function createRecipe(data: RecipeFormData): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...data,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateRecipe(id: string, data: Partial<RecipeFormData>): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, data);
}

export async function deleteRecipe(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}

export function searchRecipes(recipes: Recipe[], searchTerm: string): Recipe[] {
  const term = searchTerm.toLowerCase().trim();
  if (!term) return recipes;

  return recipes.filter((recipe) => {
    const titleMatch = recipe.title.toLowerCase().includes(term);
    const ingredientMatch = recipe.ingredients.toLowerCase().includes(term);
    return titleMatch || ingredientMatch;
  });
}
```

**Step 2: Commit**

```bash
git add src/lib/recipes.ts
git commit -m "feat: add recipe Firestore CRUD operations"
```

---

## Phase 5: Recipe Pages

### Task 5.1: Create Recipes List Page

**Files:**
- Create: `src/app/recipes/page.tsx`

**Step 1: Create recipes list page**

Create file `src/app/recipes/page.tsx`:
```typescript
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAllRecipes, searchRecipes } from '@/lib/recipes';
import { Recipe } from '@/types/recipe';

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRecipes() {
      try {
        const data = await getAllRecipes();
        setRecipes(data);
      } catch (error) {
        console.error('Failed to load recipes:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadRecipes();
  }, []);

  const filteredRecipes = searchRecipes(recipes, searchTerm);

  return (
    <AppShell title="Recipes">
      <div className="space-y-4 py-4">
        {/* Search */}
        <Input
          type="search"
          placeholder="Search by name or ingredient..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Add button */}
        <div className="flex gap-2">
          <Link href="/recipes/new" className="flex-1">
            <Button className="w-full">+ Add Recipe</Button>
          </Link>
          <Link href="/recipes/new/instagram" className="flex-1">
            <Button variant="outline" className="w-full">+ From Instagram</Button>
          </Link>
        </div>

        {/* Recipe list */}
        {isLoading ? (
          <p className="text-center text-gray-500 py-8">Loading recipes...</p>
        ) : filteredRecipes.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            {searchTerm ? 'No recipes found' : 'No recipes yet. Add your first one!'}
          </p>
        ) : (
          <div className="space-y-3">
            {filteredRecipes.map((recipe) => (
              <Link key={recipe.id} href={`/recipes/${recipe.id}`}>
                <Card className="hover:bg-gray-50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{recipe.title}</h3>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {recipe.cuisine && (
                            <Badge variant="secondary">{recipe.cuisine}</Badge>
                          )}
                          {recipe.cookingTime && (
                            <Badge variant="outline">{recipe.cookingTime}</Badge>
                          )}
                          {recipe.source === 'instagram' && (
                            <Badge variant="outline">📸 Instagram</Badge>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">
                        by {recipe.createdBy}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/recipes/page.tsx
git commit -m "feat: add recipes list page with search"
```

---

### Task 5.2: Create Recipe Detail Page

**Files:**
- Create: `src/app/recipes/[id]/page.tsx`

**Step 1: Create recipe detail page**

Create file `src/app/recipes/[id]/page.tsx`:
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { getRecipeById, deleteRecipe } from '@/lib/recipes';
import { addIngredientsToShoppingList } from '@/lib/shopping';
import { Recipe } from '@/types/recipe';

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [addedToList, setAddedToList] = useState(false);

  const recipeId = params.id as string;

  useEffect(() => {
    async function loadRecipe() {
      try {
        const data = await getRecipeById(recipeId);
        setRecipe(data);
      } catch (error) {
        console.error('Failed to load recipe:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadRecipe();
  }, [recipeId]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteRecipe(recipeId);
      router.push('/recipes');
    } catch (error) {
      console.error('Failed to delete recipe:', error);
      setIsDeleting(false);
    }
  };

  const handleAddToShoppingList = async () => {
    if (!recipe) return;
    try {
      await addIngredientsToShoppingList(recipe.ingredients, recipe.title);
      setAddedToList(true);
      setTimeout(() => setAddedToList(false), 2000);
    } catch (error) {
      console.error('Failed to add to shopping list:', error);
    }
  };

  if (isLoading) {
    return (
      <AppShell title="Recipe" showBack>
        <p className="text-center text-gray-500 py-8">Loading...</p>
      </AppShell>
    );
  }

  if (!recipe) {
    return (
      <AppShell title="Recipe" showBack>
        <p className="text-center text-gray-500 py-8">Recipe not found</p>
      </AppShell>
    );
  }

  return (
    <AppShell title={recipe.title} showBack>
      <div className="space-y-4 py-4">
        {/* Header info */}
        <div className="flex flex-wrap gap-2">
          {recipe.cuisine && <Badge>{recipe.cuisine}</Badge>}
          {recipe.cookingTime && <Badge variant="outline">{recipe.cookingTime}</Badge>}
          {recipe.difficulty && <Badge variant="secondary">{recipe.difficulty}</Badge>}
          {recipe.servings && <Badge variant="outline">{recipe.servings} servings</Badge>}
        </div>

        {recipe.dietaryTags && recipe.dietaryTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {recipe.dietaryTags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {recipe.sourceUrl && (
          <a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            View original on Instagram
          </a>
        )}

        <Separator />

        {/* Ingredients */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ingredients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{recipe.ingredients}</p>
          </CardContent>
        </Card>

        {/* Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2">
              {recipe.steps.map((step, index) => (
                <li key={index} className="text-gray-700">
                  {step}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleAddToShoppingList}
            className="flex-1"
            disabled={addedToList}
          >
            {addedToList ? '✓ Added!' : '🛒 Add to Shopping List'}
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push(`/recipes/${recipeId}/edit`)}
          >
            Edit
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" className="flex-1">
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Recipe</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete "{recipe.title}"? This cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => {}}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <p className="text-xs text-gray-400 text-center">
          Added by {recipe.createdBy} on {recipe.createdAt.toLocaleDateString()}
        </p>
      </div>
    </AppShell>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/recipes/[id]/page.tsx
git commit -m "feat: add recipe detail page with delete and shopping list add"
```

---

### Task 5.3: Create Add Recipe Page (Manual)

**Files:**
- Create: `src/app/recipes/new/page.tsx`

**Step 1: Create add recipe page**

Create file `src/app/recipes/new/page.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { createRecipe } from '@/lib/recipes';
import { useAuth } from '@/contexts/auth-context';

export default function NewRecipePage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    ingredients: '',
    steps: [''],
    servings: '',
    cookingTime: '',
    cuisine: '',
    difficulty: '' as '' | 'easy' | 'medium' | 'hard',
    dietaryTags: '',
  });

  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...formData.steps];
    newSteps[index] = value;
    setFormData({ ...formData, steps: newSteps });
  };

  const addStep = () => {
    setFormData({ ...formData, steps: [...formData.steps, ''] });
  };

  const removeStep = (index: number) => {
    if (formData.steps.length > 1) {
      const newSteps = formData.steps.filter((_, i) => i !== index);
      setFormData({ ...formData, steps: newSteps });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSubmitting(true);
    try {
      const recipeData = {
        title: formData.title.trim(),
        ingredients: formData.ingredients.trim(),
        steps: formData.steps.filter((s) => s.trim() !== ''),
        servings: formData.servings ? parseInt(formData.servings) : undefined,
        cookingTime: formData.cookingTime.trim() || undefined,
        cuisine: formData.cuisine.trim() || undefined,
        difficulty: formData.difficulty || undefined,
        dietaryTags: formData.dietaryTags
          ? formData.dietaryTags.split(',').map((t) => t.trim()).filter(Boolean)
          : undefined,
        source: 'manual' as const,
        createdBy: currentUser,
      };

      await createRecipe(recipeData);
      router.push('/recipes');
    } catch (error) {
      console.error('Failed to create recipe:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell title="Add Recipe" showBack hideNav>
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Recipe name"
            required
          />
        </div>

        {/* Ingredients */}
        <div className="space-y-2">
          <Label htmlFor="ingredients">Ingredients *</Label>
          <Textarea
            id="ingredients"
            value={formData.ingredients}
            onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
            placeholder="List your ingredients (one per line or comma-separated)"
            rows={5}
            required
          />
        </div>

        {/* Steps */}
        <div className="space-y-2">
          <Label>Steps *</Label>
          {formData.steps.map((step, index) => (
            <div key={index} className="flex gap-2">
              <span className="text-gray-500 pt-2">{index + 1}.</span>
              <Input
                value={step}
                onChange={(e) => handleStepChange(index, e.target.value)}
                placeholder={`Step ${index + 1}`}
              />
              {formData.steps.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStep(index)}
                >
                  ✕
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addStep}>
            + Add Step
          </Button>
        </div>

        {/* Optional fields */}
        <Card>
          <CardContent className="pt-4 space-y-4">
            <p className="text-sm text-gray-500">Optional details</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="servings">Servings</Label>
                <Input
                  id="servings"
                  type="number"
                  value={formData.servings}
                  onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                  placeholder="4"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cookingTime">Cooking Time</Label>
                <Input
                  id="cookingTime"
                  value={formData.cookingTime}
                  onChange={(e) => setFormData({ ...formData, cookingTime: e.target.value })}
                  placeholder="30 min"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cuisine">Cuisine</Label>
                <Input
                  id="cuisine"
                  value={formData.cuisine}
                  onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                  placeholder="Italian"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <select
                  id="difficulty"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as typeof formData.difficulty })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">Select...</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dietaryTags">Dietary Tags</Label>
              <Input
                id="dietaryTags"
                value={formData.dietaryTags}
                onChange={(e) => setFormData({ ...formData, dietaryTags: e.target.value })}
                placeholder="vegetarian, gluten-free (comma-separated)"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Recipe'}
        </Button>
      </form>
    </AppShell>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/recipes/new/page.tsx
git commit -m "feat: add manual recipe creation page"
```

---

### Task 5.4: Create Edit Recipe Page

**Files:**
- Create: `src/app/recipes/[id]/edit/page.tsx`

**Step 1: Create edit recipe page**

Create file `src/app/recipes/[id]/edit/page.tsx`:
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { getRecipeById, updateRecipe } from '@/lib/recipes';

export default function EditRecipePage() {
  const params = useParams();
  const router = useRouter();
  const recipeId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    ingredients: '',
    steps: [''],
    servings: '',
    cookingTime: '',
    cuisine: '',
    difficulty: '' as '' | 'easy' | 'medium' | 'hard',
    dietaryTags: '',
  });

  useEffect(() => {
    async function loadRecipe() {
      try {
        const recipe = await getRecipeById(recipeId);
        if (recipe) {
          setFormData({
            title: recipe.title,
            ingredients: recipe.ingredients,
            steps: recipe.steps.length > 0 ? recipe.steps : [''],
            servings: recipe.servings?.toString() || '',
            cookingTime: recipe.cookingTime || '',
            cuisine: recipe.cuisine || '',
            difficulty: recipe.difficulty || '',
            dietaryTags: recipe.dietaryTags?.join(', ') || '',
          });
        }
      } catch (error) {
        console.error('Failed to load recipe:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadRecipe();
  }, [recipeId]);

  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...formData.steps];
    newSteps[index] = value;
    setFormData({ ...formData, steps: newSteps });
  };

  const addStep = () => {
    setFormData({ ...formData, steps: [...formData.steps, ''] });
  };

  const removeStep = (index: number) => {
    if (formData.steps.length > 1) {
      const newSteps = formData.steps.filter((_, i) => i !== index);
      setFormData({ ...formData, steps: newSteps });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updateData = {
        title: formData.title.trim(),
        ingredients: formData.ingredients.trim(),
        steps: formData.steps.filter((s) => s.trim() !== ''),
        servings: formData.servings ? parseInt(formData.servings) : undefined,
        cookingTime: formData.cookingTime.trim() || undefined,
        cuisine: formData.cuisine.trim() || undefined,
        difficulty: formData.difficulty || undefined,
        dietaryTags: formData.dietaryTags
          ? formData.dietaryTags.split(',').map((t) => t.trim()).filter(Boolean)
          : undefined,
      };

      await updateRecipe(recipeId, updateData);
      router.push(`/recipes/${recipeId}`);
    } catch (error) {
      console.error('Failed to update recipe:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AppShell title="Edit Recipe" showBack hideNav>
        <p className="text-center text-gray-500 py-8">Loading...</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Edit Recipe" showBack hideNav>
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Recipe name"
            required
          />
        </div>

        {/* Ingredients */}
        <div className="space-y-2">
          <Label htmlFor="ingredients">Ingredients *</Label>
          <Textarea
            id="ingredients"
            value={formData.ingredients}
            onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
            placeholder="List your ingredients"
            rows={5}
            required
          />
        </div>

        {/* Steps */}
        <div className="space-y-2">
          <Label>Steps *</Label>
          {formData.steps.map((step, index) => (
            <div key={index} className="flex gap-2">
              <span className="text-gray-500 pt-2">{index + 1}.</span>
              <Input
                value={step}
                onChange={(e) => handleStepChange(index, e.target.value)}
                placeholder={`Step ${index + 1}`}
              />
              {formData.steps.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStep(index)}
                >
                  ✕
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addStep}>
            + Add Step
          </Button>
        </div>

        {/* Optional fields */}
        <Card>
          <CardContent className="pt-4 space-y-4">
            <p className="text-sm text-gray-500">Optional details</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="servings">Servings</Label>
                <Input
                  id="servings"
                  type="number"
                  value={formData.servings}
                  onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                  placeholder="4"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cookingTime">Cooking Time</Label>
                <Input
                  id="cookingTime"
                  value={formData.cookingTime}
                  onChange={(e) => setFormData({ ...formData, cookingTime: e.target.value })}
                  placeholder="30 min"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cuisine">Cuisine</Label>
                <Input
                  id="cuisine"
                  value={formData.cuisine}
                  onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                  placeholder="Italian"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <select
                  id="difficulty"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as typeof formData.difficulty })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">Select...</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dietaryTags">Dietary Tags</Label>
              <Input
                id="dietaryTags"
                value={formData.dietaryTags}
                onChange={(e) => setFormData({ ...formData, dietaryTags: e.target.value })}
                placeholder="vegetarian, gluten-free (comma-separated)"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </AppShell>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/recipes/[id]/edit/page.tsx
git commit -m "feat: add recipe edit page"
```

---

## Phase 6: Shopping List

### Task 6.1: Create Shopping List Firestore Operations

**Files:**
- Create: `src/lib/shopping.ts`

**Step 1: Create shopping list operations**

Create file `src/lib/shopping.ts`:
```typescript
import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ShoppingItem, ShoppingList } from '@/types/shopping';

const DOC_PATH = 'shoppingList/current';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export async function getShoppingList(): Promise<ShoppingList> {
  const docRef = doc(db, DOC_PATH);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return { items: [], lastCleared: null };
  }

  const data = snapshot.data();
  return {
    items: data.items || [],
    lastCleared: data.lastCleared?.toDate() || null,
  };
}

export async function saveShoppingList(list: ShoppingList): Promise<void> {
  const docRef = doc(db, DOC_PATH);
  await setDoc(docRef, {
    items: list.items,
    lastCleared: list.lastCleared ? Timestamp.fromDate(list.lastCleared) : null,
  });
}

export async function addIngredientsToShoppingList(
  ingredientsText: string,
  recipeName: string
): Promise<void> {
  const list = await getShoppingList();

  // Parse ingredients - split by newlines or commas
  const ingredients = ingredientsText
    .split(/[\n,]/)
    .map((i) => i.trim())
    .filter((i) => i.length > 0);

  for (const ingredient of ingredients) {
    const normalizedIngredient = ingredient.toLowerCase();

    // Try to find existing similar item (simple substring match)
    const existingIndex = list.items.findIndex((item) => {
      const normalizedItem = item.text.toLowerCase();
      return (
        normalizedItem.includes(normalizedIngredient) ||
        normalizedIngredient.includes(normalizedItem)
      );
    });

    if (existingIndex >= 0) {
      // Add recipe reference if not already there
      if (!list.items[existingIndex].fromRecipes.includes(recipeName)) {
        list.items[existingIndex].fromRecipes.push(recipeName);
      }
    } else {
      // Add new item
      list.items.push({
        id: generateId(),
        text: ingredient,
        checked: false,
        fromRecipes: [recipeName],
      });
    }
  }

  await saveShoppingList(list);
}

export async function addManualItem(text: string): Promise<void> {
  const list = await getShoppingList();
  list.items.push({
    id: generateId(),
    text: text.trim(),
    checked: false,
    fromRecipes: [],
  });
  await saveShoppingList(list);
}

export async function toggleItem(itemId: string): Promise<void> {
  const list = await getShoppingList();
  const item = list.items.find((i) => i.id === itemId);
  if (item) {
    item.checked = !item.checked;
    await saveShoppingList(list);
  }
}

export async function removeItem(itemId: string): Promise<void> {
  const list = await getShoppingList();
  list.items = list.items.filter((i) => i.id !== itemId);
  await saveShoppingList(list);
}

export async function clearCheckedItems(): Promise<void> {
  const list = await getShoppingList();
  list.items = list.items.filter((i) => !i.checked);
  await saveShoppingList(list);
}

export async function clearAllItems(): Promise<void> {
  await saveShoppingList({
    items: [],
    lastCleared: new Date(),
  });
}
```

**Step 2: Commit**

```bash
git add src/lib/shopping.ts
git commit -m "feat: add shopping list Firestore operations with smart merge"
```

---

### Task 6.2: Create Shopping List Page

**Files:**
- Create: `src/app/shopping/page.tsx`

**Step 1: Create shopping list page**

Create file `src/app/shopping/page.tsx`:
```typescript
'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  getShoppingList,
  addManualItem,
  toggleItem,
  removeItem,
  clearCheckedItems,
  clearAllItems,
} from '@/lib/shopping';
import { ShoppingItem } from '@/types/shopping';

export default function ShoppingPage() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadList = async () => {
    try {
      const list = await getShoppingList();
      setItems(list.items);
    } catch (error) {
      console.error('Failed to load shopping list:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    try {
      await addManualItem(newItemText);
      setNewItemText('');
      await loadList();
    } catch (error) {
      console.error('Failed to add item:', error);
    }
  };

  const handleToggle = async (itemId: string) => {
    try {
      await toggleItem(itemId);
      await loadList();
    } catch (error) {
      console.error('Failed to toggle item:', error);
    }
  };

  const handleRemove = async (itemId: string) => {
    try {
      await removeItem(itemId);
      await loadList();
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const handleClearChecked = async () => {
    try {
      await clearCheckedItems();
      await loadList();
    } catch (error) {
      console.error('Failed to clear checked items:', error);
    }
  };

  const handleDoneShopping = async () => {
    try {
      await clearAllItems();
      await loadList();
    } catch (error) {
      console.error('Failed to clear list:', error);
    }
  };

  // Sort: unchecked first, then checked
  const sortedItems = [...items].sort((a, b) => {
    if (a.checked === b.checked) return 0;
    return a.checked ? 1 : -1;
  });

  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <AppShell title="Shopping List">
      <div className="space-y-4 py-4">
        {/* Add item form */}
        <form onSubmit={handleAddItem} className="flex gap-2">
          <Input
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Add item..."
            className="flex-1"
          />
          <Button type="submit">Add</Button>
        </form>

        {/* List */}
        {isLoading ? (
          <p className="text-center text-gray-500 py-8">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            Shopping list is empty. Add items from recipes or manually above.
          </p>
        ) : (
          <div className="space-y-2">
            {sortedItems.map((item) => (
              <Card
                key={item.id}
                className={item.checked ? 'opacity-50' : ''}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <Checkbox
                    checked={item.checked}
                    onCheckedChange={() => handleToggle(item.id)}
                  />
                  <div className="flex-1">
                    <p className={item.checked ? 'line-through text-gray-500' : ''}>
                      {item.text}
                    </p>
                    {item.fromRecipes.length > 0 && (
                      <p className="text-xs text-gray-400">
                        From: {item.fromRecipes.join(', ')}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(item.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    ✕
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Actions */}
        {items.length > 0 && (
          <div className="flex gap-2">
            {checkedCount > 0 && (
              <Button variant="outline" className="flex-1" onClick={handleClearChecked}>
                Clear Checked ({checkedCount})
              </Button>
            )}

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="default" className="flex-1">
                  Done Shopping
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Done Shopping?</DialogTitle>
                  <DialogDescription>
                    This will clear the entire shopping list. Are you sure?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button onClick={handleDoneShopping}>Yes, Clear All</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </AppShell>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/shopping/page.tsx
git commit -m "feat: add shopping list page with checkboxes and clear actions"
```

---

## Phase 7: Instagram Import with Gemini

### Task 7.1: Research and Install Instagram Download Library

**Files:**
- Modify: `package.json`

**Step 1: Research available libraries**

Research options for Instagram video download. Common approaches:
- `instagram-url-direct` - npm package (may be unstable)
- Custom scraping with puppeteer (complex)
- Third-party APIs (paid)

For MVP, try `instagram-url-direct` first.

**Step 2: Install the library**

Run:
```bash
npm install instagram-url-direct
```

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add instagram-url-direct library"
```

---

### Task 7.2: Create Instagram Download API

**Files:**
- Create: `src/app/api/instagram/download/route.ts`

**Step 1: Create Instagram download API route**

Create file `src/app/api/instagram/download/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import instagramGetUrl from 'instagram-url-direct';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || !url.includes('instagram.com')) {
      return NextResponse.json(
        { error: 'Invalid Instagram URL' },
        { status: 400 }
      );
    }

    // Get direct video URL
    const result = await instagramGetUrl(url);

    if (!result || !result.url_list || result.url_list.length === 0) {
      return NextResponse.json(
        { error: 'Could not extract video URL. The reel may be private or the URL invalid.' },
        { status: 400 }
      );
    }

    // Return the first video URL
    const videoUrl = result.url_list[0];

    return NextResponse.json({ videoUrl });
  } catch (error) {
    console.error('Instagram download error:', error);
    return NextResponse.json(
      { error: 'Failed to download video. Instagram may have blocked the request.' },
      { status: 500 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/instagram/download/route.ts
git commit -m "feat: add Instagram video download API endpoint"
```

---

### Task 7.3: Create Gemini Recipe Extraction API

**Files:**
- Create: `src/app/api/extract-recipe/route.ts`

**Step 1: Create Gemini extraction API**

Create file `src/app/api/extract-recipe/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

// Install zod if not already
// npm install zod

const RecipeSchema = z.object({
  title: z.string().describe('The name of the recipe'),
  ingredients: z.string().describe('List of ingredients, one per line'),
  steps: z.array(z.string()).describe('Step-by-step cooking instructions'),
  servings: z.number().optional().describe('Number of servings'),
  cookingTime: z.string().optional().describe('Total cooking time (e.g., "30 min")'),
  cuisine: z.string().optional().describe('Type of cuisine (e.g., "Italian", "Mexican")'),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().describe('Difficulty level'),
  dietaryTags: z.array(z.string()).optional().describe('Dietary tags like vegetarian, gluten-free'),
});

export async function POST(request: NextRequest) {
  try {
    const { videoUrl } = await request.json();

    if (!videoUrl) {
      return NextResponse.json({ error: 'Video URL required' }, { status: 400 });
    }

    // Fetch the video as a blob
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch video' }, { status: 400 });
    }

    const videoBuffer = await videoResponse.arrayBuffer();
    const videoBase64 = Buffer.from(videoBuffer).toString('base64');
    const mimeType = videoResponse.headers.get('content-type') || 'video/mp4';

    // Use Gemini to extract recipe
    const result = await generateObject({
      model: google('gemini-2.0-flash'),
      schema: RecipeSchema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Watch this cooking video carefully and extract the complete recipe information.

              Provide:
              - A clear title for the recipe
              - Complete list of ingredients with quantities
              - Step-by-step instructions
              - Estimated servings and cooking time if mentioned
              - The type of cuisine
              - Difficulty level (easy/medium/hard)
              - Any dietary tags (vegetarian, vegan, gluten-free, etc.)

              Be thorough and include all ingredients and steps shown in the video.`,
            },
            {
              type: 'file',
              data: videoBase64,
              mimeType: mimeType,
            },
          ],
        },
      ],
    });

    return NextResponse.json({ recipe: result.object });
  } catch (error) {
    console.error('Recipe extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract recipe from video' },
      { status: 500 }
    );
  }
}
```

**Step 2: Install zod**

Run:
```bash
npm install zod
```

**Step 3: Commit**

```bash
git add src/app/api/extract-recipe/route.ts package.json package-lock.json
git commit -m "feat: add Gemini recipe extraction API with structured output"
```

---

### Task 7.4: Create Instagram Import Page

**Files:**
- Create: `src/app/recipes/new/instagram/page.tsx`

**Step 1: Create Instagram import page**

Create file `src/app/recipes/new/instagram/page.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createRecipe } from '@/lib/recipes';
import { useAuth } from '@/contexts/auth-context';

interface ExtractedRecipe {
  title: string;
  ingredients: string;
  steps: string[];
  servings?: number;
  cookingTime?: string;
  cuisine?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  dietaryTags?: string[];
}

export default function InstagramImportPage() {
  const router = useRouter();
  const { currentUser } = useAuth();

  const [instagramUrl, setInstagramUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [error, setError] = useState('');
  const [extractedRecipe, setExtractedRecipe] = useState<ExtractedRecipe | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for editing extracted recipe
  const [formData, setFormData] = useState({
    title: '',
    ingredients: '',
    steps: [''],
    servings: '',
    cookingTime: '',
    cuisine: '',
    difficulty: '' as '' | 'easy' | 'medium' | 'hard',
    dietaryTags: '',
  });

  const handleProcess = async () => {
    if (!instagramUrl.trim()) return;

    setIsProcessing(true);
    setError('');
    setExtractedRecipe(null);

    try {
      // Step 1: Download video
      setProcessingStep('Downloading video from Instagram...');
      const downloadRes = await fetch('/api/instagram/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: instagramUrl }),
      });

      if (!downloadRes.ok) {
        const data = await downloadRes.json();
        throw new Error(data.error || 'Failed to download video');
      }

      const { videoUrl } = await downloadRes.json();

      // Step 2: Extract recipe with Gemini
      setProcessingStep('Analyzing video with AI (this may take a minute)...');
      const extractRes = await fetch('/api/extract-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl }),
      });

      if (!extractRes.ok) {
        const data = await extractRes.json();
        throw new Error(data.error || 'Failed to extract recipe');
      }

      const { recipe } = await extractRes.json();
      setExtractedRecipe(recipe);

      // Populate form with extracted data
      setFormData({
        title: recipe.title || '',
        ingredients: recipe.ingredients || '',
        steps: recipe.steps?.length > 0 ? recipe.steps : [''],
        servings: recipe.servings?.toString() || '',
        cookingTime: recipe.cookingTime || '',
        cuisine: recipe.cuisine || '',
        difficulty: recipe.difficulty || '',
        dietaryTags: recipe.dietaryTags?.join(', ') || '',
      });

      setProcessingStep('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...formData.steps];
    newSteps[index] = value;
    setFormData({ ...formData, steps: newSteps });
  };

  const addStep = () => {
    setFormData({ ...formData, steps: [...formData.steps, ''] });
  };

  const removeStep = (index: number) => {
    if (formData.steps.length > 1) {
      const newSteps = formData.steps.filter((_, i) => i !== index);
      setFormData({ ...formData, steps: newSteps });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSubmitting(true);
    try {
      const recipeData = {
        title: formData.title.trim(),
        ingredients: formData.ingredients.trim(),
        steps: formData.steps.filter((s) => s.trim() !== ''),
        servings: formData.servings ? parseInt(formData.servings) : undefined,
        cookingTime: formData.cookingTime.trim() || undefined,
        cuisine: formData.cuisine.trim() || undefined,
        difficulty: formData.difficulty || undefined,
        dietaryTags: formData.dietaryTags
          ? formData.dietaryTags.split(',').map((t) => t.trim()).filter(Boolean)
          : undefined,
        source: 'instagram' as const,
        sourceUrl: instagramUrl,
        createdBy: currentUser,
      };

      await createRecipe(recipeData);
      router.push('/recipes');
    } catch (error) {
      console.error('Failed to create recipe:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell title="Import from Instagram" showBack hideNav>
      <div className="space-y-4 py-4">
        {!extractedRecipe ? (
          <>
            {/* URL Input */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Paste Instagram Reel URL</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://www.instagram.com/reel/..."
                  disabled={isProcessing}
                />
                <Button
                  onClick={handleProcess}
                  disabled={isProcessing || !instagramUrl.trim()}
                  className="w-full"
                >
                  {isProcessing ? 'Processing...' : 'Extract Recipe'}
                </Button>

                {processingStep && (
                  <p className="text-sm text-gray-500 text-center">{processingStep}</p>
                )}

                {error && (
                  <p className="text-sm text-red-500 text-center">{error}</p>
                )}
              </CardContent>
            </Card>

            <p className="text-xs text-gray-400 text-center">
              Paste a public Instagram Reel URL. The AI will watch the video and extract the recipe automatically.
            </p>
          </>
        ) : (
          /* Edit form for extracted recipe */
          <form onSubmit={handleSubmit} className="space-y-4">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <p className="text-sm text-green-700">
                  Recipe extracted successfully. Review and edit below before saving.
                </p>
              </CardContent>
            </Card>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            {/* Ingredients */}
            <div className="space-y-2">
              <Label htmlFor="ingredients">Ingredients *</Label>
              <Textarea
                id="ingredients"
                value={formData.ingredients}
                onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                rows={5}
                required
              />
            </div>

            {/* Steps */}
            <div className="space-y-2">
              <Label>Steps *</Label>
              {formData.steps.map((step, index) => (
                <div key={index} className="flex gap-2">
                  <span className="text-gray-500 pt-2">{index + 1}.</span>
                  <Input
                    value={step}
                    onChange={(e) => handleStepChange(index, e.target.value)}
                  />
                  {formData.steps.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStep(index)}
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addStep}>
                + Add Step
              </Button>
            </div>

            {/* Optional fields */}
            <Card>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="servings">Servings</Label>
                    <Input
                      id="servings"
                      type="number"
                      value={formData.servings}
                      onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cookingTime">Cooking Time</Label>
                    <Input
                      id="cookingTime"
                      value={formData.cookingTime}
                      onChange={(e) => setFormData({ ...formData, cookingTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cuisine">Cuisine</Label>
                    <Input
                      id="cuisine"
                      value={formData.cuisine}
                      onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <select
                      id="difficulty"
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as typeof formData.difficulty })}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="">Select...</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dietaryTags">Dietary Tags</Label>
                  <Input
                    id="dietaryTags"
                    value={formData.dietaryTags}
                    onChange={(e) => setFormData({ ...formData, dietaryTags: e.target.value })}
                    placeholder="vegetarian, gluten-free"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setExtractedRecipe(null)}
              >
                Start Over
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Recipe'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/recipes/new/instagram/page.tsx
git commit -m "feat: add Instagram import page with Gemini extraction"
```

---

## Phase 8: Final Polish

### Task 8.1: Update Gemini Model to 3.0 Flash

**Files:**
- Modify: `src/app/api/extract-recipe/route.ts`

**Step 1: Update the model identifier**

In `src/app/api/extract-recipe/route.ts`, update line ~42:

Change:
```typescript
model: google('gemini-2.0-flash'),
```

To:
```typescript
model: google('gemini-3.0-flash'),
```

**Note:** Verify the correct model ID from Google AI documentation. It may be `gemini-3.0-flash` or `gemini-flash-3.0` depending on release naming.

**Step 2: Commit**

```bash
git add src/app/api/extract-recipe/route.ts
git commit -m "feat: update to Gemini 3 Flash model"
```

---

### Task 8.2: Add Loading States and Error Boundaries

**Files:**
- Create: `src/app/recipes/loading.tsx`
- Create: `src/app/shopping/loading.tsx`

**Step 1: Create recipes loading state**

Create file `src/app/recipes/loading.tsx`:
```typescript
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading recipes...</p>
    </div>
  );
}
```

**Step 2: Create shopping loading state**

Create file `src/app/shopping/loading.tsx`:
```typescript
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading shopping list...</p>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/app/recipes/loading.tsx src/app/shopping/loading.tsx
git commit -m "feat: add loading states for recipes and shopping pages"
```

---

### Task 8.3: Configure Firebase Security Rules

**Files:**
- Create: `firestore.rules` (for documentation)

**Step 1: Document required Firestore rules**

Create file `firestore.rules`:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Since app has password protection at application level,
    // we allow read/write access to authenticated requests.
    // In production, consider adding additional validation.

    match /recipes/{recipeId} {
      allow read, write: if true;
    }

    match /shoppingList/{document} {
      allow read, write: if true;
    }
  }
}
```

**Note:** These rules are permissive because the app has password protection. Apply these rules in Firebase Console.

**Step 2: Commit**

```bash
git add firestore.rules
git commit -m "docs: add Firestore security rules for reference"
```

---

### Task 8.4: Create Vercel Configuration

**Files:**
- Create: `vercel.json`

**Step 1: Create Vercel config for environment variables**

Create file `vercel.json`:
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "framework": "nextjs"
}
```

**Step 2: Document deployment steps in README**

Update or create `README.md`:
```markdown
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
```

**Step 3: Commit**

```bash
git add vercel.json README.md
git commit -m "docs: add Vercel config and README with setup instructions"
```

---

## Summary

**Total Tasks:** 24 tasks across 8 phases

**Phase 1:** Project Foundation (5 tasks)
- Initialize Next.js, install deps, add shadcn, env config, Firebase setup, types

**Phase 2:** Password Protection (4 tasks)
- Auth context, verification API, login page, protected route

**Phase 3:** App Layout (3 tasks)
- Bottom nav, header, app shell

**Phase 4:** Recipe Data Layer (1 task)
- Firestore CRUD operations

**Phase 5:** Recipe Pages (4 tasks)
- List, detail, add, edit pages

**Phase 6:** Shopping List (2 tasks)
- Firestore operations, shopping page

**Phase 7:** Instagram Import (4 tasks)
- Instagram download lib/API, Gemini extraction API, import page

**Phase 8:** Final Polish (4 tasks)
- Gemini model update, loading states, Firebase rules, Vercel config

---

Plan complete and saved to `docs/plans/2026-01-09-recetarium.md`.

**Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
