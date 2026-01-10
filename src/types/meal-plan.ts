export interface PlannedMeal {
  id: string;
  recipeId: string;
  recipeTitle: string;
  date: string; // YYYY-MM-DD format
  mealType: 'lunch' | 'dinner';
}

export interface MealPlan {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  meals: PlannedMeal[];
  createdAt: Date;
}

export interface WeekDay {
  date: string;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  lunch?: PlannedMeal;
  dinner?: PlannedMeal;
}
