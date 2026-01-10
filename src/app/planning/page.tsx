'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { MealCalendar } from '@/components/meal-calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FoodPlaceholder, detectFoodCategory } from '@/components/ui/food-placeholder';
import {
  getCurrentMealPlan,
  saveMealPlan,
  createEmptyMealPlan,
  getWeekDays,
  organizeMealsByDay,
  addMealToDay,
  removeMealFromDay,
  generateShoppingListFromPlan,
} from '@/lib/meal-plans';
import { getAllRecipes } from '@/lib/recipes';
import { getDespensa } from '@/lib/despensa';
import { MealPlan, WeekDay } from '@/types/meal-plan';
import { Recipe } from '@/types/recipe';
import { ShoppingCart, Search, Check, Loader2, Sparkles, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Type for a single suggested day from the API
interface SuggestedDayPlan {
  date: string;
  lunch: { recipeId: string; recipeTitle: string };
  dinner: { recipeId: string; recipeTitle: string };
}

type WeekCount = 1 | 2 | 3;

export default function PlanningPage() {
  const router = useRouter();
  const [selectedWeeks, setSelectedWeeks] = useState<WeekCount>(1);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [weekDays, setWeekDays] = useState<WeekDay[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSuccess, setGeneratedSuccess] = useState(false);

  // Dialog state
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<'lunch' | 'dinner' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // AI suggestion state
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestedPlan, setSuggestedPlan] = useState<SuggestedDayPlan[] | null>(null);
  const [isSuggestionDialogOpen, setIsSuggestionDialogOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  // Load meal plan and recipes on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [existingPlan, allRecipes] = await Promise.all([
          getCurrentMealPlan(),
          getAllRecipes(),
        ]);

        setRecipes(allRecipes);

        if (existingPlan) {
          setMealPlan(existingPlan);
        } else {
          // Create new meal plan starting from today
          const today = new Date();
          const newPlan = createEmptyMealPlan('Plan semanal', today, 1);
          await saveMealPlan(newPlan);
          setMealPlan(newPlan);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Update weekDays when mealPlan or selectedWeeks changes
  useEffect(() => {
    if (mealPlan) {
      const startDate = new Date(mealPlan.startDate);
      const days = getWeekDays(startDate, selectedWeeks);
      const organizedDays = organizeMealsByDay(mealPlan, days);
      setWeekDays(organizedDays);
    }
  }, [mealPlan, selectedWeeks]);

  const handleAddMeal = (date: string, mealType: 'lunch' | 'dinner') => {
    setSelectedDate(date);
    setSelectedMealType(mealType);
    setSearchTerm('');
    setIsPickerOpen(true);
  };

  const handleRemoveMeal = async (mealId: string) => {
    if (!mealPlan) return;

    try {
      await removeMealFromDay(mealPlan.id, mealId);
      // Refresh meal plan
      const updatedPlan = await getCurrentMealPlan();
      if (updatedPlan) {
        setMealPlan(updatedPlan);
      }
    } catch (error) {
      console.error('Failed to remove meal:', error);
    }
  };

  const handleSelectRecipe = async (recipe: Recipe) => {
    if (!mealPlan || !selectedDate || !selectedMealType) return;

    try {
      await addMealToDay(
        mealPlan.id,
        selectedDate,
        selectedMealType,
        recipe.id,
        recipe.title
      );
      // Refresh meal plan
      const updatedPlan = await getCurrentMealPlan();
      if (updatedPlan) {
        setMealPlan(updatedPlan);
      }
      setIsPickerOpen(false);
    } catch (error) {
      console.error('Failed to add meal:', error);
    }
  };

  const handleGenerateShoppingList = async () => {
    if (!mealPlan || mealPlan.meals.length === 0) return;

    setIsGenerating(true);
    try {
      await generateShoppingListFromPlan(mealPlan);
      setGeneratedSuccess(true);
      setTimeout(() => {
        setGeneratedSuccess(false);
        router.push('/shopping');
      }, 1500);
    } catch (error) {
      console.error('Failed to generate shopping list:', error);
      setIsGenerating(false);
    }
  };

  const handleWeekChange = (weeks: WeekCount) => {
    setSelectedWeeks(weeks);
  };

  // AI suggestion handler
  const handleSuggestPlan = async () => {
    if (recipes.length === 0) {
      setSuggestionError('Necesitas tener recetas guardadas para que la IA pueda sugerir un plan.');
      setIsSuggestionDialogOpen(true);
      return;
    }

    setIsSuggesting(true);
    setSuggestionError(null);
    setSuggestedPlan(null);

    try {
      // Load despensa items
      const despensa = await getDespensa();
      const despensaItems = despensa.items.map((item) => ({
        name: item.name,
        category: item.category,
      }));

      // Calculate number of days based on selected weeks
      const numDays = selectedWeeks * 7;

      // Prepare recipes data for the API
      const recipesData = recipes.map((recipe) => ({
        id: recipe.id,
        title: recipe.title,
        cuisine: recipe.cuisine,
        difficulty: recipe.difficulty,
      }));

      // Call the API
      const response = await fetch('/api/suggest-meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numDays,
          recipes: recipesData,
          despensaItems,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al generar la sugerencia');
      }

      const data = await response.json();

      if (data.mealPlan && data.mealPlan.days) {
        setSuggestedPlan(data.mealPlan.days);
        setIsSuggestionDialogOpen(true);
      } else {
        throw new Error('Respuesta invalida del servidor');
      }
    } catch (error) {
      console.error('Failed to get AI suggestion:', error);
      setSuggestionError(
        error instanceof Error ? error.message : 'Error al generar la sugerencia. Intentalo de nuevo.'
      );
      setIsSuggestionDialogOpen(true);
    } finally {
      setIsSuggesting(false);
    }
  };

  // Apply suggested plan handler
  const handleApplySuggestion = async () => {
    if (!mealPlan || !suggestedPlan) return;

    setIsApplying(true);

    try {
      // Apply each meal from the suggestion
      for (const day of suggestedPlan) {
        // Add lunch
        if (day.lunch && day.lunch.recipeId) {
          await addMealToDay(
            mealPlan.id,
            day.date,
            'lunch',
            day.lunch.recipeId,
            day.lunch.recipeTitle
          );
        }
        // Add dinner
        if (day.dinner && day.dinner.recipeId) {
          await addMealToDay(
            mealPlan.id,
            day.date,
            'dinner',
            day.dinner.recipeId,
            day.dinner.recipeTitle
          );
        }
      }

      // Refresh meal plan
      const updatedPlan = await getCurrentMealPlan();
      if (updatedPlan) {
        setMealPlan(updatedPlan);
      }

      // Close dialog and reset state
      setIsSuggestionDialogOpen(false);
      setSuggestedPlan(null);
    } catch (error) {
      console.error('Failed to apply suggestion:', error);
      setSuggestionError('Error al aplicar la sugerencia. Intentalo de nuevo.');
    } finally {
      setIsApplying(false);
    }
  };

  // Cancel suggestion handler
  const handleCancelSuggestion = () => {
    setIsSuggestionDialogOpen(false);
    setSuggestedPlan(null);
    setSuggestionError(null);
  };

  // Get recipe by ID for displaying food category in suggestion preview
  const getRecipeFromSuggestion = (recipeId: string): Recipe | undefined => {
    return recipes.find((r) => r.id === recipeId);
  };

  // Format date for display
  const formatDateDisplay = (dateString: string): string => {
    const date = new Date(dateString + 'T00:00:00');
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    return `${dayNames[date.getDay()]} ${date.getDate()}`;
  };

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const mealTypeLabel = selectedMealType === 'lunch' ? 'comida' : 'cena';

  return (
    <AppShell title="Planificar">
      <div className="py-6 space-y-6">
        {/* Week selector and AI suggestion */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Semanas a planificar
              </span>
              <div className="flex gap-2">
                {([1, 2, 3] as WeekCount[]).map((weeks) => (
                  <Button
                    key={weeks}
                    variant={selectedWeeks === weeks ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleWeekChange(weeks)}
                    className="w-10"
                  >
                    {weeks}
                  </Button>
                ))}
              </div>
            </div>

            {/* AI suggestion button */}
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleSuggestPlan}
              disabled={isSuggesting || isLoading}
            >
              {isSuggesting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generando sugerencia...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Sugerir plan con IA
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Loading state */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            {/* Calendar */}
            <MealCalendar
              weekDays={weekDays}
              onAddMeal={handleAddMeal}
              onRemoveMeal={handleRemoveMeal}
            />

            {/* Generate shopping list button */}
            <Button
              className="w-full gap-2"
              size="lg"
              onClick={handleGenerateShoppingList}
              disabled={isGenerating || generatedSuccess || !mealPlan || mealPlan.meals.length === 0}
            >
              {generatedSuccess ? (
                <>
                  <Check className="h-5 w-5" />
                  Lista generada
                </>
              ) : isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5" />
                  Generar lista de compra
                </>
              )}
            </Button>

            {/* Help text */}
            {mealPlan && mealPlan.meals.length === 0 && (
              <p className="text-xs text-muted-foreground text-center">
                Pulsa &quot;+ Anadir&quot; en cualquier dia para asignar una receta
              </p>
            )}
          </>
        )}
      </div>

      {/* Recipe picker dialog */}
      <Dialog open={isPickerOpen} onOpenChange={setIsPickerOpen}>
        <DialogContent className="max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Elegir receta para {mealTypeLabel}</DialogTitle>
          </DialogHeader>

          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar recetas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Recipe list */}
          <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
            {filteredRecipes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {searchTerm
                  ? 'No se encontraron recetas'
                  : 'No hay recetas disponibles'}
              </p>
            ) : (
              filteredRecipes.map((recipe) => {
                const category = detectFoodCategory(recipe.title, recipe.cuisine);
                return (
                  <button
                    key={recipe.id}
                    onClick={() => handleSelectRecipe(recipe)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg border',
                      'hover:bg-muted/50 hover:border-primary transition-colors text-left'
                    )}
                  >
                    <FoodPlaceholder category={category} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{recipe.title}</p>
                      {recipe.cookingTime && (
                        <p className="text-xs text-muted-foreground">
                          {recipe.cookingTime}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* AI suggestion preview dialog */}
      <Dialog open={isSuggestionDialogOpen} onOpenChange={setIsSuggestionDialogOpen}>
        <DialogContent className="max-h-[85vh] flex flex-col sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Plan sugerido por IA
            </DialogTitle>
            {!suggestionError && suggestedPlan && (
              <DialogDescription>
                Revisa el plan sugerido para {suggestedPlan.length} dias. Puedes aceptarlo para aplicar todas las comidas o cancelar para mantener tu plan actual.
              </DialogDescription>
            )}
          </DialogHeader>

          {/* Error state */}
          {suggestionError && (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <p className="text-sm text-muted-foreground">{suggestionError}</p>
            </div>
          )}

          {/* Suggestion preview */}
          {suggestedPlan && !suggestionError && (
            <div className="flex-1 overflow-y-auto space-y-3 min-h-0 py-2">
              {suggestedPlan.map((day) => {
                const lunchRecipe = getRecipeFromSuggestion(day.lunch.recipeId);
                const dinnerRecipe = getRecipeFromSuggestion(day.dinner.recipeId);
                const lunchCategory = lunchRecipe
                  ? detectFoodCategory(lunchRecipe.title, lunchRecipe.cuisine)
                  : detectFoodCategory(day.lunch.recipeTitle);
                const dinnerCategory = dinnerRecipe
                  ? detectFoodCategory(dinnerRecipe.title, dinnerRecipe.cuisine)
                  : detectFoodCategory(day.dinner.recipeTitle);

                return (
                  <Card key={day.date} className="overflow-hidden">
                    <CardContent className="p-3">
                      {/* Day header */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-semibold text-sm">
                          {formatDateDisplay(day.date)}
                        </span>
                      </div>

                      {/* Meals */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* Lunch */}
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                          <FoodPlaceholder category={lunchCategory} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">Comida</p>
                            <p className="text-sm font-medium truncate">
                              {day.lunch.recipeTitle}
                            </p>
                          </div>
                        </div>

                        {/* Dinner */}
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                          <FoodPlaceholder category={dinnerCategory} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">Cena</p>
                            <p className="text-sm font-medium truncate">
                              {day.dinner.recipeTitle}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleCancelSuggestion}
              disabled={isApplying}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            {suggestedPlan && !suggestionError && (
              <Button onClick={handleApplySuggestion} disabled={isApplying}>
                {isApplying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Aplicando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Aplicar plan
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
