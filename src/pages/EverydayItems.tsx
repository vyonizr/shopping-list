import { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Item } from '../db/schema';
import { toast } from 'sonner';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Edit2, Save, X, Upload, Search, ChevronDown, ChevronRight } from 'lucide-react';

export default function EverydayItems() {
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editShowNewCategory, setEditShowNewCategory] = useState(false);
  const [editCustomCategory, setEditCustomCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Query all items from IndexedDB
  const items = useLiveQuery(() => db.items.toArray()) || [];

  // Get unique categories for dropdown
  const categories = useLiveQuery(async () => {
    const allItems = await db.items.toArray();
    const uniqueCategories = [...new Set(allItems.map(item => item.category))]
      .filter(Boolean)
      .sort();
    return uniqueCategories;
  }) || [];

  // Filter items based on search query
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  // Group items by category
  const itemsByCategory = filteredItems.reduce((acc, item) => {
    const category = item.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, Item[]>);

  // Initialize all categories as expanded on first render
  if (expandedCategories.size === 0 && Object.keys(itemsByCategory).length > 0) {
    setExpandedCategories(new Set(Object.keys(itemsByCategory)));
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const categoryToUse = showNewCategoryInput
      ? customCategory.trim() || 'Uncategorized'
      : newItemCategory || 'Uncategorized';

    // Check for duplicate
    const duplicate = await db.items
      .filter(item =>
        item.name.toLowerCase() === newItemName.trim().toLowerCase() &&
        item.category.toLowerCase() === categoryToUse.toLowerCase()
      )
      .first();

    if (duplicate) {
      toast.error(`Item "${newItemName.trim()}" already exists in category "${categoryToUse}"`);
      return;
    }

    await db.items.add({
      name: newItemName.trim(),
      category: categoryToUse,
      is_active: false,
      created_at: Date.now()
    });

    setNewItemName('');
    setNewItemCategory('');
    setCustomCategory('');
    setShowNewCategoryInput(false);
    toast.success(`Item "${newItemName.trim()}" added successfully`);
  };

  const handleToggleActive = async (id: number | undefined, currentState: boolean, itemName: string) => {
    if (id !== undefined) {
      await db.items.update(id, { is_active: !currentState });
      if (!currentState) {
        toast.success(`${itemName} selected for shopping`);
      } else {
        toast.info(`${itemName} removed from shopping list`);
      }
    }
  };

  const handleDelete = async (id: number | undefined) => {
    if (id !== undefined && confirm('Delete this item?')) {
      await db.items.delete(id);
    }
  };

  const handleEdit = (item: Item) => {
    if (item.id === undefined) return;
    setEditingId(item.id);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditShowNewCategory(false);
    setEditCustomCategory('');
  };

  const handleSaveEdit = async () => {
    if (editingId !== null && editName.trim()) {
      const categoryToUse = editShowNewCategory
        ? editCustomCategory.trim() || 'Uncategorized'
        : editCategory || 'Uncategorized';

      // Check for duplicate (excluding current item)
      const duplicate = await db.items
        .filter(item =>
          item.id !== editingId &&
          item.name.toLowerCase() === editName.trim().toLowerCase() &&
          item.category.toLowerCase() === categoryToUse.toLowerCase()
        )
        .first();

      if (duplicate) {
        toast.error(`Item "${editName.trim()}" already exists in category "${categoryToUse}"`);
        return;
      }

      await db.items.update(editingId, {
        name: editName.trim(),
        category: categoryToUse
      });
      setEditingId(null);
      setEditName('');
      setEditCategory('');
      setEditShowNewCategory(false);
      setEditCustomCategory('');
      toast.success('Item updated successfully');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditCategory('');
    setEditShowNewCategory(false);
    setEditCustomCategory('');
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const data = results.data as Array<{ 'Item name'?: string; 'Kategori'?: string }>;

          let imported = 0;
          let skipped = 0;

          for (const row of data) {
            const itemName = row['Item name']?.trim();
            const category = row['Kategori']?.trim();

            if (itemName && category) {
              await db.items.add({
                name: itemName,
                category: category,
                is_active: false,
                created_at: Date.now()
              });
              imported++;
            } else {
              skipped++;
            }
          }

          toast.success(`Imported ${imported} items${skipped > 0 ? ` (${skipped} skipped)` : ''}`);

          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } catch (error) {
          toast.error('Error importing CSV. Please check the file format.');
          console.error('CSV Import Error:', error);
        }
      },
      error: () => {
        toast.error('Failed to parse CSV file');
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Everyday Items</h1>

        {/* Import CSV Button */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleImportCSV}
            className="hidden"
            id="csv-upload"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
        </div>
      </div>

      {/* Add New Item Form */}
      <form onSubmit={handleAddItem} className="mb-6 sm:mb-8 bg-white p-4 sm:p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Add New Item</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-2">
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
            <Label htmlFor="itemCategory" className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </Label>
            {!showNewCategoryInput ? (
              <div className="space-y-2">
                <Select value={newItemCategory} onValueChange={(value) => {
                  if (value === '__new__') {
                    setShowNewCategoryInput(true);
                    setNewItemCategory('');
                  } else {
                    setNewItemCategory(value);
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                    <SelectItem value="__new__" className="font-semibold text-blue-600">
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
        <Button type="submit" className="mt-6 w-full sm:w-auto">
          Add Item
        </Button>
      </form>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-sm text-gray-500 mt-2">
            Found {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Items List Grouped by Category */}
      <div className="space-y-4 sm:space-y-6">
        {Object.entries(itemsByCategory).sort().map(([category, categoryItems]) => {
          const isExpanded = expandedCategories.has(category);
          return (
            <div key={category} className="bg-white rounded-lg shadow-md overflow-hidden">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full bg-gray-50 px-4 sm:px-6 py-3 border-b hover:bg-gray-100 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-600 shrink-0" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-600 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-800">{category}</h3>
                      <p className="text-sm text-gray-500">
                        {categoryItems.length} item{categoryItems.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
              {isExpanded && (
                <div className="divide-y divide-gray-100">
                  {categoryItems.map(item => (
                    <div
                      key={item.id}
                      className={`p-4 sm:p-5 transition-colors ${
                        item.is_active ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      {editingId === item.id ? (
                        <div className="space-y-3">
                          <Input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Item name"
                          />
                          {!editShowNewCategory ? (
                            <div className="space-y-2">
                              <Select value={editCategory} onValueChange={(value) => {
                                if (value === '__new__') {
                                  setEditShowNewCategory(true);
                                  setEditCategory('');
                                } else {
                                  setEditCategory(value);
                                }
                              }}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                  ))}
                                  <SelectItem value="__new__" className="font-semibold text-blue-600">
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
                            <Button onClick={handleSaveEdit} variant="default" className="flex-1 bg-green-600 hover:bg-green-700">
                              <Save className="mr-2 h-4 w-4" />
                              Save
                            </Button>
                            <Button onClick={handleCancelEdit} variant="secondary" className="flex-1">
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
                              onCheckedChange={() => handleToggleActive(item.id, item.is_active, item.name)}
                              className="shrink-0"
                            />
                            <div className="ml-3 flex-1 min-w-0">
                              <span className="text-base sm:text-lg text-gray-900 block">{item.name}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button onClick={() => handleEdit(item)} variant="secondary" size="sm">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button onClick={() => handleDelete(item.id)} variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="text-center py-16 sm:py-20">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-lg text-gray-500 mb-2">No items yet</p>
          <p className="text-sm text-gray-400">Add your first item above to get started!</p>
        </div>
      )}

      {items.length > 0 && filteredItems.length === 0 && (
        <div className="text-center py-16 sm:py-20">
          <div className="text-gray-400 mb-4">
            <Search className="mx-auto h-16 w-16" />
          </div>
          <p className="text-lg text-gray-500 mb-2">No items found</p>
          <p className="text-sm text-gray-400">Try a different search term</p>
          <Button
            onClick={() => setSearchQuery('')}
            variant="outline"
            className="mt-4"
          >
            Clear search
          </Button>
        </div>
      )}
    </div>
  );
}
