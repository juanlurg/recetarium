import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FoodPlaceholder, detectFoodCategory } from '@/components/ui/food-placeholder';
import { Recipe } from '@/types/recipe';
import { Clock, Users, ChefHat } from 'lucide-react';

interface RecipeCardProps {
  recipe: Recipe;
}

const difficultyColors = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800',
};

const difficultyLabels = {
  easy: 'Facil',
  medium: 'Media',
  hard: 'Dificil',
};

export function RecipeCard({ recipe }: RecipeCardProps) {
  const category = detectFoodCategory(recipe.title, recipe.cuisine);

  return (
    <Link href={`/recipes/${recipe.id}`}>
      <Card className="group overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
        <CardContent className="p-0">
          <div className="flex gap-4 p-4">
            {/* Food placeholder */}
            <FoodPlaceholder category={category} size="md" className="shrink-0" />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {recipe.title}
              </h3>

              {/* Metadata row */}
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                {recipe.cookingTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {recipe.cookingTime}
                  </span>
                )}
                {recipe.servings && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {recipe.servings}
                  </span>
                )}
                {recipe.difficulty && (
                  <span className="flex items-center gap-1">
                    <ChefHat className="h-3.5 w-3.5" />
                    {difficultyLabels[recipe.difficulty]}
                  </span>
                )}
              </div>

              {/* Tags row */}
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {recipe.cuisine && (
                  <Badge variant="secondary" className="text-xs">
                    {recipe.cuisine}
                  </Badge>
                )}
                {recipe.source === 'instagram' && (
                  <Badge variant="outline" className="text-xs">
                    Instagram
                  </Badge>
                )}
              </div>
            </div>

            {/* Author */}
            <div className="text-xs text-muted-foreground self-start shrink-0">
              {recipe.createdBy}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
