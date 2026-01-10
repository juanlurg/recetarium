'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
import { FoodPlaceholder, detectFoodCategory } from '@/components/ui/food-placeholder';
import { getRecipeById, deleteRecipe } from '@/lib/recipes';
import { addIngredientsToShoppingList } from '@/lib/shopping';
import { Recipe } from '@/types/recipe';
import {
  Clock,
  Users,
  ChefHat,
  Pencil,
  Trash2,
  ShoppingCart,
  ExternalLink,
  Check
} from 'lucide-react';

const difficultyLabels = {
  easy: 'Facil',
  medium: 'Media',
  hard: 'Dificil',
};

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [addedToList, setAddedToList] = useState(false);

  useEffect(() => {
    async function loadRecipe() {
      try {
        const data = await getRecipeById(params.id as string);
        setRecipe(data);
      } catch (error) {
        console.error('Failed to load recipe:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadRecipe();
  }, [params.id]);

  const handleDelete = async () => {
    if (!recipe) return;
    setIsDeleting(true);
    try {
      await deleteRecipe(recipe.id);
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
      <AppShell title="Cargando..." showBack>
        <div className="py-8 space-y-4">
          <div className="h-32 bg-muted animate-pulse rounded-xl" />
          <div className="h-8 bg-muted animate-pulse rounded w-2/3" />
          <div className="h-64 bg-muted animate-pulse rounded-xl" />
        </div>
      </AppShell>
    );
  }

  if (!recipe) {
    return (
      <AppShell title="Error" showBack>
        <div className="py-12 text-center">
          <p className="text-muted-foreground">Receta no encontrada</p>
        </div>
      </AppShell>
    );
  }

  const category = detectFoodCategory(recipe.title, recipe.cuisine);
  const ingredientsList = recipe.ingredients
    .split(/[\n,]/)
    .map((i) => i.trim())
    .filter((i) => i.length > 0);

  return (
    <AppShell title={recipe.title} showBack>
      <div className="py-6 space-y-6">
        {/* Header with placeholder */}
        <div className="flex gap-4 items-start">
          <FoodPlaceholder category={category} size="lg" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{recipe.title}</h1>

            {/* Metadata */}
            <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
              {recipe.cookingTime && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {recipe.cookingTime}
                </span>
              )}
              {recipe.servings && (
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {recipe.servings} porciones
                </span>
              )}
              {recipe.difficulty && (
                <span className="flex items-center gap-1.5">
                  <ChefHat className="h-4 w-4" />
                  {difficultyLabels[recipe.difficulty]}
                </span>
              )}
            </div>

            {/* Tags */}
            <div className="flex gap-2 mt-3 flex-wrap">
              {recipe.cuisine && (
                <Badge variant="secondary">{recipe.cuisine}</Badge>
              )}
              {recipe.dietaryTags?.map((tag) => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={handleAddToShoppingList}
            disabled={addedToList}
          >
            {addedToList ? (
              <>
                <Check className="h-4 w-4" />
                Añadido
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                Añadir a la lista
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push(`/recipes/${recipe.id}/edit`)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Eliminar receta</DialogTitle>
                <DialogDescription>
                  ¿Seguro que quieres eliminar &quot;{recipe.title}&quot;? Esta accion no se puede deshacer.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" disabled={isDeleting}>
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Eliminando...' : 'Eliminar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Separator />

        {/* Ingredients */}
        <Card>
          <CardContent className="p-5">
            <h2 className="font-semibold text-lg mb-4">Ingredientes</h2>
            <ul className="space-y-2">
              {ingredientsList.map((ingredient, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                  <span>{ingredient}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Steps */}
        <Card>
          <CardContent className="p-5">
            <h2 className="font-semibold text-lg mb-4">Preparacion</h2>
            <ol className="space-y-4">
              {recipe.steps.map((step, index) => (
                <li key={index} className="flex gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {index + 1}
                  </span>
                  <p className="pt-0.5">{step}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* Source */}
        {recipe.sourceUrl && (
          <a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Ver fuente original
          </a>
        )}

        {/* Footer info */}
        <p className="text-xs text-muted-foreground text-center pt-4">
          Creada por {recipe.createdBy} el{' '}
          {recipe.createdAt.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>
    </AppShell>
  );
}
