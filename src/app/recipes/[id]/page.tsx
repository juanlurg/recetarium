'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

const difficultyLabels: Record<string, string> = {
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
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

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
      const result = await addIngredientsToShoppingList(recipe.ingredients, recipe.title);
      setAddedToList(true);

      if (result.skipped > 0 && result.added > 0) {
        setFeedbackMessage(`+${result.added}, ${result.skipped} en despensa`);
      } else if (result.skipped > 0 && result.added === 0) {
        setFeedbackMessage(`Todo en despensa`);
      } else if (result.added > 0) {
        setFeedbackMessage(`+${result.added} ingredientes`);
      } else {
        setFeedbackMessage('Añadido');
      }

      setTimeout(() => {
        setAddedToList(false);
        setFeedbackMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Failed to add to shopping list:', error);
    }
  };

  if (isLoading) {
    return (
      <AppShell title="Cargando..." showBack>
        <div className="py-4 space-y-3">
          <div className="h-10 bg-muted animate-pulse rounded w-1/2" />
          <div className="h-6 bg-muted animate-pulse rounded w-3/4" />
          <div className="h-40 bg-muted animate-pulse rounded-lg mt-4" />
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

  const ingredientsList = recipe.ingredients
    .split(/[\n,]/)
    .map((i) => i.trim())
    .filter((i) => i.length > 0);

  return (
    <AppShell title={recipe.title} showBack>
      <div className="py-4 space-y-4">
        {/* Metadata row */}
        <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
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
          {recipe.cuisine && (
            <Badge variant="secondary" className="text-xs">{recipe.cuisine}</Badge>
          )}
          {recipe.dietaryTags?.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={handleAddToShoppingList}
            disabled={addedToList}
          >
            {addedToList ? (
              <>
                <Check className="h-3.5 w-3.5" />
                {feedbackMessage}
              </>
            ) : (
              <>
                <ShoppingCart className="h-3.5 w-3.5" />
                A la lista
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/recipes/${recipe.id}/edit`)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Eliminar receta</DialogTitle>
                <DialogDescription>
                  ¿Seguro que quieres eliminar &quot;{recipe.title}&quot;?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" size="sm" disabled={isDeleting}>
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Eliminando...' : 'Eliminar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Ingredients */}
        <div className="pt-2">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
            Ingredientes
          </h2>
          <ul className="space-y-1">
            {ingredientsList.map((ingredient, index) => (
              <li key={index} className="flex items-baseline gap-2 text-sm">
                <span className="text-primary">•</span>
                <span>{ingredient}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Steps */}
        <div className="pt-2">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
            Preparacion
          </h2>
          <ol className="space-y-3">
            {recipe.steps.map((step, index) => (
              <li key={index} className="flex gap-3 text-sm">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {index + 1}
                </span>
                <p className="flex-1">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Source link */}
        {recipe.sourceUrl && (
          <a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors pt-2"
          >
            <ExternalLink className="h-3 w-3" />
            Ver fuente original
          </a>
        )}

        {/* Footer */}
        <p className="text-xs text-muted-foreground pt-4 border-t border-border/50">
          Por {recipe.createdBy} · {recipe.createdAt.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      </div>
    </AppShell>
  );
}
