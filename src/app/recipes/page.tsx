'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RecipeCard } from '@/components/recipe-card';
import { getAllRecipes, searchRecipes } from '@/lib/recipes';
import { Recipe } from '@/types/recipe';
import { Plus, Instagram, Search } from 'lucide-react';

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
    <AppShell title="Recetas">
      <div className="space-y-6 py-6">
        {/* Search with icon */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre o ingrediente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Add buttons */}
        <div className="flex gap-3">
          <Link href="/recipes/new" className="flex-1">
            <Button className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Nueva Receta
            </Button>
          </Link>
          <Link href="/recipes/new/instagram" className="flex-1">
            <Button variant="outline" className="w-full gap-2">
              <Instagram className="h-4 w-4" />
              Desde Instagram
            </Button>
          </Link>
        </div>

        {/* Recipe count */}
        {!isLoading && filteredRecipes.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {filteredRecipes.length} {filteredRecipes.length === 1 ? 'receta' : 'recetas'}
            {searchTerm && ` para "${searchTerm}"`}
          </p>
        )}

        {/* Recipe list */}
        {isLoading ? (
          <div className="divide-y divide-border/50">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-11 bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchTerm
                ? 'No se encontraron recetas'
                : 'Aun no hay recetas. Añade la primera!'}
            </p>
          </div>
        ) : (
          <div>
            {filteredRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
