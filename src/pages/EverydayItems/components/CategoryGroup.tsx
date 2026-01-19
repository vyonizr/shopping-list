import { type Item } from '@/db/schema';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, FolderEdit, FolderX } from 'lucide-react';
import ItemRow from './ItemRow';

interface CategoryGroupProps {
  category: string;
  items: Item[];
  isExpanded: boolean;
  categories: string[];
  onToggleCategory: (category: string) => void;
  onRenameCategory: (category: string) => void;
  onDeleteCategory: (category: string) => void;
  onToggleActive: (
    id: number | undefined,
    currentState: boolean,
    itemName: string
  ) => void;
  onDeleteItem: (id: number | undefined) => void;
  onUpdateItem: (id: number, name: string, category: string) => Promise<void>;
  isLoading: boolean;
}

export default function CategoryGroup({
  category,
  items,
  isExpanded,
  categories,
  onToggleCategory,
  onRenameCategory,
  onDeleteCategory,
  onToggleActive,
  onDeleteItem,
  onUpdateItem,
  isLoading,
}: CategoryGroupProps) {
  return (
    <article className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div
        onClick={() => onToggleCategory(category)}
        className="w-full bg-blue-50 px-4 sm:px-6 py-3 border-b border-blue-100 hover:bg-blue-100 transition-colors text-left cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-blue-500 shrink-0" />
            ) : (
              <ChevronRight className="h-5 w-5 text-blue-500 shrink-0" />
            )}
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-semibold text-blue-700">
                {category}
              </h3>
              <p className="text-sm text-blue-400">
                {items.length} item
                {items.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onRenameCategory(category);
              }}
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
            >
              <FolderEdit className="h-4 w-4" />
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteCategory(category);
              }}
              variant="ghost"
              size="sm"
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            >
              <FolderX className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      {isExpanded && (
        <ul className="divide-y divide-gray-50">
          {items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              categories={categories}
              onToggleActive={onToggleActive}
              onDelete={onDeleteItem}
              onUpdate={onUpdateItem}
              isLoading={isLoading}
            />
          ))}
        </ul>
      )}
    </article>
  );
}
