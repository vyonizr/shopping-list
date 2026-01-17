import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Item } from '../db/schema';
import { toast } from 'sonner';
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
import { Trash2, Edit2, Save, X, Upload, Search, ChevronDown, ChevronRight, Download, FolderX, FolderEdit } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { compressData, decompressData } from '@/utils/compression';

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | undefined>(undefined);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState('');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportedData, setExportedData] = useState('');
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [renameCategoryDialogOpen, setRenameCategoryDialogOpen] = useState(false);
  const [categoryToRename, setCategoryToRename] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

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
  const filteredItems = items.filter(item => {
    const query = searchQuery.toLowerCase().trim();
    return (
      item.name.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  });

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
    if (id !== undefined) {
      setItemToDelete(id);
      setDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (itemToDelete !== undefined) {
      await db.items.delete(itemToDelete);
      setDeleteDialogOpen(false);
      setItemToDelete(undefined);
      toast.success('Item deleted successfully');
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

  const handleExportDatabase = async () => {
    try {
      const allItems = await db.items.toArray();
      const exportData = {
        version: 'SHOPLIST_DB_V1',
        timestamp: Date.now(),
        itemCount: allItems.length,
        items: allItems.map(item => ({
          name: item.name,
          category: item.category,
          is_active: item.is_active,
          created_at: item.created_at
        }))
      };

      const jsonString = JSON.stringify(exportData);
      const compressed = await compressData(jsonString);
      const exportString = `SHOPLIST_DB_V1_GZIP:${compressed}`;

      setExportedData(exportString);
      setExportDialogOpen(true);
    } catch (error) {
      toast.error('Failed to export database');
      console.error('Export Error:', error);
    }
  };

  const handleCopyExport = () => {
    navigator.clipboard.writeText(exportedData).then(() => {
      toast.success('Database export copied to clipboard!');
      setExportDialogOpen(false);
      setExportedData('');
    });
  };

  const handleImportDatabase = () => {
    setImportData('');
    setImportDialogOpen(true);
  };

  const confirmImport = async () => {
    try {
      if (!importData.trim()) {
        toast.error('Please paste the export data');
        return;
      }

      // Parse the import string
      const [version, base64Data] = importData.trim().split(':');

      if (version !== 'SHOPLIST_DB_V1_GZIP') {
        toast.error('Invalid or unsupported export format');
        return;
      }

      // Decompress the data
      const jsonString = await decompressData(base64Data);
      const data = JSON.parse(jsonString);

      if (!data.items || !Array.isArray(data.items)) {
        toast.error('Invalid export data structure');
        return;
      }

      // Clear existing items
      await db.items.clear();

      // Import items
      let imported = 0;
      for (const item of data.items) {
        await db.items.add({
          name: item.name,
          category: item.category,
          is_active: item.is_active || false,
          created_at: item.created_at || Date.now()
        });
        imported++;
      }

      setImportDialogOpen(false);
      setImportData('');
      toast.success(`Successfully imported ${imported} items`);
    } catch (error) {
      toast.error('Failed to import database. Please check the data format.');
      console.error('Import Error:', error);
    }
  };

  const handleDeleteCategory = (category: string) => {
    setCategoryToDelete(category);
    setDeleteCategoryDialogOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    // Get all items in this category
    const itemsToDelete = items.filter(item => item.category === categoryToDelete);

    // Delete all items in the category
    await Promise.all(
      itemsToDelete.map(item => item.id ? db.items.delete(item.id) : Promise.resolve())
    );

    setDeleteCategoryDialogOpen(false);
    setCategoryToDelete(null);
    toast.success(`Category "${categoryToDelete}" and ${itemsToDelete.length} item${itemsToDelete.length !== 1 ? 's' : ''} deleted`);
  };

  const handleRenameCategory = (category: string) => {
    setCategoryToRename(category);
    setNewCategoryName(category);
    setRenameCategoryDialogOpen(true);
  };

  const confirmRenameCategory = async () => {
    if (!categoryToRename || !newCategoryName.trim()) return;

    const trimmedNewName = newCategoryName.trim();

    // Check if new name is same as old name
    if (trimmedNewName.toLowerCase() === categoryToRename.toLowerCase()) {
      setRenameCategoryDialogOpen(false);
      setCategoryToRename(null);
      setNewCategoryName('');
      return;
    }

    // Check if new category name already exists
    const existingCategory = categories.find(
      cat => cat.toLowerCase() === trimmedNewName.toLowerCase()
    );

    if (existingCategory) {
      toast.error(`Category "${trimmedNewName}" already exists`);
      return;
    }

    // Get all items in the category to rename
    const itemsToUpdate = items.filter(item => item.category === categoryToRename);

    // Update all items with new category name
    await Promise.all(
      itemsToUpdate.map(item =>
        item.id ? db.items.update(item.id, { category: trimmedNewName }) : Promise.resolve()
      )
    );

    setRenameCategoryDialogOpen(false);
    setCategoryToRename(null);
    setNewCategoryName('');
    toast.success(`Category renamed from "${categoryToRename}" to "${trimmedNewName}"`);
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 sm:pb-8">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-700">Everyday Items</h1>

        {/* Import/Export Buttons */}
        <nav className="flex gap-2 flex-wrap">
          <Button
            onClick={handleImportDatabase}
            variant="outline"
            className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
          >
            <Download className="mr-2 h-4 w-4" />
            Restore
          </Button>
          <Button
            onClick={handleExportDatabase}
            variant="outline"
            className="border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300"
          >
            <Upload className="mr-2 h-4 w-4" />
            Backup
          </Button>
        </nav>
      </header>

      {/* Add New Item Form */}
      <section className="mb-6 sm:mb-8">
        <form onSubmit={handleAddItem} className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Add New Item</h2>
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
          <Button type="submit" className="mt-6 w-full bg-blue-300 hover:bg-blue-400 text-blue-900">
            Add Item
          </Button>
        </form>
      </section>

      {/* Search Bar */}
      <section className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search items or categories..."
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
      </section>

      {/* Items List Grouped by Category */}
      <section className="space-y-4 sm:space-y-6">
        {Object.entries(itemsByCategory).sort().map(([category, categoryItems]) => {
          const isExpanded = expandedCategories.has(category);
          return (
            <article key={category} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <button
                onClick={() => toggleCategory(category)}
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
                      <h3 className="text-lg sm:text-xl font-semibold text-blue-700">{category}</h3>
                      <p className="text-sm text-blue-400">
                        {categoryItems.length} item{categoryItems.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRenameCategory(category);
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
                        handleDeleteCategory(category);
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    >
                      <FolderX className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </button>
              {isExpanded && (
                <ul className="divide-y divide-gray-50">
                  {categoryItems.map(item => (
                    <li
                      key={item.id}
                      className={`p-4 sm:p-5 transition-colors cursor-pointer ${
                        item.is_active ? 'bg-blue-50' : 'bg-white hover:bg-blue-50'
                      }`}
                      onClick={() => handleToggleActive(item.id, item.is_active, item.name)}
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
                            <Button onClick={handleSaveEdit} variant="default" className="flex-1 bg-green-400 hover:bg-green-500 text-white">
                              <Save className="mr-2 h-4 w-4" />
                              Save
                            </Button>
                            <Button onClick={handleCancelEdit} variant="secondary" className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700">
                              <X className="mr-2 h-4 w-4" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <div
                            className="flex items-start flex-1 min-w-0 pt-1"
                            onClick={() => handleToggleActive(item.id, item.is_active, item.name)}
                          >
                            <Checkbox
                              checked={item.is_active}
                              onCheckedChange={() => handleToggleActive(item.id, item.is_active, item.name)}
                              className="shrink-0 pointer-events-none"
                            />
                            <div className="ml-3 flex-1 min-w-0">
                              <span className="text-base sm:text-lg text-gray-700 block">{item.name}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <Button onClick={() => handleEdit(item)} variant="secondary" size="sm" className="bg-amber-100 hover:bg-amber-200 text-amber-700 border-0">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button onClick={() => handleDelete(item.id)} variant="destructive" size="sm" className="bg-rose-200 hover:bg-rose-300 text-rose-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </section>

      {items.length === 0 && (
        <section className="text-center py-16 sm:py-20">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-lg text-gray-500 mb-2">No items yet</p>
          <p className="text-sm text-gray-400">Add your first item above to get started!</p>
        </section>
      )}

      {items.length > 0 && filteredItems.length === 0 && (
        <section className="text-center py-16 sm:py-20">
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
        </section>
      )}

      {/* Export Dialog */}
      <AlertDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Backup Your Items</AlertDialogTitle>
            <AlertDialogDescription>
              Copy the text below to save all your items. You can restore this backup later on any device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <textarea
              value={exportedData}
              readOnly
              className="w-full h-32 p-3 border border-gray-300 rounded-lg font-mono text-sm bg-gray-50"
              onClick={(e) => e.currentTarget.select()}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setExportedData('')}>Close</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCopyExport}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              Copy to Clipboard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <AlertDialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Your Items</AlertDialogTitle>
            <AlertDialogDescription>
              Paste your backup text below. <strong className="text-red-600">Warning:</strong> This will replace all current items with the backup.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="Paste your backup code here..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setImportData('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmImport}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Restore Items
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Category Dialog */}
      <AlertDialog open={renameCategoryDialogOpen} onOpenChange={setRenameCategoryDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename Category</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a new name for the category <strong className="text-gray-900">"{categoryToRename}"</strong>.
              <br />
              All {itemsByCategory[categoryToRename || '']?.length || 0} item{itemsByCategory[categoryToRename || '']?.length !== 1 ? 's' : ''} will be moved to the new category.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Enter new category name"
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setCategoryToRename(null);
              setNewCategoryName('');
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRenameCategory}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Rename Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Category Dialog */}
      <AlertDialog open={deleteCategoryDialogOpen} onOpenChange={setDeleteCategoryDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the category <strong className="text-gray-900">"{categoryToDelete}"</strong>?
              <br /><br />
              <strong className="text-red-600">Warning:</strong> This will permanently delete all {itemsByCategory[categoryToDelete || '']?.length || 0} item{itemsByCategory[categoryToDelete || '']?.length !== 1 ? 's' : ''} in this category. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={confirmDeleteCategory}
              className="bg-rose-500 hover:bg-rose-600 text-white"
            >
              Delete Category & Items
            </AlertDialogAction>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-rose-500 hover:bg-rose-600 text-white"
            >
              Delete
            </AlertDialogAction>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
