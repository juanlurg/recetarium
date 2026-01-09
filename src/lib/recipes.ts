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
