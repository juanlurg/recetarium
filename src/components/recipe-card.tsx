import Link from 'next/link';
import { detectFoodCategory } from '@/components/ui/food-placeholder';
import { Recipe } from '@/types/recipe';

interface RecipeCardProps {
  recipe: Recipe;
}

const categoryEmoji: Record<string, string> = {
  pasta: '🍝',
  meat: '🥩',
  salad: '🥗',
  dessert: '🍰',
  soup: '🍲',
  fish: '🐟',
  rice: '🍚',
  bread: '🥖',
  vegetable: '🥕',
  default: '🍽️',
};

export function RecipeCard({ recipe }: RecipeCardProps) {
  const category = detectFoodCategory(recipe.title, recipe.cuisine);
  const emoji = categoryEmoji[category] || categoryEmoji.default;

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="flex items-center gap-3 py-2.5 px-1 border-b border-border/50 active:bg-muted/50 transition-colors"
    >
      <span className="text-xl shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <span className="font-medium text-sm line-clamp-1">{recipe.title}</span>
      </div>
      <span className="text-xs text-muted-foreground shrink-0">
        {recipe.cookingTime || recipe.cuisine || ''}
      </span>
      <svg className="h-4 w-4 text-muted-foreground/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
