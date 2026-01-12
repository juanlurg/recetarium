import { NextRequest, NextResponse } from 'next/server';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

const RecipeSchema = z.object({
  title: z.string().describe('The name of the recipe'),
  ingredients: z.string().describe('List of ingredients, one per line'),
  steps: z.array(z.string()).describe('Step-by-step cooking instructions'),
  servings: z.number().optional().describe('Number of servings'),
  cookingTime: z.string().optional().describe('Total cooking time (e.g., "30 min")'),
  cuisine: z.string().optional().describe('Type of cuisine (e.g., "Italian", "Mexican")'),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().describe('Difficulty level'),
  dietaryTags: z.array(z.string()).optional().describe('Dietary tags like vegetarian, gluten-free'),
});

export async function POST(request: NextRequest) {
  try {
    const { videoUrl } = await request.json();

    if (!videoUrl) {
      return NextResponse.json({ error: 'Video URL required' }, { status: 400 });
    }

    // Fetch the video as a blob
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch video' }, { status: 400 });
    }

    const videoBuffer = await videoResponse.arrayBuffer();
    const videoBase64 = Buffer.from(videoBuffer).toString('base64');
    const mimeType = videoResponse.headers.get('content-type') || 'video/mp4';

    // Use Gemini to extract recipe
    const result = await generateObject({
      model: google('gemini-3.0-flash'),
      schema: RecipeSchema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Watch this cooking video carefully and extract the complete recipe information.

              Provide:
              - A clear title for the recipe
              - Complete list of ingredients with quantities
              - Step-by-step instructions
              - Estimated servings and cooking time if mentioned
              - The type of cuisine
              - Difficulty level (easy/medium/hard)
              - Any dietary tags (vegetarian, vegan, gluten-free, etc.)

              Be thorough and include all ingredients and steps shown in the video.`,
            },
            {
              type: 'file',
              data: videoBase64,
              mediaType: mimeType,
            },
          ],
        },
      ],
    });

    return NextResponse.json({ recipe: result.object });
  } catch (error) {
    console.error('Recipe extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract recipe from video' },
      { status: 500 }
    );
  }
}
