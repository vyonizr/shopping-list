import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Item } from '../db/schema';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Clipboard, Download, Trash2, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';
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

export default function ShoppingSession() {
  const [inCartIds, setInCartIds] = useState<Set<number>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [clearCartDialogOpen, setClearCartDialogOpen] = useState(false);
  const [completeSessionDialogOpen, setCompleteSessionDialogOpen] = useState(false);

  // Query only active items (selected for shopping)
  const activeItems = useLiveQuery(async () => {
    const allItems = await db.items.toArray();
    return allItems.filter(item => item.is_active);
  }) || [];

  // Group active items by category
  const itemsByCategory = activeItems.reduce((acc, item) => {
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

  const handleToggleInCart = (id: number | undefined, itemName: string) => {
    if (!id) return;
    setInCartIds(prev => {
      const newSet = new Set(prev);
      const wasInCart = newSet.has(id);
      if (wasInCart) {
        newSet.delete(id);
        toast.info(`${itemName} removed from cart`);
      } else {
        newSet.add(id);
        toast.success(`${itemName} added to cart`);
      }
      return newSet;
    });
  };

  const handleClearCart = () => {
    setClearCartDialogOpen(true);
  };

  const confirmClearCart = () => {
    setInCartIds(new Set());
    setClearCartDialogOpen(false);
    toast.success('Cart cleared');
  };

  const handleCompleteSession = () => {
    setCompleteSessionDialogOpen(true);
  };

  const confirmCompleteSession = async () => {
    await Promise.all(
      activeItems.map(item => 
        item.id ? db.items.update(item.id, { is_active: false }) : Promise.resolve()
      )
    );
    setInCartIds(new Set());
    setCompleteSessionDialogOpen(false);
    toast.success('Shopping session completed');
  };

  const generateWhatsAppText = () => {
    const categorizedList = Object.entries(itemsByCategory)
      .sort()
      .map(([category, items]) => {
        const itemList = items
          .filter(item => !inCartIds.has(item.id!))
          .map(item => `• ${item.name}`)
          .join('\n');
        return itemList ? `*${category}*\n${itemList}` : '';
      })
      .filter(Boolean)
      .join('\n\n');

    return `🛒 Shopping List\n\n${categorizedList || 'All items collected!'}`;
  };

  const handleCopyToClipboard = () => {
    const text = generateWhatsAppText();
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Shopping list copied to clipboard!');
    });
  };

  const handleExportBase64 = () => {
    const exportData = {
      version: 'SHOPLIST_V1',
      timestamp: Date.now(),
      items: activeItems.map(item => ({
        name: item.name,
        category: item.category,
        inCart: inCartIds.has(item.id!)
      }))
    };
    
    const base64 = btoa(JSON.stringify(exportData));
    const exportString = `SHOPLIST_V1:${base64}`;
    
    navigator.clipboard.writeText(exportString).then(() => {
      toast.success('Shopping list exported and copied to clipboard!');
    });
  };

  const itemsInCart = activeItems.filter(item => inCartIds.has(item.id!)).length;
  const totalItems = activeItems.length;

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-700">Shopping Session</h1>
        <aside className="flex items-center gap-2 text-sm sm:text-base">
          <div className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-medium">
            {itemsInCart} / {totalItems} in cart
          </div>
        </aside>
      </header>

      {activeItems.length === 0 ? (
        <section className="bg-white p-8 sm:p-12 rounded-lg shadow-sm border border-gray-100 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <p className="text-lg text-gray-600 mb-4">No items selected for shopping.</p>
          <p className="text-sm text-gray-500 mb-6">
            Go to Everyday Items and select items to add them here.
          </p>
          <Button asChild>
            <Link to="/">
              Go to Everyday Items
            </Link>
          </Button>
        </section>
      ) : (
        <>
          {/* Action Buttons */}
          <nav className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button
              onClick={handleCopyToClipboard}
              variant="default"
              className="bg-green-400 hover:bg-green-500 text-white"
            >
              <Clipboard className="mr-2 h-4 w-4" />
              Copy List
            </Button>
            <Button
              onClick={handleExportBase64}
              variant="default"
              className="bg-purple-400 hover:bg-purple-500 text-white"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button
              onClick={handleClearCart}
              variant="default"
              className="bg-amber-300 hover:bg-amber-400 text-amber-800"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Cart
            </Button>
            <Button
              onClick={handleCompleteSession}
              variant="default"
              className="bg-blue-300 hover:bg-blue-400 text-blue-900"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete
            </Button>
          </nav>

          {/* Shopping List by Category */}
          <section className="space-y-4 sm:space-y-6">
            {Object.entries(itemsByCategory).sort().map(([category, categoryItems]) => {
              const isExpanded = expandedCategories.has(category);
              return (
                <article key={category} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full bg-blue-50 px-4 sm:px-6 py-3 border-b border-blue-100 hover:bg-blue-100 transition-colors text-left"
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
                            {categoryItems.filter(item => inCartIds.has(item.id!)).length} / {categoryItems.length} in cart
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                  {isExpanded && (
                    <ul className="divide-y divide-gray-50">
                      {categoryItems.map(item => {
                        const isInCart = inCartIds.has(item.id!);
                        return (
                          <li
                            key={item.id}
                            className={`p-4 sm:p-5 transition-all cursor-pointer ${ 
                              isInCart 
                                ? 'bg-gray-50' 
                                : 'bg-white hover:bg-blue-50'
                            }`}
                            onClick={() => handleToggleInCart(item.id, item.name)}
                          >
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={isInCart}
                                onCheckedChange={() => handleToggleInCart(item.id, item.name)}
                                className="shrink-0 mt-0.5 pointer-events-none"
                              />
                              <div className="flex-1 min-w-0">
                                <span className={`text-base sm:text-lg block transition-all ${
                                  isInCart ? 'line-through text-gray-400' : 'text-gray-700'
                                }`}>
                                  {item.name}
                                </span>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </article>
              );
            })}
          </section>

          {/* WhatsApp Preview */}
          <aside className="mt-6 sm:mt-8 bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-gray-700">
              <span>💬</span>
              <span>WhatsApp Preview (Remaining Items)</span>
            </h3>
            <pre className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm whitespace-pre-wrap font-sans overflow-x-auto text-gray-700">
              {generateWhatsAppText()}
            </pre>
          </aside>
        </>
      )}

      <AlertDialog open={clearCartDialogOpen} onOpenChange={setClearCartDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Cart</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all items from the cart? Items will remain selected for shopping.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClearCart}
              className="bg-amber-400 hover:bg-amber-500 text-amber-900"
            >
              Clear Cart
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={completeSessionDialogOpen} onOpenChange={setCompleteSessionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Shopping Session</AlertDialogTitle>
            <AlertDialogDescription>
              This will deselect all items and clear your shopping session. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCompleteSession}
              className="bg-blue-300 hover:bg-blue-400 text-blue-900"
            >
              Complete Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
