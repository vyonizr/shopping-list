import { useState } from 'react';
import { type Item } from '@/db/schema';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Edit2, Save, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ItemRowProps {
  item: Item;
  categories: string[];
  onToggleActive: (
    id: number | undefined,
    currentState: boolean,
    itemName: string
  ) => void;
  onDelete: (id: number | undefined) => void;
  onUpdate: (id: number, name: string, category: string) => Promise<void>;
  isLoading: boolean;
}

export default function ItemRow({
  item,
  categories,
  onToggleActive,
  onDelete,
  onUpdate,
  isLoading,
}: ItemRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editCategory, setEditCategory] = useState(item.category);
  const [editShowNewCategory, setEditShowNewCategory] = useState(false);
  const [editCustomCategory, setEditCustomCategory] = useState('');

  const handleEdit = () => {
    setIsEditing(true);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditShowNewCategory(false);
    setEditCustomCategory('');
  };

  const handleSave = async () => {
    if (!editName.trim() || !item.id || isLoading) return;

    const categoryToUse = editShowNewCategory
      ? editCustomCategory.trim() || 'Uncategorized'
      : editCategory || 'Uncategorized';

    await onUpdate(item.id, editName.trim(), categoryToUse);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditShowNewCategory(false);
    setEditCustomCategory('');
  };

  return (
    <li
      className={cn(
        'p-4 sm:p-5 transition-colors cursor-pointer',
        item.is_active ? 'bg-blue-50' : 'bg-white hover:bg-blue-50'
      )}
      onClick={() =>
        !isEditing && onToggleActive(item.id, item.is_active, item.name)
      }
    >
      {isEditing ? (
        <div className="space-y-3">
          <Input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Item name"
          />
          {!editShowNewCategory ? (
            <div className="space-y-2">
              <Select
                value={editCategory}
                onValueChange={(value) => {
                  if (value === '__new__') {
                    setEditShowNewCategory(true);
                    setEditCategory('');
                  } else {
                    setEditCategory(value);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                  <SelectItem
                    value="__new__"
                    className="font-semibold text-blue-600"
                  >
                    + Add New Category
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                type="text"
                value={editCustomCategory}
                onChange={(e) => setEditCustomCategory(e.target.value)}
                placeholder="Enter new category"
              />
              <button
                type="button"
                onClick={() => {
                  setEditShowNewCategory(false);
                  setEditCustomCategory('');
                }}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                ← Back to existing categories
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              variant="default"
              className="flex-1 bg-green-400 hover:bg-green-500 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
            <Button
              onClick={handleCancel}
              variant="secondary"
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <div className="flex items-start flex-1 min-w-0 pt-1">
            <Checkbox
              checked={item.is_active}
              className="shrink-0 pointer-events-none"
            />
            <div className="ml-3 flex-1 min-w-0">
              <span className="text-base sm:text-lg text-gray-700 block">
                {item.name}
              </span>
            </div>
          </div>
          <div
            className="flex gap-2 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              onClick={handleEdit}
              variant="secondary"
              size="sm"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-0"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => onDelete(item.id)}
              variant="destructive"
              size="sm"
              className="bg-rose-200 hover:bg-rose-300 text-rose-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
