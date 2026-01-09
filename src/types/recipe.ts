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
