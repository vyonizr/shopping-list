import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Item } from '../db/schema';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Clipboard, CheckCircle, ChevronDown, ChevronRight, Plus, Save, X, Pencil, Loader2 } from 'lucide-react';
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
  const [completeSessionDialogOpen, setCompleteSessionDialogOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [tempNote, setTempNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Query only active items (selected for shopping)
  const activeItems = useLiveQuery(async () => {
    const allItems = await db.items.toArray();
    return allItems.filter(item => item.is_active);
  }) || [];

  // Query session notes
  const sessionNotes = useLiveQuery(async () => {
    const notes = await db.sessionNotes.toArray();
    const notesMap = new Map<number, string>();
    notes.forEach(note => {
      notesMap.set(note.item_id, note.note);
    });
    return notesMap;
  }) || new Map<number, string>();

  // Check if queries are still loading
  const isQueryLoading = activeItems === undefined || sessionNotes === undefined;

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
  useEffect(() => {
    if (expandedCategories.size === 0 && Object.keys(itemsByCategory).length > 0) {
      setExpandedCategories(new Set(Object.keys(itemsByCategory)));
    }
  }, [itemsByCategory, expandedCategories.size]);

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
    
    const wasInCart = inCartIds.has(id);
    
    // Update state immediately for instant UI feedback
    setInCartIds(prev => {
      const newSet = new Set(prev);
      if (wasInCart) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
    
    // Show toast asynchronously to prevent blocking
    setTimeout(() => {
      if (wasInCart) {
        toast.info(`${itemName} removed from cart`);
      } else {
        toast.success(`${itemName} added to cart`);
      }
    }, 0);
  };

  const handleCompleteSession = () => {
    setCompleteSessionDialogOpen(true);
  };

  const confirmCompleteSession = async () => {
    setIsLoading(true);
    try {
      await Promise.all(
        activeItems.map(item =>
          item.id ? db.items.update(item.id, { is_active: false }) : Promise.resolve()
        )
      );
      await db.sessionNotes.clear();
      setInCartIds(new Set());
      setCompleteSessionDialogOpen(false);
      toast.success('Shopping session completed');
    } finally {
      setIsLoading(false);
    }
  };

  const generateWhatsAppText = () => {
    const categorizedList = Object.entries(itemsByCategory)
      .sort()
      .map(([category, items]) => {
        const itemList = items
          .filter(item => !inCartIds.has(item.id!))
          .map(item => {
            const note = sessionNotes.get(item.id!);
            return note ? `• ${item.name} (${note})` : `• ${item.name}`;
          })
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

  const itemsInCart = activeItems.filter(item => inCartIds.has(item.id!)).length;
  const totalItems = activeItems.length;

  const handleAddNote = async (id: number | undefined) => {
    if (!id) return;
    setEditingNoteId(id);
    setTempNote(sessionNotes.get(id) || '');
  };

  const handleSaveNote = async (id: number | undefined) => {
    if (!id || isLoading) return;

    setIsLoading(true);
    try {
      if (tempNote.trim()) {
        // Check if note already exists
        const existingNote = await db.sessionNotes.where('item_id').equals(id).first();

        if (existingNote) {
          // Update existing note
          await db.sessionNotes.update(existingNote.id!, { note: tempNote.trim() });
        } else {
          // Add new note
          await db.sessionNotes.add({
            item_id: id,
            note: tempNote.trim(),
            created_at: new Date().getTime()
          });
        }
        toast.success('Note saved');
      } else {
        // Delete note if empty
        const existingNote = await db.sessionNotes.where('item_id').equals(id).first();
        if (existingNote) {
          await db.sessionNotes.delete(existingNote.id!);
          toast.info('Note removed');
        }
      }

      setEditingNoteId(null);
      setTempNote('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelNote = () => {
    setEditingNoteId(null);
    setTempNote('');
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 sm:pb-8">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-700">Shopping Session</h1>
        <aside className="flex items-center gap-2 text-sm sm:text-base">
          <div className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-medium">
            {itemsInCart} / {totalItems} in cart
          </div>
        </aside>
      </header>

      {isQueryLoading ? (
        <section className="text-center py-16 sm:py-20">
          <Loader2 className="mx-auto h-16 w-16 text-gray-400 animate-spin mb-4" />
          <p className="text-lg text-gray-500">Loading shopping list...</p>
        </section>
      ) : activeItems.length === 0 ? (
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
          <nav className="mb-6">
            <Button
              onClick={handleCompleteSession}
              variant="default"
              className="w-full bg-blue-300 hover:bg-blue-400 text-blue-900"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete Session
            </Button>
          </nav>

          {/* Shopping List by Category */}
          <section className="space-y-4 sm:space-y-6">
            {Object.entries(itemsByCategory).sort().map(([category, categoryItems]) => {
              const isExpanded = expandedCategories.has(category);
              return (
                <article key={category} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                  <div
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
                  </div>
                  {isExpanded && (
                    <ul className="divide-y divide-gray-50">
                      {categoryItems.map(item => {
                        const isInCart = inCartIds.has(item.id!);
                        const sessionNote = sessionNotes.get(item.id!);
                        const isEditingNote = editingNoteId === item.id;

                        return (
                          <li
                            key={item.id}
                            className={`p-4 sm:p-5 transition-all ${
                              isInCart
                                ? 'bg-gray-50'
                                : 'bg-white hover:bg-blue-50'
                            }`}
                          >
                            {isEditingNote ? (
                              <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                                <Input
                                  type="text"
                                  value={tempNote}
                                  onChange={(e) => setTempNote(e.target.value)}
                                  placeholder="Add a shopping note..."
                                  className="text-sm"
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleSaveNote(item.id)}
                                    size="sm"
                                    className="bg-green-400 hover:bg-green-500 text-white"
                                    disabled={isLoading}
                                  >
                                    {isLoading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Save className="mr-1 h-3 w-3" />}
                                    Save
                                  </Button>
                                  <Button
                                    onClick={handleCancelNote}
                                    size="sm"
                                    variant="secondary"
                                    className="bg-gray-100 hover:bg-gray-200"
                                  >
                                    <X className="mr-1 h-3 w-3" />
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={isInCart}
                                  onCheckedChange={() => handleToggleInCart(item.id, item.name)}
                                  className="shrink-0 mt-0.5"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div className="flex-1 min-w-0 cursor-pointer">
                                  <span className={`text-base sm:text-lg block transition-all ${
                                    isInCart ? 'line-through text-gray-400' : 'text-gray-700'
                                  }`}>
                                    {item.name}
                                  </span>
                                  {sessionNote && (
                                    <div className="mt-1.5 flex items-start gap-1">
                                      <span className="text-xs text-gray-400">📝</span>
                                      <span className={`text-sm transition-all ${
                                        isInCart ? 'line-through text-gray-400' : 'text-gray-500'
                                      }`}>
                                        {sessionNote}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    onClick={() => handleAddNote(item.id)}
                                    variant="secondary"
                                    size="sm"
                                    className={`${
                                      sessionNote
                                        ? 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                    } border-0`}
                                  >
                                    {sessionNote ? (
                                      <>
                                        <Pencil className="mr-1 h-3 w-3" />
                                        <span className="hidden sm:inline">Edit Note</span>
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="mr-1 h-3 w-3" />
                                        <span className="hidden sm:inline">Add Note</span>
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </article>
              );
            })}
          </section>

          {/* Shopping List Preview */}
          <aside className="mt-6 sm:mt-8 bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-700">
                <span>📋</span>
                <span>Remaining Items</span>
              </h3>
              <Button
                onClick={handleCopyToClipboard}
                variant="default"
                size="sm"
                className="bg-green-400 hover:bg-green-500 text-white"
              >
                <Clipboard className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </div>
            <pre className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm whitespace-pre-wrap font-sans overflow-x-auto text-gray-700">
              {generateWhatsAppText()}
            </pre>
          </aside>
        </>
      )}

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
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
