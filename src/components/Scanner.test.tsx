import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { Scanner } from './Scanner';

// Mock the getUserMedia API
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }]
    })
  }
});

describe('Scanner Component', () => {
  it('renders correctly', async () => {
    const onScan = vi.fn();
    await act(async () => {
      render(<Scanner onScan={onScan} />);
    });
    
    expect(screen.getByText(/Align QR code within frame/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload Image/i)).toBeInTheDocument();
  });
});
