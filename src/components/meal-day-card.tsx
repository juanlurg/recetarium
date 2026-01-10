'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FoodPlaceholder, detectFoodCategory } from '@/components/ui/food-placeholder';
import { WeekDay, PlannedMeal } from '@/types/meal-plan';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MealDayCardProps {
  weekDay: WeekDay;
  onAddMeal: (date: string, mealType: 'lunch' | 'dinner') => void;
  onRemoveMeal: (mealId: string) => void;
}

interface MealSlotProps {
  meal?: PlannedMeal;
  mealType: 'lunch' | 'dinner';
  date: string;
  onAdd: () => void;
  onRemove: (mealId: string) => void;
}

function MealSlot({ meal, mealType, onAdd, onRemove }: MealSlotProps) {
  const label = mealType === 'lunch' ? 'Comida' : 'Cena';

  if (meal) {
    const category = detectFoodCategory(meal.recipeTitle);
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 group">
        <FoodPlaceholder category={category} size="sm" className="h-8 w-8 text-base shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-medium truncate">{meal.recipeTitle}</p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(meal.id);
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <button
      onClick={onAdd}
      className="flex items-center gap-2 p-2 rounded-lg border border-dashed border-muted-foreground/30 hover:border-primary hover:bg-muted/30 transition-colors w-full text-left"
    >
      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Plus className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-muted-foreground/70">+ Anadir</p>
      </div>
    </button>
  );
}

export function MealDayCard({ weekDay, onAddMeal, onRemoveMeal }: MealDayCardProps) {
  return (
    <Card
      className={cn(
        'overflow-hidden py-3',
        weekDay.isToday && 'ring-2 ring-primary ring-offset-2'
      )}
    >
      <CardContent className="p-3 space-y-2">
        {/* Day header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs text-muted-foreground capitalize">{weekDay.dayName}</p>
            <p
              className={cn(
                'text-lg font-semibold',
                weekDay.isToday && 'text-primary'
              )}
            >
              {weekDay.dayNumber}
            </p>
          </div>
          {weekDay.isToday && (
            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
              Hoy
            </span>
          )}
        </div>

        {/* Meal slots */}
        <div className="space-y-2">
          <MealSlot
            meal={weekDay.lunch}
            mealType="lunch"
            date={weekDay.date}
            onAdd={() => onAddMeal(weekDay.date, 'lunch')}
            onRemove={onRemoveMeal}
          />
          <MealSlot
            meal={weekDay.dinner}
            mealType="dinner"
            date={weekDay.date}
            onAdd={() => onAddMeal(weekDay.date, 'dinner')}
            onRemove={onRemoveMeal}
          />
        </div>
      </CardContent>
    </Card>
  );
}
