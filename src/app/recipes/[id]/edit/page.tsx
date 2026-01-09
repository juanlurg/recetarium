'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { getRecipeById, updateRecipe } from '@/lib/recipes';

export default function EditRecipePage() {
  const params = useParams();
  const router = useRouter();
  const recipeId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    async function loadRecipe() {
      try {
        const recipe = await getRecipeById(recipeId);
        if (recipe) {
          setFormData({
            title: recipe.title,
            ingredients: recipe.ingredients,
            steps: recipe.steps.length > 0 ? recipe.steps : [''],
            servings: recipe.servings?.toString() || '',
            cookingTime: recipe.cookingTime || '',
            cuisine: recipe.cuisine || '',
            difficulty: recipe.difficulty || '',
            dietaryTags: recipe.dietaryTags?.join(', ') || '',
          });
        }
      } catch (error) {
        console.error('Failed to load recipe:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadRecipe();
  }, [recipeId]);

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
    setIsSubmitting(true);

    try {
      const updateData = {
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
      };

      await updateRecipe(recipeId, updateData);
      router.push(`/recipes/${recipeId}`);
    } catch (error) {
      console.error('Failed to update recipe:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AppShell title="Edit Recipe" showBack hideNav>
        <p className="text-center text-gray-500 py-8">Loading...</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Edit Recipe" showBack hideNav>
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Recipe name"
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
            placeholder="List your ingredients"
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
                placeholder={`Step ${index + 1}`}
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
            <p className="text-sm text-gray-500">Optional details</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="servings">Servings</Label>
                <Input
                  id="servings"
                  type="number"
                  value={formData.servings}
                  onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                  placeholder="4"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cookingTime">Cooking Time</Label>
                <Input
                  id="cookingTime"
                  value={formData.cookingTime}
                  onChange={(e) => setFormData({ ...formData, cookingTime: e.target.value })}
                  placeholder="30 min"
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
                  placeholder="Italian"
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
                placeholder="vegetarian, gluten-free (comma-separated)"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </AppShell>
  );
}
