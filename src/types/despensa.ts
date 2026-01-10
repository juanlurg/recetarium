export interface DespensaItem {
  id: string;
  name: string;
  category: 'staple' | 'current';
  quantity?: string;
  addedAt: Date;
}

export interface Despensa {
  items: DespensaItem[];
}
