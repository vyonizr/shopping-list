import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Item } from '../db/schema';

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

  // Group items by category
  const itemsByCategory = items.reduce((acc, item) => {
    const category = item.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, Item[]>);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const categoryToUse = showNewCategoryInput 
      ? customCategory.trim() || 'Uncategorized'
      : newItemCategory || 'Uncategorized';

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
  };

  const handleToggleActive = async (id: number | undefined, currentState: boolean) => {
    if (id) {
      await db.items.update(id, { is_active: !currentState });
    }
  };

  const handleDelete = async (id: number | undefined) => {
    if (id && confirm('Delete this item?')) {
      await db.items.delete(id);
    }
  };

  const handleEdit = (item: Item) => {
    setEditingId(item.id!);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditShowNewCategory(false);
    setEditCustomCategory('');
  };

  const handleSaveEdit = async () => {
    if (editingId && editName.trim()) {
      const categoryToUse = editShowNewCategory
        ? editCustomCategory.trim() || 'Uncategorized'
        : editCategory || 'Uncategorized';

      await db.items.update(editingId, {
        name: editName.trim(),
        category: categoryToUse
      });
      setEditingId(null);
      setEditName('');
      setEditCategory('');
      setEditShowNewCategory(false);
      setEditCustomCategory('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditCategory('');
    setEditShowNewCategory(false);
    setEditCustomCategory('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Everyday Items</h1>

      {/* Add New Item Form */}
      <form onSubmit={handleAddItem} className="mb-6 sm:mb-8 bg-white p-4 sm:p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Add New Item</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-2">
              Item Name *
            </label>
            <input
              type="text"
              id="itemName"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Milk"
              required
            />
          </div>
          <div>
            <label htmlFor="itemCategory" className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            {!showNewCategoryInput ? (
              <div className="space-y-2">
                <select
                  id="itemCategory"
                  value={newItemCategory}
                  onChange={(e) => {
                    if (e.target.value === '__new__') {
                      setShowNewCategoryInput(true);
                      setNewItemCategory('');
                    } else {
                      setNewItemCategory(e.target.value);
                    }
                  }}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a category...</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="__new__" className="font-semibold text-blue-600">+ Add New Category</option>
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        <button
          type="submit"
          className="mt-6 w-full sm:w-auto px-8 py-3 bg-blue-600 text-white text-base font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Add Item
        </button>
      </form>

      {/* Items List Grouped by Category */}
      <div className="space-y-4 sm:space-y-6">
        {Object.entries(itemsByCategory).sort().map(([category, categoryItems]) => (
          <div key={category} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gray-50 px-4 sm:px-6 py-3 border-b">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">{category}</h3>
              <p className="text-sm text-gray-500">{categoryItems.length} item{categoryItems.length !== 1 ? 's' : ''}</p>
            </div>
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
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Item name"
                      />
                      {!editShowNewCategory ? (
                        <div className="space-y-2">
                          <select
                            value={editCategory}
                            onChange={(e) => {
                              if (e.target.value === '__new__') {
                                setEditShowNewCategory(true);
                                setEditCategory('');
                              } else {
                                setEditCategory(e.target.value);
                              }
                            }}
                            className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select category...</option>
                            {categories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                            <option value="__new__" className="font-semibold text-blue-600">+ Add New Category</option>
                          </select>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editCustomCategory}
                            onChange={(e) => setEditCustomCategory(e.target.value)}
                            className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        <button
                          onClick={handleSaveEdit}
                          className="flex-1 px-4 py-3 text-base font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex-1 px-4 py-3 text-base font-medium bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="flex items-start flex-1 min-w-0 pt-1">
                        <input
                          type="checkbox"
                          checked={item.is_active}
                          onChange={() => handleToggleActive(item.id, item.is_active)}
                          className="h-6 w-6 text-blue-600 rounded border-gray-300 focus:ring-blue-500 flex-shrink-0 cursor-pointer"
                        />
                        <div className="ml-3 flex-1 min-w-0">
                          <span className="text-base sm:text-lg text-gray-900 block">{item.name}</span>
                          {item.is_active && (
                            <span className="inline-block mt-1 text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                              ✓ Selected for shopping
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleEdit(item)}
                          className="px-4 py-2 text-sm font-medium bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
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
    </div>
  );
}
