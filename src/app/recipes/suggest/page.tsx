'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FoodPlaceholder, detectFoodCategory } from '@/components/ui/food-placeholder';
import { getDespensa } from '@/lib/despensa';
import { getAllRecipes, createRecipe } from '@/lib/recipes';
import { useAuth } from '@/contexts/auth-context';
import { Recipe } from '@/types/recipe';
import { DespensaItem } from '@/types/despensa';
import { Sparkles, RefreshCw, Save, Clock, Users, ChefHat, Loader2 } from 'lucide-react';

interface SuggestedRecipe {
  title: string;
  ingredients: string;
  steps: string[];
  servings?: number;
  cookingTime?: string;
  cuisine?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  dietaryTags?: string[];
}

const difficultyLabels = {
  easy: 'Facil',
  medium: 'Media',
  hard: 'Dificil',
};

export default function SuggestRecipePage() {
  const router = useRouter();
  const { currentUser } = useAuth();

  const [despensaItems, setDespensaItems] = useState<DespensaItem[]>([]);
  const [existingRecipes, setExistingRecipes] = useState<Recipe[]>([]);
  const [preferences, setPreferences] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [suggestedRecipe, setSuggestedRecipe] = useState<SuggestedRecipe | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load despensa and existing recipes on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [despensaData, recipesData] = await Promise.all([
          getDespensa(),
          getAllRecipes(),
        ]);
        setDespensaItems(despensaData.items);
        setExistingRecipes(recipesData);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Error al cargar los datos');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleGenerateSuggestion = async () => {
    setIsGenerating(true);
    setError(null);
    setSuggestedRecipe(null);

    try {
      const response = await fetch('/api/suggest-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          despensaItems: despensaItems.map((item) => item.name),
          preferences: preferences.trim() || undefined,
          existingRecipes: existingRecipes.map((r) => ({
            title: r.title,
            cuisine: r.cuisine,
            difficulty: r.difficulty,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al generar sugerencia');
      }

      const data = await response.json();
      setSuggestedRecipe(data.recipe);
    } catch (err) {
      console.error('Failed to generate suggestion:', err);
      setError(err instanceof Error ? err.message : 'Error al generar sugerencia');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveRecipe = async () => {
    if (!suggestedRecipe || !currentUser) return;

    setIsSaving(true);
    try {
      const recipeData = {
        title: suggestedRecipe.title,
        ingredients: suggestedRecipe.ingredients,
        steps: suggestedRecipe.steps,
        servings: suggestedRecipe.servings,
        cookingTime: suggestedRecipe.cookingTime,
        cuisine: suggestedRecipe.cuisine,
        difficulty: suggestedRecipe.difficulty,
        dietaryTags: suggestedRecipe.dietaryTags,
        source: 'manual' as const,
        createdBy: currentUser,
      };

      await createRecipe(recipeData);
      router.push('/recipes');
    } catch (err) {
      console.error('Failed to save recipe:', err);
      setError('Error al guardar la receta');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateAnother = () => {
    setSuggestedRecipe(null);
    handleGenerateSuggestion();
  };

  // Parse ingredients into a list
  const ingredientsList = suggestedRecipe?.ingredients
    .split(/[\n,]/)
    .map((i) => i.trim())
    .filter((i) => i.length > 0) || [];

  const category = suggestedRecipe
    ? detectFoodCategory(suggestedRecipe.title, suggestedRecipe.cuisine)
    : 'default';

  return (
    <AppShell title="Sugerir Receta" showBack>
      <div className="py-6 space-y-6">
        {/* Loading state for initial data */}
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-20 bg-muted animate-pulse rounded-xl" />
            <div className="h-12 bg-muted animate-pulse rounded" />
          </div>
        ) : (
          <>
            {/* Despensa summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Ingredientes disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                {despensaItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No tienes ingredientes en la despensa. Añade algunos para obtener mejores sugerencias.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {despensaItems.slice(0, 15).map((item) => (
                      <Badge key={item.id} variant="secondary" className="text-xs">
                        {item.name}
                      </Badge>
                    ))}
                    {despensaItems.length > 15 && (
                      <Badge variant="outline" className="text-xs">
                        +{despensaItems.length - 15} mas
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preferences input */}
            <div className="space-y-2">
              <Label htmlFor="preferences">Preferencias (opcional)</Label>
              <Input
                id="preferences"
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                placeholder="Ej: algo rapido, vegetariano, italiana..."
                disabled={isGenerating}
              />
            </div>

            {/* Generate button */}
            {!suggestedRecipe && (
              <Button
                className="w-full gap-2"
                onClick={handleGenerateSuggestion}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generando sugerencia...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generar sugerencia
                  </>
                )}
              </Button>
            )}

            {/* Error display */}
            {error && (
              <Card className="border-destructive">
                <CardContent className="pt-4">
                  <p className="text-sm text-destructive">{error}</p>
                </CardContent>
              </Card>
            )}

            {/* Suggested recipe preview */}
            {suggestedRecipe && (
              <div className="space-y-6">
                {/* Recipe header */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex gap-4 items-start">
                      <FoodPlaceholder category={category} size="lg" />
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-foreground">
                          {suggestedRecipe.title}
                        </h2>

                        {/* Metadata */}
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                          {suggestedRecipe.cookingTime && (
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4" />
                              {suggestedRecipe.cookingTime}
                            </span>
                          )}
                          {suggestedRecipe.servings && (
                            <span className="flex items-center gap-1.5">
                              <Users className="h-4 w-4" />
                              {suggestedRecipe.servings} porciones
                            </span>
                          )}
                          {suggestedRecipe.difficulty && (
                            <span className="flex items-center gap-1.5">
                              <ChefHat className="h-4 w-4" />
                              {difficultyLabels[suggestedRecipe.difficulty]}
                            </span>
                          )}
                        </div>

                        {/* Tags */}
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {suggestedRecipe.cuisine && (
                            <Badge variant="secondary">{suggestedRecipe.cuisine}</Badge>
                          )}
                          {suggestedRecipe.dietaryTags?.map((tag) => (
                            <Badge key={tag} variant="outline">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Ingredients */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Ingredientes</CardTitle>
                  </CardHeader>
                  <CardContent>
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
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Preparacion</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-4">
                      {suggestedRecipe.steps.map((step, index) => (
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

                {/* Action buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={handleGenerateAnother}
                    disabled={isGenerating || isSaving}
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Generar otra
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    onClick={handleSaveRecipe}
                    disabled={isSaving || isGenerating}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Guardar receta
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
