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
            {addedToList ? 'Added!' : 'Add to Shopping List'}
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
