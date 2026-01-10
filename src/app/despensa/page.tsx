'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  getDespensa,
  addDespensaItem,
  removeDespensaItem,
  updateDespensaItemCategory,
} from '@/lib/despensa';
import { DespensaItem } from '@/types/despensa';
import { Plus, X, Package, Leaf } from 'lucide-react';

export default function DespensaPage() {
  const [items, setItems] = useState<DespensaItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    loadDespensa();
  }, []);

  async function loadDespensa() {
    try {
      const data = await getDespensa();
      setItems(data.items);
    } catch (error) {
      console.error('Failed to load despensa:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItem.trim() || isAdding) return;

    setIsAdding(true);
    try {
      await addDespensaItem(newItem.trim(), 'current');
      setNewItem('');
      await loadDespensa();
    } catch (error) {
      console.error('Failed to add item:', error);
    } finally {
      setIsAdding(false);
    }
  }

  async function handleRemoveItem(itemId: string) {
    try {
      await removeDespensaItem(itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  }

  async function handleToggleCategory(item: DespensaItem) {
    const newCategory = item.category === 'staple' ? 'current' : 'staple';
    try {
      await updateDespensaItemCategory(item.id, newCategory);
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, category: newCategory } : i))
      );
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  }

  const staples = items.filter((i) => i.category === 'staple');
  const current = items.filter((i) => i.category === 'current');

  return (
    <AppShell title="Despensa">
      <div className="py-6 space-y-6">
        {/* Add item form */}
        <form onSubmit={handleAddItem} className="flex gap-2">
          <Input
            placeholder="Añadir ingrediente..."
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            disabled={isAdding}
          />
          <Button type="submit" disabled={isAdding || !newItem.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </form>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-32 bg-muted animate-pulse rounded-xl" />
            <div className="h-32 bg-muted animate-pulse rounded-xl" />
          </div>
        ) : (
          <>
            {/* Staples section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Siempre tengo
                  <Badge variant="secondary" className="ml-auto">
                    {staples.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {staples.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Toca un ingrediente para marcarlo como basico
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {staples.map((item) => (
                      <Badge
                        key={item.id}
                        variant="secondary"
                        className="gap-1 cursor-pointer hover:bg-secondary/80"
                        onClick={() => handleToggleCategory(item)}
                      >
                        {item.name}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveItem(item.id);
                          }}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current items section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Leaf className="h-4 w-4" />
                  Tengo ahora
                  <Badge variant="secondary" className="ml-auto">
                    {current.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {current.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Añade ingredientes que tengas en casa
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {current.map((item) => (
                      <Badge
                        key={item.id}
                        variant="outline"
                        className="gap-1 cursor-pointer hover:bg-accent"
                        onClick={() => handleToggleCategory(item)}
                      >
                        {item.name}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveItem(item.id);
                          }}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Help text */}
            <p className="text-xs text-muted-foreground text-center">
              Toca un ingrediente para cambiar su categoria. Los ingredientes de la despensa no se añadiran a la lista de la compra.
            </p>
          </>
        )}
      </div>
    </AppShell>
  );
}
