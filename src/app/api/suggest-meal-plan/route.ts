import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

// Schema for a single meal suggestion
const MealSuggestionSchema = z.object({
  recipeId: z.string().describe('The ID of an existing recipe, or "new" if suggesting a new recipe'),
  recipeTitle: z.string().describe('The title of the recipe'),
});

// Schema for a day's meals
const DayPlanSchema = z.object({
  date: z.string().describe('The date in YYYY-MM-DD format'),
  lunch: MealSuggestionSchema.describe('Lunch suggestion for this day'),
  dinner: MealSuggestionSchema.describe('Dinner suggestion for this day'),
});

// Schema for the full meal plan
const MealPlanSuggestionSchema = z.object({
  days: z.array(DayPlanSchema).describe('Array of daily meal plans'),
});

interface RecipeInput {
  id: string;
  title: string;
  cuisine?: string;
  difficulty?: string;
}

interface DespensaItemInput {
  name: string;
  category?: string;
}

export async function POST(request: Request) {
  try {
    const { numDays, recipes, despensaItems, preferences } = await request.json();

    // Validate required fields
    if (!numDays || typeof numDays !== 'number' || numDays < 1 || numDays > 21) {
      return Response.json(
        { error: 'numDays must be a number between 1 and 21' },
        { status: 400 }
      );
    }

    if (!recipes || !Array.isArray(recipes)) {
      return Response.json(
        { error: 'recipes array is required' },
        { status: 400 }
      );
    }

    // Build recipe list for the prompt
    const recipeList = recipes
      .map((r: RecipeInput) => `- ID: "${r.id}", Title: "${r.title}"${r.cuisine ? `, Cuisine: ${r.cuisine}` : ''}${r.difficulty ? `, Difficulty: ${r.difficulty}` : ''}`)
      .join('\n');

    // Build despensa items list
    const despensaList = despensaItems && Array.isArray(despensaItems) && despensaItems.length > 0
      ? despensaItems.map((item: DespensaItemInput | string) =>
          typeof item === 'string' ? item : item.name
        ).join(', ')
      : 'No specific ingredients listed';

    // Generate dates starting from today
    const startDate = new Date();
    const dates: string[] = [];
    for (let i = 0; i < numDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    const prompt = `Create a meal plan for ${numDays} days starting from ${dates[0]}.

Available recipes in the collection:
${recipeList || 'No recipes available'}

Available ingredients in the pantry:
${despensaList}

User preferences:
${preferences || 'No specific preferences'}

Guidelines:
1. ONLY use recipe IDs from the available recipes list above - do not invent new recipe IDs
2. For each day, assign a different recipe for lunch and dinner
3. Prioritize recipes that use available pantry ingredients
4. Ensure variety - avoid repeating the same recipe on consecutive days
5. Balance cuisines and difficulty levels throughout the plan
6. Consider meal prep efficiency (similar ingredients on nearby days)

The dates for the plan are:
${dates.map((d, i) => `Day ${i + 1}: ${d}`).join('\n')}

Return a meal plan with lunch and dinner suggestions for each day, using the exact recipe IDs and titles from the available recipes list.`;

    const result = await generateObject({
      model: google('gemini-2.0-flash'),
      schema: MealPlanSuggestionSchema,
      prompt,
    });

    return Response.json({ mealPlan: result.object });
  } catch (error) {
    console.error('Meal plan suggestion error:', error);
    return Response.json(
      { error: 'Failed to generate meal plan suggestion' },
      { status: 500 }
    );
  }
}
