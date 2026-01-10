'use client';

import { MealDayCard } from '@/components/meal-day-card';
import { WeekDay } from '@/types/meal-plan';

interface MealCalendarProps {
  weekDays: WeekDay[];
  onAddMeal: (date: string, mealType: 'lunch' | 'dinner') => void;
  onRemoveMeal: (mealId: string) => void;
}

export function MealCalendar({ weekDays, onAddMeal, onRemoveMeal }: MealCalendarProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
      {weekDays.map((day) => (
        <MealDayCard
          key={day.date}
          weekDay={day}
          onAddMeal={onAddMeal}
          onRemoveMeal={onRemoveMeal}
        />
      ))}
    </div>
  );
}
