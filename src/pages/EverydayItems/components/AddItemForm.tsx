import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface AddItemFormProps {
  categories: string[];
  onAddItem: (name: string, category: string) => Promise<void>;
  isLoading: boolean;
}

export default function AddItemForm({
  categories,
  onAddItem,
  isLoading,
}: AddItemFormProps) {
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || isLoading) return;

    const categoryToUse = showNewCategoryInput
      ? customCategory.trim() || 'Uncategorized'
      : newItemCategory || 'Uncategorized';

    await onAddItem(newItemName.trim(), categoryToUse);

    // Reset form
    setNewItemName('');
    setNewItemCategory('');
    setCustomCategory('');
    setShowNewCategoryInput(false);
  };

  return (
    <section className="mb-6 sm:mb-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100"
      >
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          Add New Item
        </h2>
        <div className="space-y-4">
          <div>
            <Label
              htmlFor="itemName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Item Name *
            </Label>
            <Input
              type="text"
              id="itemName"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="e.g., Milk"
              required
            />
          </div>
          <div>
            <Label
              htmlFor="itemCategory"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Category *
            </Label>
            {!showNewCategoryInput ? (
              <div className="space-y-2">
                <Select
                  value={newItemCategory}
                  onValueChange={(value) => {
                    if (value === '__new__') {
                      setShowNewCategoryInput(true);
                      setNewItemCategory('');
                    } else {
                      setNewItemCategory(value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category..." />
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
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter new category name"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowNewCategoryInput(false);
                    setCustomCategory('');
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  ← Back to existing categories
                </button>
              </div>
            )}
          </div>
        </div>
        <Button
          type="submit"
          className="mt-6 w-full bg-blue-300 hover:bg-blue-400 text-blue-900"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Item
        </Button>
      </form>
    </section>
  );
}
