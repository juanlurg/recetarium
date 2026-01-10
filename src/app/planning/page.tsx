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
import { MealPlan, WeekDay } from '@/types/meal-plan';
import { Recipe } from '@/types/recipe';
import { ShoppingCart, Search, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const mealTypeLabel = selectedMealType === 'lunch' ? 'comida' : 'cena';

  return (
    <AppShell title="Planificar">
      <div className="py-6 space-y-6">
        {/* Week selector */}
        <Card>
          <CardContent className="p-4">
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
    </AppShell>
  );
}
