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

const db = new Dexie('ShoppingListDB') as Dexie & {
  items: EntityTable<Item, 'id'>;
  categories: EntityTable<Category, 'id'>;
};

db.version(1).stores({
  items: '++id, name, category, is_active, created_at',
  categories: '++id, name, created_at'
});

export { db };
