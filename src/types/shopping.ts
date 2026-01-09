export interface ShoppingItem {
  id: string;
  text: string;
  checked: boolean;
  fromRecipes: string[];
}

export interface ShoppingList {
  items: ShoppingItem[];
  lastCleared: Date | null;
}
