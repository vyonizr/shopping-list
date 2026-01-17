import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Item } from '../db/schema';

export default function ShoppingSession() {
  const [inCartIds, setInCartIds] = useState<Set<number>>(new Set());

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

  const handleToggleInCart = (id: number | undefined) => {
    if (!id) return;
    setInCartIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleClearCart = () => {
    if (confirm('Clear all items from cart?')) {
      setInCartIds(new Set());
    }
  };

  const handleCompleteSession = async () => {
    if (confirm('Complete shopping session? This will deselect all items.')) {
      // Deactivate all active items
      await Promise.all(
        activeItems.map(item => 
          item.id ? db.items.update(item.id, { is_active: false }) : Promise.resolve()
        )
      );
      setInCartIds(new Set());
    }
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
      alert('Shopping list copied to clipboard!');
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
      alert('Shopping list exported and copied to clipboard!');
    });
  };

  const itemsInCart = activeItems.filter(item => inCartIds.has(item.id!)).length;
  const totalItems = activeItems.length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Shopping Session</h1>
        <div className="flex items-center gap-2 text-sm sm:text-base">
          <div className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full font-medium">
            {itemsInCart} / {totalItems} in cart
          </div>
        </div>
      </div>

      {activeItems.length === 0 ? (
        <div className="bg-white p-8 sm:p-12 rounded-lg shadow-md text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <p className="text-lg text-gray-600 mb-4">No items selected for shopping.</p>
          <p className="text-sm text-gray-500 mb-6">
            Go to Everyday Items and select items to add them here.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Go to Everyday Items
          </a>
        </div>
      ) : (
        <>
          {/* Action Buttons */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={handleCopyToClipboard}
              className="px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
            >
              <span>📋</span>
              <span>Copy List</span>
            </button>
            <button
              onClick={handleExportBase64}
              className="px-4 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
            >
              <span>📤</span>
              <span>Export</span>
            </button>
            <button
              onClick={handleClearCart}
              className="px-4 py-3 bg-yellow-600 text-white font-medium rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
            >
              <span>🗑️</span>
              <span>Clear Cart</span>
            </button>
            <button
              onClick={handleCompleteSession}
              className="px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
            >
              <span>✓</span>
              <span>Complete</span>
            </button>
          </div>

          {/* Shopping List by Category */}
          <div className="space-y-4 sm:space-y-6">
            {Object.entries(itemsByCategory).sort().map(([category, categoryItems]) => (
              <div key={category} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gray-50 px-4 sm:px-6 py-3 border-b">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800">{category}</h3>
                  <p className="text-sm text-gray-500">
                    {categoryItems.filter(item => inCartIds.has(item.id!)).length} / {categoryItems.length} in cart
                  </p>
                </div>
                <div className="divide-y divide-gray-100">
                  {categoryItems.map(item => {
                    const isInCart = inCartIds.has(item.id!);
                    return (
                      <div
                        key={item.id}
                        className={`p-4 sm:p-5 transition-all ${ 
                          isInCart 
                            ? 'bg-gray-50' 
                            : 'bg-white hover:bg-blue-50'
                        }`}
                      >
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isInCart}
                            onChange={() => handleToggleInCart(item.id)}
                            className="h-6 w-6 text-green-600 rounded border-gray-300 focus:ring-green-500 flex-shrink-0 cursor-pointer mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <span className={`text-base sm:text-lg block transition-all ${
                              isInCart ? 'line-through text-gray-400' : 'text-gray-900'
                            }`}>
                              {item.name}
                            </span>
                            {isInCart && (
                              <span className="inline-block mt-1 text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                                ✓ In Cart
                              </span>
                            )}
                          </div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* WhatsApp Preview */}
          <div className="mt-6 sm:mt-8 bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
              <span>💬</span>
              <span>WhatsApp Preview (Remaining Items)</span>
            </h3>
            <pre className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm whitespace-pre-wrap font-sans overflow-x-auto">
              {generateWhatsAppText()}
            </pre>
          </div>
        </>
      )}
    </div>
  );
}
