import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Item } from '../../db/schema';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { compressData, decompressData } from '@/utils/compression';
import EmptyList from '@/components/modules/EmptyList';
import SearchBar from '@/components/modules/SearchBar';
import SelectAllButton from './components/SelectAllButton';
import { generateCSVTemplate, parseCSV, downloadFile } from '@/utils/csv';
import PageHeader from './components/PageHeader';
import AddItemForm from './components/AddItemForm';
import CategoryGroup from './components/CategoryGroup';
import { ExportDialog, ImportDialog } from './components/BackupDialogs';
import DevelopmentWarning from '@/components/modules/DevelopmentWarning';
import BackToTop from '@/components/modules/BackToTop';
import {
  DeleteItemDialog,
  DeleteAllDialog,
  DeleteCategoryDialog,
} from './components/DeleteDialogs';
import { RenameCategoryDialog } from './components/RenameCategoryDialog';
import { ImportCSVDialog } from './components/ImportCSVDialog';
import ClearAllButton from './components/ClearAllButton';
import Loading from './components/Loading';
import {
  DEFAULT_CATEGORY,
  EXPORT_VERSION,
  TOAST_MESSAGES,
  CSV_TEMPLATE_FILENAME,
} from '@/lib/constants';

export default function EverydayItems() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [hasInitializedCategories, setHasInitializedCategories] =
    useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | undefined>(
    undefined
  );
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState('');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportedData, setExportedData] = useState('');
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] =
    useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [renameCategoryDialogOpen, setRenameCategoryDialogOpen] =
    useState(false);
  const [categoryToRename, setCategoryToRename] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBulkOperationLoading, setIsBulkOperationLoading] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [importCSVDialogOpen, setImportCSVDialogOpen] = useState(false);
  const [csvFile, setCSVFile] = useState<File | null>(null);

  // Query all items from IndexedDB
  const items = useLiveQuery(() => db.items.toArray()) || [];

  // Get unique categories for dropdown
  const categoriesQuery = useLiveQuery(async () => {
    const allItems = await db.items.toArray();
    const uniqueCategories = [...new Set(allItems.map((item) => item.category))]
      .filter(Boolean)
      .sort();
    return uniqueCategories;
  });

  const categories = useMemo(() => categoriesQuery || [], [categoriesQuery]);

  // Check if queries are still loading
  const isQueryLoading = items === undefined || categoriesQuery === undefined;

  // Initialize all categories as expanded on first render
  useEffect(() => {
    if (!hasInitializedCategories && categories.length > 0) {
      setExpandedCategories(new Set(categories));
      setHasInitializedCategories(true);
    }
  }, [categories, hasInitializedCategories]);

  // Filter items based on search query
  const filteredItems = items.filter((item) => {
    const query = searchQuery.toLowerCase().trim();
    return (
      item.name.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  });

  // Group items by category
  const itemsByCategory = filteredItems.reduce(
    (acc, item) => {
      const category = item.category || DEFAULT_CATEGORY;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    },
    {} as Record<string, Item[]>
  );

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const handleAddItem = async (name: string, category: string) => {
    setIsLoading(true);
    try {
      // Check for duplicate
      const duplicate = await db.items
        .filter(
          (item) =>
            item.name.toLowerCase() === name.toLowerCase() &&
            item.category.toLowerCase() === category.toLowerCase()
        )
        .first();

      if (duplicate) {
        toast.error(`Item "${name}" already exists in category "${category}"`);
        return;
      }

      await db.items.add({
        name: name,
        category: category,
        is_active: false,
        created_at: Date.now(),
      });

      toast.success(`Item "${name}" added successfully`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (
    id: number | undefined,
    currentState: boolean,
    itemName: string
  ) => {
    if (id !== undefined) {
      try {
        await db.items.update(id, { is_active: !currentState });
        // Toast notifications moved after DB update to prevent blocking
        setTimeout(() => {
          if (!currentState) {
            toast.success(`${itemName} selected for shopping`);
          } else {
            toast.info(`${itemName} removed from shopping list`);
          }
        }, 0);
      } catch (error) {
        toast.error(TOAST_MESSAGES.ITEM_FAILED_UPDATE);
        console.error('Toggle Active Error:', error);
      }
    }
  };

  const handleUpdateItem = async (
    id: number,
    name: string,
    category: string
  ) => {
    setIsLoading(true);
    try {
      // Check for duplicate (excluding current item)
      const duplicate = await db.items
        .filter(
          (item) =>
            item.id !== id &&
            item.name.toLowerCase() === name.toLowerCase() &&
            item.category.toLowerCase() === category.toLowerCase()
        )
        .first();

      if (duplicate) {
        toast.error(`Item "${name}" already exists in category "${category}"`);
        return;
      }

      await db.items.update(id, {
        name: name,
        category: category,
      });
      toast.success(TOAST_MESSAGES.ITEM_UPDATED);
    } finally {
      setIsLoading(false);
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
      setIsLoading(true);
      try {
        await db.items.delete(itemToDelete);
        setDeleteDialogOpen(false);
        setItemToDelete(undefined);
        toast.success(TOAST_MESSAGES.ITEM_DELETED);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleExportDatabase = async () => {
    try {
      const allItems = await db.items.toArray();
      const exportData = {
        version: EXPORT_VERSION,
        timestamp: Date.now(),
        itemCount: allItems.length,
        items: allItems.map((item) => ({
          name: item.name,
          category: item.category,
          is_active: item.is_active,
          created_at: item.created_at,
        })),
      };

      const jsonString = JSON.stringify(exportData);
      const compressed = await compressData(jsonString);
      const exportString = `${EXPORT_VERSION}:${compressed}`;

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
    setIsBulkOperationLoading(true);
    try {
      if (!importData.trim()) {
        toast.error('Please paste the export data');
        return;
      }

      // Parse the import string
      const [version, base64Data] = importData.trim().split(':');

      if (version !== EXPORT_VERSION) {
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
          created_at: item.created_at || Date.now(),
        });
        imported++;
      }

      setImportDialogOpen(false);
      setImportData('');
      toast.success(`Successfully imported ${imported} items`);
    } catch (error) {
      toast.error(TOAST_MESSAGES.FAILED_IMPORT_DATABASE);
      console.error('Import Error:', error);
    } finally {
      setIsBulkOperationLoading(false);
    }
  };

  const handleDeleteCategory = (category: string) => {
    setCategoryToDelete(category);
    setDeleteCategoryDialogOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    setIsLoading(true);
    try {
      // Get all items in this category
      const itemsToDelete = items.filter(
        (item) => item.category === categoryToDelete
      );

      // Delete all items in the category
      await Promise.all(
        itemsToDelete.map((item) =>
          item.id ? db.items.delete(item.id) : Promise.resolve()
        )
      );

      setDeleteCategoryDialogOpen(false);
      setCategoryToDelete(null);
      toast.success(
        `Category "${categoryToDelete}" and ${itemsToDelete.length} item${itemsToDelete.length !== 1 ? 's' : ''} deleted`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameCategory = (category: string) => {
    setCategoryToRename(category);
    setNewCategoryName(category);
    setRenameCategoryDialogOpen(true);
  };

  const confirmRenameCategory = async () => {
    if (!categoryToRename || !newCategoryName.trim() || isLoading) return;

    setIsBulkOperationLoading(true);
    try {
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
        (category) => category.toLowerCase() === trimmedNewName.toLowerCase()
      );

      if (existingCategory) {
        toast.error(`Category "${trimmedNewName}" already exists`);
        return;
      }

      // Get all items in the category to rename
      const itemsToUpdate = items.filter(
        (item) => item.category === categoryToRename
      );

      // Update all items with new category name
      await Promise.all(
        itemsToUpdate.map((item) =>
          item.id
            ? db.items.update(item.id, { category: trimmedNewName })
            : Promise.resolve()
        )
      );

      setRenameCategoryDialogOpen(false);
      setCategoryToRename(null);
      setNewCategoryName('');
      toast.success(
        `Category renamed from "${categoryToRename}" to "${trimmedNewName}"`
      );
    } finally {
      setIsBulkOperationLoading(false);
    }
  };

  const handleSelectAll = async () => {
    setIsBulkOperationLoading(true);
    try {
      const itemsToSelect = filteredItems.filter((item) => !item.is_active);
      await Promise.all(
        itemsToSelect.map((item) =>
          item.id
            ? db.items.update(item.id, { is_active: true })
            : Promise.resolve()
        )
      );
      toast.success(`${itemsToSelect.length} items selected`);
    } finally {
      setIsBulkOperationLoading(false);
    }
  };

  const handleClearAll = async () => {
    setIsBulkOperationLoading(true);
    try {
      const itemsToClear = filteredItems.filter((item) => item.is_active);
      await Promise.all(
        itemsToClear.map((item) =>
          item.id
            ? db.items.update(item.id, { is_active: false })
            : Promise.resolve()
        )
      );
      toast.info(`${itemsToClear.length} items removed from shopping list`);
    } finally {
      setIsBulkOperationLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    setIsLoading(true);
    try {
      const itemCount = items.length;
      await db.items.clear();
      setDeleteAllDialogOpen(false);
      toast.success(`All ${itemCount} items deleted successfully`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = generateCSVTemplate();
    downloadFile(template, CSV_TEMPLATE_FILENAME);
    toast.success('CSV template downloaded');
  };

  const handleImportCSV = () => {
    setCSVFile(null);
    setImportCSVDialogOpen(true);
  };

  const handleCSVFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast.error(TOAST_MESSAGES.PLEASE_SELECT_CSV_FILE);
        return;
      }
      setCSVFile(file);
    }
  };

  const confirmImportCSV = async () => {
    if (!csvFile) {
      toast.error(TOAST_MESSAGES.PLEASE_SELECT_CSV_FILE);
      return;
    }

    setIsBulkOperationLoading(true);
    try {
      // Read file content
      const csvText = await csvFile.text();

      // Parse CSV
      const parsedItems = parseCSV(csvText);

      // Import items (add to existing, don't clear)
      let imported = 0;
      let skipped = 0;

      for (const item of parsedItems) {
        // Check for duplicate
        const duplicate = await db.items
          .filter(
            (dbItem) =>
              dbItem.name.toLowerCase() === item.name.toLowerCase() &&
              dbItem.category.toLowerCase() === item.category.toLowerCase()
          )
          .first();

        if (duplicate) {
          skipped++;
          continue;
        }

        await db.items.add({
          name: item.name,
          category: item.category,
          is_active: false,
          created_at: Date.now(),
        });
        imported++;
      }

      setImportCSVDialogOpen(false);
      setCSVFile(null);

      if (imported > 0) {
        toast.success(
          `Successfully imported ${imported} item${imported !== 1 ? 's' : ''}` +
            (skipped > 0
              ? ` (${skipped} duplicate${skipped !== 1 ? 's' : ''} skipped)`
              : '')
        );
      } else if (skipped > 0) {
        toast.info(`All ${skipped} items already exist (duplicates skipped)`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to import CSV';
      toast.error(errorMessage);
      console.error('CSV Import Error:', error);
    } finally {
      setIsBulkOperationLoading(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 sm:pb-8">
      <PageHeader
        onDeleteAll={() => setDeleteAllDialogOpen(true)}
        onDownloadTemplate={handleDownloadTemplate}
        onImportCSV={handleImportCSV}
        onImportDatabase={handleImportDatabase}
        onExportDatabase={handleExportDatabase}
      />

      {/* Development Warning */}
      <DevelopmentWarning />

      {/* Add New Item Form */}
      <AddItemForm
        categories={categories}
        onAddItem={handleAddItem}
        isLoading={isLoading}
      />

      {/* Search Bar */}
      <section className="mb-6">
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        {searchQuery && (
          <p className="text-sm text-gray-500 mt-2">
            Found {filteredItems.length} item
            {filteredItems.length !== 1 ? 's' : ''}
          </p>
        )}
      </section>

      {/* Loading State */}
      {isQueryLoading ? (
        <Loading text={'Loading your items...'} />
      ) : (
        <>
          {/* Bulk Selection Controls */}
          {filteredItems.length > 0 && (
            <div className="flex gap-2 mb-4">
              <SelectAllButton
                onClick={handleSelectAll}
                isLoading={isBulkOperationLoading}
              />
              <ClearAllButton
                handleClearAll={handleClearAll}
                isBulkOperationLoading={isBulkOperationLoading}
              />
            </div>
          )}

          {/* Bulk Operation Loading Overlay */}
          {isBulkOperationLoading ? (
            <Loading text={'Updating items...'} />
          ) : (
            <>
              {/* Items List Grouped by Category */}
              <section className="space-y-4 sm:space-y-6">
                {Object.entries(itemsByCategory)
                  .sort()
                  .map(([category, categoryItems]) => (
                    <CategoryGroup
                      key={category}
                      category={category}
                      items={categoryItems}
                      isExpanded={expandedCategories.has(category)}
                      categories={categories}
                      onToggleCategory={toggleCategory}
                      onRenameCategory={handleRenameCategory}
                      onDeleteCategory={handleDeleteCategory}
                      onToggleActive={handleToggleActive}
                      onDeleteItem={handleDelete}
                      onUpdateItem={handleUpdateItem}
                      isLoading={isLoading}
                    />
                  ))}
              </section>

              {items.length === 0 && <EmptyList />}

              {items.length > 0 && filteredItems.length === 0 && (
                <section className="text-center py-16 sm:py-20">
                  <div className="text-gray-400 mb-4">
                    <Search className="mx-auto h-16 w-16" />
                  </div>
                  <p className="text-lg text-gray-500 mb-2">No items found</p>
                  <p className="text-sm text-gray-400">
                    Try a different search term
                  </p>
                  <Button
                    onClick={() => setSearchQuery('')}
                    variant="outline"
                    className="mt-4"
                  >
                    Clear search
                  </Button>
                </section>
              )}
            </>
          )}
        </>
      )}

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        exportedData={exportedData}
        onCopy={handleCopyExport}
        onClose={() => setExportedData('')}
      />

      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        importData={importData}
        onImportDataChange={setImportData}
        onConfirm={confirmImport}
        onCancel={() => setImportData('')}
        isLoading={isBulkOperationLoading}
      />

      <RenameCategoryDialog
        open={renameCategoryDialogOpen}
        onOpenChange={setRenameCategoryDialogOpen}
        onConfirm={confirmRenameCategory}
        categoryName={categoryToRename}
        newCategoryName={newCategoryName}
        onNewCategoryNameChange={setNewCategoryName}
        itemCount={itemsByCategory[categoryToRename || '']?.length || 0}
        isLoading={isBulkOperationLoading}
      />

      <DeleteCategoryDialog
        open={deleteCategoryDialogOpen}
        onOpenChange={setDeleteCategoryDialogOpen}
        onConfirm={confirmDeleteCategory}
        categoryName={categoryToDelete}
        itemCount={itemsByCategory[categoryToDelete || '']?.length || 0}
        isLoading={isLoading}
      />

      <DeleteItemDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        isLoading={isLoading}
      />

      <DeleteAllDialog
        open={deleteAllDialogOpen}
        onOpenChange={setDeleteAllDialogOpen}
        onConfirm={handleDeleteAll}
        itemCount={items.length}
        isLoading={isLoading}
      />

      <ImportCSVDialog
        open={importCSVDialogOpen}
        onOpenChange={setImportCSVDialogOpen}
        csvFile={csvFile}
        onFileChange={handleCSVFileChange}
        onConfirm={confirmImportCSV}
        onCancel={() => setCSVFile(null)}
        isLoading={isBulkOperationLoading}
      />

      <BackToTop />
    </main>
  );
}
