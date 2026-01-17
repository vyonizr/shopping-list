import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import EverydayItems from './EverydayItems';

describe('EverydayItems', () => {
  it('renders the main heading', () => {
    render(<EverydayItems />);
    const heading = screen.getByRole('heading', { name: /everyday items/i });
    expect(heading).toBeInTheDocument();
  });
});
