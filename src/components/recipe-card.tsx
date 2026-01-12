import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { FoodPlaceholder, detectFoodCategory } from '@/components/ui/food-placeholder';
import { Recipe } from '@/types/recipe';
import { Clock } from 'lucide-react';

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const category = detectFoodCategory(recipe.title, recipe.cuisine);

  return (
    <Link href={`/recipes/${recipe.id}`}>
      <Card className="group overflow-hidden hover:shadow-sm transition-all duration-200 active:scale-[0.99]">
        <CardContent className="p-0">
          <div className="flex items-center gap-3 p-3">
            {/* Food placeholder - small */}
            <FoodPlaceholder category={category} size="sm" className="shrink-0" />

            {/* Content - single line */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {recipe.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                {recipe.cuisine && <span>{recipe.cuisine}</span>}
                {recipe.cuisine && recipe.cookingTime && <span>·</span>}
                {recipe.cookingTime && (
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-3 w-3" />
                    {recipe.cookingTime}
                  </span>
                )}
              </div>
            </div>

            {/* Chevron indicator */}
            <svg className="h-4 w-4 text-muted-foreground/50 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
