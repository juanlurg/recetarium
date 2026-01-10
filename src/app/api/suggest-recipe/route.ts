import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

const RecipeSchema = z.object({
  title: z.string().describe('The name of the recipe'),
  ingredients: z.string().describe('List of ingredients with quantities, one per line'),
  steps: z.array(z.string()).describe('Step-by-step cooking instructions'),
  servings: z.number().optional().describe('Number of servings'),
  cookingTime: z.string().optional().describe('Total cooking time (e.g., "30 min")'),
  cuisine: z.string().optional().describe('Type of cuisine (e.g., "Italian", "Mexican")'),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().describe('Difficulty level'),
  dietaryTags: z.array(z.string()).optional().describe('Dietary tags like vegetarian, gluten-free'),
});

interface ExistingRecipe {
  title: string;
  cuisine?: string;
  difficulty?: string;
}

export async function POST(request: Request) {
  try {
    const { despensaItems, preferences, existingRecipes } = await request.json();

    if (!despensaItems || !Array.isArray(despensaItems)) {
      return Response.json(
        { error: 'despensaItems array is required' },
        { status: 400 }
      );
    }

    // Build context from existing recipes
    const recipeContext = existingRecipes && existingRecipes.length > 0
      ? existingRecipes
          .slice(0, 5)
          .map((r: ExistingRecipe) => r.title)
          .join(', ')
      : 'no existing recipes';

    const prompt = `Suggest a new recipe based on the following context:

Available ingredients in the pantry:
${despensaItems.length > 0 ? despensaItems.join(', ') : 'No specific ingredients listed'}

User preferences:
${preferences || 'No specific preferences'}

Existing recipes in their collection (to match their cooking style):
${recipeContext}

Create a recipe that:
1. Prioritizes using the available ingredients from the pantry
2. Matches the style and complexity of existing recipes
3. Is practical for home cooking
4. Has clear, numbered steps
5. Includes complete ingredient quantities

The recipe should be in Spanish as this is a Spanish cooking app.

Return a complete recipe with title, ingredients (one per line with quantities), and detailed steps.`;

    const result = await generateObject({
      model: google('gemini-2.0-flash'),
      schema: RecipeSchema,
      prompt,
    });

    return Response.json({ recipe: result.object });
  } catch (error) {
    console.error('Recipe suggestion error:', error);
    return Response.json(
      { error: 'Failed to generate recipe suggestion' },
      { status: 500 }
    );
  }
}
