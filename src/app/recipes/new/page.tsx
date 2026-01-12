'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { createRecipe } from '@/lib/recipes';
import { useAuth } from '@/contexts/auth-context';

export default function NewRecipePage() {
  const router = useRouter();
  const { currentUser } = useAuth();
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
        source: 'manual' as const,
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
    <AppShell title="Añadir Receta" showBack hideNav>
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Título *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Nombre de la receta"
            required
          />
        </div>

        {/* Ingredients */}
        <div className="space-y-2">
          <Label htmlFor="ingredients">Ingredientes *</Label>
          <Textarea
            id="ingredients"
            value={formData.ingredients}
            onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
            placeholder="Lista tus ingredientes (uno por línea o separados por comas)"
            rows={5}
            required
          />
        </div>

        {/* Steps */}
        <div className="space-y-2">
          <Label>Pasos *</Label>
          {formData.steps.map((step, index) => (
            <div key={index} className="flex gap-2">
              <span className="text-gray-500 pt-2">{index + 1}.</span>
              <Input
                value={step}
                onChange={(e) => handleStepChange(index, e.target.value)}
                placeholder={`Paso ${index + 1}`}
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
            + Añadir Paso
          </Button>
        </div>

        {/* Optional fields */}
        <Card>
          <CardContent className="pt-4 space-y-4">
            <p className="text-sm text-gray-500">Detalles opcionales</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="servings">Porciones</Label>
                <Input
                  id="servings"
                  type="number"
                  value={formData.servings}
                  onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                  placeholder="4"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cookingTime">Tiempo de cocción</Label>
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
                <Label htmlFor="cuisine">Cocina</Label>
                <Input
                  id="cuisine"
                  value={formData.cuisine}
                  onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                  placeholder="Italiana"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficulty">Dificultad</Label>
                <select
                  id="difficulty"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as typeof formData.difficulty })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">Seleccionar...</option>
                  <option value="easy">Fácil</option>
                  <option value="medium">Media</option>
                  <option value="hard">Difícil</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dietaryTags">Etiquetas dietéticas</Label>
              <Input
                id="dietaryTags"
                value={formData.dietaryTags}
                onChange={(e) => setFormData({ ...formData, dietaryTags: e.target.value })}
                placeholder="vegetariano, sin gluten (separado por comas)"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar Receta'}
        </Button>
      </form>
    </AppShell>
  );
}
