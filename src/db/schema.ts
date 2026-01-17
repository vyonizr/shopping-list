import Dexie, { type EntityTable } from 'dexie';

export interface Item {
  id?: number;
  name: string;
  category: string;
  is_active: boolean;
  created_at: number;
}

export interface Category {
  id?: number;
  name: string;
  created_at: number;
}

export interface SessionNote {
  id?: number;
  item_id: number;
  note: string;
  created_at: number;
}

const db = new Dexie('ShoppingListDB') as Dexie & {
  items: EntityTable<Item, 'id'>;
  categories: EntityTable<Category, 'id'>;
  sessionNotes: EntityTable<SessionNote, 'id'>;
};

db.version(1).stores({
  items: '++id, name, category, is_active, created_at',
  categories: '++id, name, created_at'
});

db.version(2).stores({
  sessionNotes: '++id, item_id, created_at'
});

export { db };
