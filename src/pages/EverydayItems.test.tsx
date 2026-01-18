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
});
