/// <reference types="chrome" />

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsPanel } from './SettingsPanel';
import { vi } from 'vitest';

const mockOnClose = vi.fn();

describe('SettingsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(chrome.storage.session, 'get').mockImplementation(
      (_keys, callback) => {
        callback({ allowedDomains: ['example.com', 'test.com'] });
      }
    );
    vi.spyOn(chrome.storage.session, 'set').mockImplementation(
      (_data, callback) => {
        if (callback) {
          callback();
        }
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
    // "should add a new valid domain" — line 36
    const input = screen.getByRole('textbox', { name: /add domain/i });
    const addButton = screen.getByRole('button', { name: /Add/i });

    fireEvent.change(input, { target: { value: 'newdomain.com' } });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(chrome.storage.session.set).toHaveBeenCalledWith({
        allowedDomains: ['example.com', 'test.com', 'newdomain.com'],
      });
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
      expect(chrome.storage.session.set).toHaveBeenCalledWith({
        allowedDomains: ['test.com'],
      });
    });
  });

  it('should call onClose when the back button is clicked', () => {
    render(<SettingsPanel onClose={mockOnClose} />);
    const backButton = screen.getByRole('button', { name: /← Back/i });
    fireEvent.click(backButton);
    expect(mockOnClose).toHaveBeenCalled();
  });
});
