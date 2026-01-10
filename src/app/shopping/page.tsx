'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  getShoppingList,
  addManualItem,
  toggleItem,
  removeItem,
  clearCheckedItems,
  clearAllItems,
} from '@/lib/shopping';
import { moveShoppingItemToDespensa } from '@/lib/despensa';
import { ShoppingItem } from '@/types/shopping';

export default function ShoppingPage() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const loadList = async () => {
    try {
      const list = await getShoppingList();
      setItems(list.items);
    } catch (error) {
      console.error('Failed to load shopping list:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    try {
      await addManualItem(newItemText);
      setNewItemText('');
      await loadList();
    } catch (error) {
      console.error('Failed to add item:', error);
    }
  };

  const handleToggle = async (itemId: string) => {
    try {
      await toggleItem(itemId);
      await loadList();
    } catch (error) {
      console.error('Failed to toggle item:', error);
    }
  };

  const handleRemove = async (itemId: string) => {
    try {
      await removeItem(itemId);
      await loadList();
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const handleClearCheckedOnly = async () => {
    setIsClearing(true);
    try {
      await clearCheckedItems();
      await loadList();
      setIsClearDialogOpen(false);
    } catch (error) {
      console.error('Failed to clear checked items:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleMoveToDespensaAndClear = async () => {
    setIsClearing(true);
    try {
      // Move all checked items to despensa
      const checkedItems = items.filter((i) => i.checked);
      for (const item of checkedItems) {
        await moveShoppingItemToDespensa(item.text);
      }
      // Then clear them from the list
      await clearCheckedItems();
      await loadList();
      setIsClearDialogOpen(false);
    } catch (error) {
      console.error('Failed to move items to despensa:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleDoneShopping = async () => {
    try {
      await clearAllItems();
      await loadList();
    } catch (error) {
      console.error('Failed to clear list:', error);
    }
  };

  // Sort: unchecked first, then checked
  const sortedItems = [...items].sort((a, b) => {
    if (a.checked === b.checked) return 0;
    return a.checked ? 1 : -1;
  });

  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <AppShell title="Lista de Compras">
      <div className="space-y-4 py-4">
        {/* Add item form */}
        <form onSubmit={handleAddItem} className="flex gap-2">
          <Input
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Añadir artículo..."
            className="flex-1"
          />
          <Button type="submit">Añadir</Button>
        </form>

        {/* List */}
        {isLoading ? (
          <p className="text-center text-gray-500 py-8">Cargando...</p>
        ) : items.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            La lista de compras está vacía. Añade artículos desde recetas o manualmente arriba.
          </p>
        ) : (
          <div className="space-y-2">
            {sortedItems.map((item) => (
              <Card
                key={item.id}
                className={item.checked ? 'opacity-50' : ''}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <Checkbox
                    checked={item.checked}
                    onCheckedChange={() => handleToggle(item.id)}
                  />
                  <div className="flex-1">
                    <p className={item.checked ? 'line-through text-gray-500' : ''}>
                      {item.text}
                    </p>
                    {item.fromRecipes.length > 0 && (
                      <p className="text-xs text-gray-400">
                        De: {item.fromRecipes.join(', ')}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(item.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    ✕
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Actions */}
        {items.length > 0 && (
          <div className="flex gap-2">
            {checkedCount > 0 && (
              <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1">
                    Limpiar marcados ({checkedCount})
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Limpiar artículos marcados</DialogTitle>
                    <DialogDescription>
                      ¿Quieres mover los artículos marcados a la despensa antes de limpiarlos?
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="flex-col gap-2 sm:flex-col">
                    <Button
                      onClick={handleMoveToDespensaAndClear}
                      disabled={isClearing}
                      className="w-full"
                    >
                      {isClearing ? 'Moviendo...' : 'Mover a despensa y limpiar'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleClearCheckedOnly}
                      disabled={isClearing}
                      className="w-full"
                    >
                      Solo limpiar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="default" className="flex-1">
                  Compra terminada
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>¿Compra terminada?</DialogTitle>
                  <DialogDescription>
                    Esto borrará toda la lista de compras. ¿Estás seguro?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Cancelar</Button>
                  <Button onClick={handleDoneShopping}>Sí, borrar todo</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </AppShell>
  );
}
