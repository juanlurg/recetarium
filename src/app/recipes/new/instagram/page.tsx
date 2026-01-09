'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createRecipe } from '@/lib/recipes';
import { useAuth } from '@/contexts/auth-context';

interface ExtractedRecipe {
  title: string;
  ingredients: string;
  steps: string[];
  servings?: number;
  cookingTime?: string;
  cuisine?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  dietaryTags?: string[];
}

export default function InstagramImportPage() {
  const router = useRouter();
  const { currentUser } = useAuth();

  const [instagramUrl, setInstagramUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [error, setError] = useState('');
  const [extractedRecipe, setExtractedRecipe] = useState<ExtractedRecipe | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for editing extracted recipe
  const [formData, setFormData] = useState({
    title: '',
    ingredients: '',
    steps: [''],
    servings: '',
    cookingTime: '',
    cuisine: '',
    difficulty: '' as '' | 'easy' | 'medium' | 'hard',
    dietaryTags: '',
  });

  const handleProcess = async () => {
    if (!instagramUrl.trim()) return;

    setIsProcessing(true);
    setError('');
    setExtractedRecipe(null);

    try {
      // Step 1: Download video
      setProcessingStep('Downloading video from Instagram...');
      const downloadRes = await fetch('/api/instagram/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: instagramUrl }),
      });

      if (!downloadRes.ok) {
        const data = await downloadRes.json();
        throw new Error(data.error || 'Failed to download video');
      }

      const { videoUrl } = await downloadRes.json();

      // Step 2: Extract recipe with Gemini
      setProcessingStep('Analyzing video with AI (this may take a minute)...');
      const extractRes = await fetch('/api/extract-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl }),
      });

      if (!extractRes.ok) {
        const data = await extractRes.json();
        throw new Error(data.error || 'Failed to extract recipe');
      }

      const { recipe } = await extractRes.json();
      setExtractedRecipe(recipe);

      // Populate form with extracted data
      setFormData({
        title: recipe.title || '',
        ingredients: recipe.ingredients || '',
        steps: recipe.steps?.length > 0 ? recipe.steps : [''],
        servings: recipe.servings?.toString() || '',
        cookingTime: recipe.cookingTime || '',
        cuisine: recipe.cuisine || '',
        difficulty: recipe.difficulty || '',
        dietaryTags: recipe.dietaryTags?.join(', ') || '',
      });

      setProcessingStep('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...formData.steps];
    newSteps[index] = value;
    setFormData({ ...formData, steps: newSteps });
  };

  const addStep = () => {
    setFormData({ ...formData, steps: [...formData.steps, ''] });
  };

  const removeStep = (index: number) => {
    if (formData.steps.length > 1) {
      const newSteps = formData.steps.filter((_, i) => i !== index);
      setFormData({ ...formData, steps: newSteps });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSubmitting(true);
    try {
      const recipeData = {
        title: formData.title.trim(),
        ingredients: formData.ingredients.trim(),
        steps: formData.steps.filter((s) => s.trim() !== ''),
        servings: formData.servings ? parseInt(formData.servings) : undefined,
        cookingTime: formData.cookingTime.trim() || undefined,
        cuisine: formData.cuisine.trim() || undefined,
        difficulty: formData.difficulty || undefined,
        dietaryTags: formData.dietaryTags
          ? formData.dietaryTags.split(',').map((t) => t.trim()).filter(Boolean)
          : undefined,
        source: 'instagram' as const,
        sourceUrl: instagramUrl,
        createdBy: currentUser,
      };

      await createRecipe(recipeData);
      router.push('/recipes');
    } catch (error) {
      console.error('Failed to create recipe:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell title="Import from Instagram" showBack hideNav>
      <div className="space-y-4 py-4">
        {!extractedRecipe ? (
          <>
            {/* URL Input */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Paste Instagram Reel URL</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://www.instagram.com/reel/..."
                  disabled={isProcessing}
                />
                <Button
                  onClick={handleProcess}
                  disabled={isProcessing || !instagramUrl.trim()}
                  className="w-full"
                >
                  {isProcessing ? 'Processing...' : 'Extract Recipe'}
                </Button>

                {processingStep && (
                  <p className="text-sm text-gray-500 text-center">{processingStep}</p>
                )}

                {error && (
                  <p className="text-sm text-red-500 text-center">{error}</p>
                )}
              </CardContent>
            </Card>

            <p className="text-xs text-gray-400 text-center">
              Paste a public Instagram Reel URL. The AI will watch the video and extract the recipe automatically.
            </p>
          </>
        ) : (
          /* Edit form for extracted recipe */
          <form onSubmit={handleSubmit} className="space-y-4">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <p className="text-sm text-green-700">
                  Recipe extracted successfully. Review and edit below before saving.
                </p>
              </CardContent>
            </Card>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            {/* Ingredients */}
            <div className="space-y-2">
              <Label htmlFor="ingredients">Ingredients *</Label>
              <Textarea
                id="ingredients"
                value={formData.ingredients}
                onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                rows={5}
                required
              />
            </div>

            {/* Steps */}
            <div className="space-y-2">
              <Label>Steps *</Label>
              {formData.steps.map((step, index) => (
                <div key={index} className="flex gap-2">
                  <span className="text-gray-500 pt-2">{index + 1}.</span>
                  <Input
                    value={step}
                    onChange={(e) => handleStepChange(index, e.target.value)}
                  />
                  {formData.steps.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStep(index)}
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addStep}>
                + Add Step
              </Button>
            </div>

            {/* Optional fields */}
            <Card>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="servings">Servings</Label>
                    <Input
                      id="servings"
                      type="number"
                      value={formData.servings}
                      onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cookingTime">Cooking Time</Label>
                    <Input
                      id="cookingTime"
                      value={formData.cookingTime}
                      onChange={(e) => setFormData({ ...formData, cookingTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cuisine">Cuisine</Label>
                    <Input
                      id="cuisine"
                      value={formData.cuisine}
                      onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <select
                      id="difficulty"
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as typeof formData.difficulty })}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="">Select...</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dietaryTags">Dietary Tags</Label>
                  <Input
                    id="dietaryTags"
                    value={formData.dietaryTags}
                    onChange={(e) => setFormData({ ...formData, dietaryTags: e.target.value })}
                    placeholder="vegetarian, gluten-free"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setExtractedRecipe(null)}
              >
                Start Over
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Recipe'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
