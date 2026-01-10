import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DespensaItem, Despensa } from '@/types/despensa';

const DOC_PATH = 'despensa/current';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export async function getDespensa(): Promise<Despensa> {
  const docRef = doc(db, DOC_PATH);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return { items: [] };
  }

  const data = snapshot.data();
  return {
    items: (data.items || []).map((item: Record<string, unknown>) => ({
      ...item,
      addedAt: (item.addedAt as Timestamp).toDate(),
    })),
  };
}

export async function saveDespensa(despensa: Despensa): Promise<void> {
  const docRef = doc(db, DOC_PATH);
  await setDoc(docRef, {
    items: despensa.items.map((item) => ({
      ...item,
      addedAt: Timestamp.fromDate(item.addedAt),
    })),
  });
}

export async function addDespensaItem(
  name: string,
  category: 'staple' | 'current',
  quantity?: string
): Promise<void> {
  const despensa = await getDespensa();

  // Check for duplicate
  const exists = despensa.items.some(
    (item) => item.name.toLowerCase() === name.toLowerCase()
  );
  if (exists) return;

  despensa.items.push({
    id: generateId(),
    name: name.trim(),
    category,
    quantity,
    addedAt: new Date(),
  });

  await saveDespensa(despensa);
}

export async function removeDespensaItem(itemId: string): Promise<void> {
  const despensa = await getDespensa();
  despensa.items = despensa.items.filter((i) => i.id !== itemId);
  await saveDespensa(despensa);
}

export async function updateDespensaItemCategory(
  itemId: string,
  category: 'staple' | 'current'
): Promise<void> {
  const despensa = await getDespensa();
  const item = despensa.items.find((i) => i.id === itemId);
  if (item) {
    item.category = category;
    await saveDespensa(despensa);
  }
}

export async function moveShoppingItemToDespensa(
  itemName: string
): Promise<void> {
  await addDespensaItem(itemName, 'current');
}

export async function getDespensaItemNames(): Promise<string[]> {
  const despensa = await getDespensa();
  return despensa.items.map((item) => item.name.toLowerCase());
}

export function isInDespensa(itemName: string, despensaItems: string[]): boolean {
  const normalizedName = itemName.toLowerCase().trim();
  return despensaItems.some((despensaItem) => {
    return (
      despensaItem.includes(normalizedName) ||
      normalizedName.includes(despensaItem)
    );
  });
}
