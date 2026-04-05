import { describe, it, expect, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
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
  it('renders correctly in initial state', async () => {
    const onScan = vi.fn();
    await act(async () => {
      render(<Scanner onScan={onScan} />);
    });
    
    expect(screen.getByText(/Tap the screen above to scan/i)).toBeInTheDocument();
    expect(screen.getByText(/Tap to Start Scanner/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload Image/i)).toBeInTheDocument();
  });

  it('starts camera when scanner area is clicked', async () => {
    const onScan = vi.fn();
    await act(async () => {
      render(<Scanner onScan={onScan} />);
    });

    const scannerArea = screen.getByText(/Tap to Start Scanner/i).parentElement;
    if (!scannerArea) throw new Error('Scanner area not found');

    await act(async () => {
      fireEvent.click(scannerArea);
    });

    expect(screen.getByText(/Align QR code within frame/i)).toBeInTheDocument();
    expect(screen.queryByText(/Tap to Start Scanner/i)).not.toBeInTheDocument();
  });
});
