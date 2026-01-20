import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import EverydayItems from './EverydayItems';
import { db } from '../db/schema';

// Mock the dexie-react-hooks module
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(() => []),
}));

// Mock the toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock the database
vi.mock('../db/schema', () => ({
  db: {
    items: {
      add: vi.fn(),
      update: vi.fn(),
      toArray: vi.fn(() => Promise.resolve([])),
      filter: vi.fn(() => ({
        first: vi.fn(() => Promise.resolve(undefined)),
      })),
    },
  },
}));

describe('EverydayItems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the main heading', () => {
    render(<EverydayItems />);
    const heading = screen.getByRole('heading', { name: /everyday items/i });
    expect(heading).toBeInTheDocument();
  });

  it('adds a new item successfully', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');

    render(<EverydayItems />);

    // Fill in the item name
    const itemNameInput = screen.getByLabelText(/item name/i);
    await user.type(itemNameInput, 'Milk');

    // Since the category dropdown uses portals and is complex to test,
    // we'll just submit with no category selected (defaults to 'Uncategorized')

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /add item/i });
    await user.click(submitButton);

    // Verify database add was called with default category
    expect(db.items.add).toHaveBeenCalledWith({
      name: 'Milk',
      category: 'Uncategorized',
      is_active: false,
      created_at: expect.any(Number),
    });

    // Verify success toast was shown
    expect(toast.success).toHaveBeenCalledWith(
      'Item "Milk" added successfully'
    );
  });

  it('does not add item when name is empty', async () => {
    const user = userEvent.setup();

    render(<EverydayItems />);

    // Try to submit without entering item name
    const submitButton = screen.getByRole('button', { name: /add item/i });
    await user.click(submitButton);

    // Verify database add was NOT called
    expect(db.items.add).not.toHaveBeenCalled();
  });

  it('toggles item as active when checked', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');
    const { useLiveQuery } = await import('dexie-react-hooks');
    const { waitFor } = await import('@testing-library/react');

    // Mock useLiveQuery to return a test item
    const mockItem = {
      id: 1,
      name: 'Bread',
      category: 'Bakery',
      is_active: false,
      created_at: Date.now(),
    };

    // Simple approach: alternate between items and categories
    let calls = 0;
    vi.mocked(useLiveQuery).mockImplementation(() => {
      calls++;
      // Odd calls = items, Even calls = categories
      return calls % 2 === 1 ? [mockItem] : ['Bakery'];
    });

    render(<EverydayItems />);

    // Wait for the item to be rendered
    const itemElement = await waitFor(
      () => {
        return screen.getByText('Bread');
      },
      { timeout: 3000 }
    );

    expect(itemElement).toBeInTheDocument();

    // Click the item to toggle it
    await user.click(itemElement);

    // Verify database update was called to set is_active to true
    expect(db.items.update).toHaveBeenCalledWith(1, { is_active: true });

    // Verify success toast was shown (using setTimeout, so we need to wait)
    await waitFor(
      () => {
        expect(toast.success).toHaveBeenCalledWith(
          'Bread selected for shopping'
        );
      },
      { timeout: 1500 }
    );
  });

  it('collapses and expands category on toggle click', async () => {
    const user = userEvent.setup();
    const { useLiveQuery } = await import('dexie-react-hooks');
    const { waitFor } = await import('@testing-library/react');

    // Mock useLiveQuery to return items in a category
    const mockItems = [
      {
        id: 1,
        name: 'Bread',
        category: 'Bakery',
        is_active: false,
        created_at: Date.now(),
      },
      {
        id: 2,
        name: 'Croissant',
        category: 'Bakery',
        is_active: false,
        created_at: Date.now(),
      },
    ];

    // Set up mock BEFORE rendering - alternate between items and categories
    let calls = 0;
    vi.mocked(useLiveQuery).mockImplementation(() => {
      calls++;
      // Odd calls = items, Even calls = categories
      return calls % 2 === 1 ? mockItems : ['Bakery'];
    });

    render(<EverydayItems />);

    // Wait for items to be rendered (category starts expanded after initialization)
    await waitFor(
      () => {
        expect(screen.getByText('Bread')).toBeInTheDocument();
        expect(screen.getByText('Croissant')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Find the category header button
    const categoryHeading = screen.getByTestId('category-heading-Bakery');
    expect(categoryHeading).toBeInTheDocument();

    // Click to collapse
    await user.click(categoryHeading);

    // Items should be hidden after collapse
    await waitFor(() => {
      expect(screen.queryByText('Bread')).not.toBeInTheDocument();
      expect(screen.queryByText('Croissant')).not.toBeInTheDocument();
    });

    // Click again to expand
    await user.click(categoryHeading);

    // Items should be visible again after expand
    await waitFor(() => {
      expect(screen.getByText('Bread')).toBeInTheDocument();
      expect(screen.getByText('Croissant')).toBeInTheDocument();
    });
  });

  it('renames an item successfully', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');
    const { useLiveQuery } = await import('dexie-react-hooks');
    const { waitFor } = await import('@testing-library/react');

    // Mock useLiveQuery to return a test item
    const mockItem = {
      id: 1,
      name: 'Milk',
      category: 'Dairy',
      is_active: false,
      created_at: Date.now(),
    };

    let calls = 0;
    vi.mocked(useLiveQuery).mockImplementation(() => {
      calls++;
      return calls % 2 === 1 ? [mockItem] : ['Dairy'];
    });

    render(<EverydayItems />);

    // Wait for item to render
    await waitFor(() => {
      expect(screen.getByText('Milk')).toBeInTheDocument();
    });

    // Find and click the edit button (pencil icon)
    const editButton = screen.getByTestId('edit-item-button-1');
    await user.click(editButton);

    // Wait for edit mode to activate
    await waitFor(() => {
      expect(screen.getByDisplayValue('Milk')).toBeInTheDocument();
    });

    // Clear and type new name
    const nameInput = screen.getByDisplayValue('Milk');
    await user.clear(nameInput);
    await user.type(nameInput, 'Whole Milk');

    // Click save button
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    // Verify database update was called
    expect(db.items.update).toHaveBeenCalledWith(1, {
      name: 'Whole Milk',
      category: 'Dairy',
    });

    // Verify success toast
    expect(toast.success).toHaveBeenCalledWith('Item updated successfully');
  });

  it('deletes an item after confirmation', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');
    const { useLiveQuery } = await import('dexie-react-hooks');
    const { waitFor } = await import('@testing-library/react');

    // Mock useLiveQuery to return a test item
    const mockItem = {
      id: 1,
      name: 'Expired Milk',
      category: 'Dairy',
      is_active: false,
      created_at: Date.now(),
    };

    // Mock the delete method
    vi.mocked(db.items).delete = vi.fn().mockResolvedValue(undefined);

    let calls = 0;
    vi.mocked(useLiveQuery).mockImplementation(() => {
      calls++;
      return calls % 2 === 1 ? [mockItem] : ['Dairy'];
    });

    render(<EverydayItems />);

    // Wait for item to render
    await waitFor(() => {
      expect(screen.getByText('Expired Milk')).toBeInTheDocument();
    });

    // Find and click the delete button (trash icon)
    const deleteButton = screen.getByTestId('delete-item-button-1');
    await user.click(deleteButton);

    // Wait for confirmation dialog
    await waitFor(() => {
      expect(
        screen.getByText(/are you sure you want to delete this item/i)
      ).toBeInTheDocument();
    });

    // Click confirm delete button in dialog
    const confirmButton = screen.getByRole('button', { name: /delete$/i });
    await user.click(confirmButton);

    // Verify database delete was called
    expect(db.items.delete).toHaveBeenCalledWith(1);

    // Verify success toast
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Item deleted successfully');
    });
  });

  it('cancels item deletion when user dismisses dialog', async () => {
    const user = userEvent.setup();
    const { useLiveQuery } = await import('dexie-react-hooks');
    const { waitFor } = await import('@testing-library/react');

    // Mock useLiveQuery to return a test item
    const mockItem = {
      id: 1,
      name: 'Keep This Item',
      category: 'Pantry',
      is_active: false,
      created_at: Date.now(),
    };

    // Mock the delete method
    vi.mocked(db.items).delete = vi.fn().mockResolvedValue(undefined);

    let calls = 0;
    vi.mocked(useLiveQuery).mockImplementation(() => {
      calls++;
      return calls % 2 === 1 ? [mockItem] : ['Pantry'];
    });

    render(<EverydayItems />);

    // Wait for item to render
    await waitFor(() => {
      expect(screen.getByText('Keep This Item')).toBeInTheDocument();
    });

    // Find and click the delete button
    const deleteButton = screen.getByTestId('delete-item-button-1');
    await user.click(deleteButton);

    // Wait for confirmation dialog
    await waitFor(() => {
      expect(
        screen.getByText(/are you sure you want to delete this item/i)
      ).toBeInTheDocument();
    });

    // Click cancel button in dialog
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    // Verify database delete was NOT called
    expect(db.items.delete).not.toHaveBeenCalled();
  });
});
