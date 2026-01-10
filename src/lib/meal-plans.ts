import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MealPlan, PlannedMeal, WeekDay } from '@/types/meal-plan';
import { getRecipeById } from '@/lib/recipes';
import { addIngredientsToShoppingList } from '@/lib/shopping';

const COLLECTION_NAME = 'mealPlans';

// Helper functions

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

export function getWeekDays(startDate: Date, numWeeks: number): WeekDay[] {
  const days: WeekDay[] = [];
  const today = formatDate(new Date());
  const totalDays = numWeeks * 7;

  for (let i = 0; i < totalDays; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);

    const dateString = formatDate(currentDate);

    days.push({
      date: dateString,
      dayName: DAY_NAMES[currentDate.getDay()],
      dayNumber: currentDate.getDate(),
      isToday: dateString === today,
    });
  }

  return days;
}

// Convert Firestore document to MealPlan
function docToMealPlan(id: string, data: Record<string, unknown>): MealPlan {
  return {
    id,
    name: data.name as string,
    startDate: data.startDate as string,
    endDate: data.endDate as string,
    meals: (data.meals as PlannedMeal[]) || [],
    createdAt: (data.createdAt as Timestamp).toDate(),
  };
}

// CRUD operations

export async function getCurrentMealPlan(): Promise<MealPlan | null> {
  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy('createdAt', 'desc'),
    limit(1)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return docToMealPlan(doc.id, doc.data());
}

export async function getMealPlanById(planId: string): Promise<MealPlan | null> {
  const docRef = doc(db, COLLECTION_NAME, planId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  return docToMealPlan(snapshot.id, snapshot.data());
}

export async function saveMealPlan(plan: MealPlan): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, plan.id);
  await setDoc(docRef, {
    name: plan.name,
    startDate: plan.startDate,
    endDate: plan.endDate,
    meals: plan.meals,
    createdAt: Timestamp.fromDate(plan.createdAt),
  });
}

export async function addMealToDay(
  planId: string,
  date: string,
  mealType: 'lunch' | 'dinner',
  recipeId: string,
  recipeTitle: string
): Promise<void> {
  const plan = await getMealPlanById(planId);
  if (!plan) {
    throw new Error('Meal plan not found');
  }

  // Remove any existing meal for this date and meal type
  plan.meals = plan.meals.filter(
    (meal) => !(meal.date === date && meal.mealType === mealType)
  );

  // Add the new meal
  const newMeal: PlannedMeal = {
    id: generateId(),
    recipeId,
    recipeTitle,
    date,
    mealType,
  };

  plan.meals.push(newMeal);
  await saveMealPlan(plan);
}

export async function removeMealFromDay(planId: string, mealId: string): Promise<void> {
  const plan = await getMealPlanById(planId);
  if (!plan) {
    throw new Error('Meal plan not found');
  }

  plan.meals = plan.meals.filter((meal) => meal.id !== mealId);
  await saveMealPlan(plan);
}

export async function generateShoppingListFromPlan(plan: MealPlan): Promise<void> {
  // Get unique recipe IDs from the plan
  const uniqueRecipeIds = [...new Set(plan.meals.map((meal) => meal.recipeId))];

  // For each unique recipe, fetch it and add its ingredients to the shopping list
  for (const recipeId of uniqueRecipeIds) {
    const recipe = await getRecipeById(recipeId);
    if (recipe) {
      await addIngredientsToShoppingList(recipe.ingredients, recipe.title);
    }
  }
}

// Additional helper to create a new meal plan
export function createEmptyMealPlan(name: string, startDate: Date, numWeeks: number): MealPlan {
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + numWeeks * 7 - 1);

  return {
    id: generateId(),
    name,
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    meals: [],
    createdAt: new Date(),
  };
}

// Helper to get meals organized by day
export function organizeMealsByDay(plan: MealPlan, weekDays: WeekDay[]): WeekDay[] {
  return weekDays.map((day) => {
    const lunch = plan.meals.find(
      (meal) => meal.date === day.date && meal.mealType === 'lunch'
    );
    const dinner = plan.meals.find(
      (meal) => meal.date === day.date && meal.mealType === 'dinner'
    );

    return {
      ...day,
      lunch,
      dinner,
    };
  });
}
