'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAllRecipes, searchRecipes } from '@/lib/recipes';
import { Recipe } from '@/types/recipe';

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRecipes() {
      try {
        const data = await getAllRecipes();
        setRecipes(data);
      } catch (error) {
        console.error('Failed to load recipes:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadRecipes();
  }, []);

  const filteredRecipes = searchRecipes(recipes, searchTerm);

  return (
    <AppShell title="Recipes">
      <div className="space-y-4 py-4">
        {/* Search */}
        <Input
          type="search"
          placeholder="Search by name or ingredient..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Add button */}
        <div className="flex gap-2">
          <Link href="/recipes/new" className="flex-1">
            <Button className="w-full">+ Add Recipe</Button>
          </Link>
          <Link href="/recipes/new/instagram" className="flex-1">
            <Button variant="outline" className="w-full">+ From Instagram</Button>
          </Link>
        </div>

        {/* Recipe list */}
        {isLoading ? (
          <p className="text-center text-gray-500 py-8">Loading recipes...</p>
        ) : filteredRecipes.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            {searchTerm ? 'No recipes found' : 'No recipes yet. Add your first one!'}
          </p>
        ) : (
          <div className="space-y-3">
            {filteredRecipes.map((recipe) => (
              <Link key={recipe.id} href={`/recipes/${recipe.id}`}>
                <Card className="hover:bg-gray-50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{recipe.title}</h3>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {recipe.cuisine && (
                            <Badge variant="secondary">{recipe.cuisine}</Badge>
                          )}
                          {recipe.cookingTime && (
                            <Badge variant="outline">{recipe.cookingTime}</Badge>
                          )}
                          {recipe.source === 'instagram' && (
                            <Badge variant="outline">Instagram</Badge>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">
                        by {recipe.createdBy}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
