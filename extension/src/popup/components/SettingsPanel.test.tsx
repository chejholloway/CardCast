/// <reference types="chrome" />

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsPanel } from './SettingsPanel';
import { vi } from 'vitest';

const mockOnClose = vi.fn();

describe('SettingsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (chrome.storage.session.get as vi.Mock).mockImplementation(
      (_keys: string[], callback: (items: { [key: string]: any }) => void) => {
        callback({ autoDetectDomains: ['example.com', 'test.com'] });
      }
    );
    (chrome.storage.session.set as vi.Mock).mockImplementation(
      (_data: { [key: string]: any }, callback: () => void) => {
        callback();
      }
    );
  });

  it('should render the list of domains', async () => {
    render(<SettingsPanel onClose={mockOnClose} />);
    await waitFor(() => {
      expect(screen.getByText('example.com')).toBeInTheDocument();
      expect(screen.getByText('test.com')).toBeInTheDocument();
    });
  });

  it('should add a new valid domain', async () => {
    render(<SettingsPanel onClose={mockOnClose} />);
    const input = screen.getByPlaceholderText('Add domain');
    const addButton = screen.getByRole('button', { name: /Add/i });

    fireEvent.change(input, { target: { value: 'newdomain.com' } });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(chrome.storage.session.set).toHaveBeenCalledWith(
        { autoDetectDomains: ['example.com', 'test.com', 'newdomain.com'] },
        expect.any(Function)
      );
    });
  });

  it('should remove a domain', async () => {
    render(<SettingsPanel onClose={mockOnClose} />);
    await waitFor(() => {
      expect(screen.getByText('example.com')).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByRole('button', { name: /Remove/i });
    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(chrome.storage.session.set).toHaveBeenCalledWith(
        { autoDetectDomains: ['test.com'] },
        expect.any(Function)
      );
    });
  });

  it('should call onClose when the back button is clicked', () => {
    render(<SettingsPanel onClose={mockOnClose} />);
    const backButton = screen.getByRole('button', { name: /← Back/i });
    fireEvent.click(backButton);
    expect(mockOnClose).toHaveBeenCalled();
  });
});
