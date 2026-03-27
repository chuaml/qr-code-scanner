import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Generator } from './Generator';

describe('Generator Component', () => {
  it('renders correctly with empty state', () => {
    render(<Generator />);
    expect(screen.getByPlaceholderText(/Enter URL or text/i)).toBeInTheDocument();
    expect(screen.getByText(/Enter text above to generate QR/i)).toBeInTheDocument();
  });

  it('updates text and shows QR code', () => {
    render(<Generator />);
    const textarea = screen.getByPlaceholderText(/Enter URL or text/i);
    
    fireEvent.change(textarea, { target: { value: 'https://google.com' } });
    
    expect(textarea).toHaveValue('https://google.com');
    // The placeholder text should be gone
    expect(screen.queryByText(/Enter text above to generate QR/i)).not.toBeInTheDocument();
    // The download button should appear
    expect(screen.getByText(/Download/i)).toBeInTheDocument();
  });
});
