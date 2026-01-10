import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ShoppingItem, ShoppingList } from '@/types/shopping';
import { getDespensaItemNames, isInDespensa } from '@/lib/despensa';

const DOC_PATH = 'shoppingList/current';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export async function getShoppingList(): Promise<ShoppingList> {
  const docRef = doc(db, DOC_PATH);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return { items: [], lastCleared: null };
  }

  const data = snapshot.data();
  return {
    items: data.items || [],
    lastCleared: data.lastCleared?.toDate() || null,
  };
}

export async function saveShoppingList(list: ShoppingList): Promise<void> {
  const docRef = doc(db, DOC_PATH);
  await setDoc(docRef, {
    items: list.items,
    lastCleared: list.lastCleared ? Timestamp.fromDate(list.lastCleared) : null,
  });
}

export async function addIngredientsToShoppingList(
  ingredientsText: string,
  recipeName: string,
  excludeDespensa: boolean = true
): Promise<{ added: number; skipped: number }> {
  const list = await getShoppingList();

  // Get despensa items if we need to filter
  const despensaItems = excludeDespensa ? await getDespensaItemNames() : [];

  // Parse ingredients - split by newlines or commas
  const ingredients = ingredientsText
    .split(/[\n,]/)
    .map((i) => i.trim())
    .filter((i) => i.length > 0);

  let added = 0;
  let skipped = 0;

  for (const ingredient of ingredients) {
    // Skip if in despensa
    if (excludeDespensa && isInDespensa(ingredient, despensaItems)) {
      skipped++;
      continue;
    }

    const normalizedIngredient = ingredient.toLowerCase();

    // Try to find existing similar item (simple substring match)
    const existingIndex = list.items.findIndex((item) => {
      const normalizedItem = item.text.toLowerCase();
      return (
        normalizedItem.includes(normalizedIngredient) ||
        normalizedIngredient.includes(normalizedItem)
      );
    });

    if (existingIndex >= 0) {
      // Add recipe reference if not already there
      if (!list.items[existingIndex].fromRecipes.includes(recipeName)) {
        list.items[existingIndex].fromRecipes.push(recipeName);
      }
    } else {
      // Add new item
      list.items.push({
        id: generateId(),
        text: ingredient,
        checked: false,
        fromRecipes: [recipeName],
      });
      added++;
    }
  }

  await saveShoppingList(list);
  return { added, skipped };
}

export async function addManualItem(text: string): Promise<void> {
  const list = await getShoppingList();
  list.items.push({
    id: generateId(),
    text: text.trim(),
    checked: false,
    fromRecipes: [],
  });
  await saveShoppingList(list);
}

export async function toggleItem(itemId: string): Promise<void> {
  const list = await getShoppingList();
  const item = list.items.find((i) => i.id === itemId);
  if (item) {
    item.checked = !item.checked;
    await saveShoppingList(list);
  }
}

export async function removeItem(itemId: string): Promise<void> {
  const list = await getShoppingList();
  list.items = list.items.filter((i) => i.id !== itemId);
  await saveShoppingList(list);
}

export async function clearCheckedItems(): Promise<void> {
  const list = await getShoppingList();
  list.items = list.items.filter((i) => !i.checked);
  await saveShoppingList(list);
}

export async function clearAllItems(): Promise<void> {
  await saveShoppingList({
    items: [],
    lastCleared: new Date(),
  });
}
