import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { renderWithProviders } from './testUtils';
// Mock the framer-motion to simplify testing
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) =>
      _jsx('div', { ...props, children: children }),
    button: ({ children, ...props }) =>
      _jsx('button', { ...props, children: children }),
  },
}));
// Mock chrome API
global.chrome = {
  runtime: {
    sendMessage: vi.fn(),
  },
};
// Create a simple mock component for testing (extracted from contentScript)
const LinkCardComposer = ({ url }) => {
  const [status, setStatus] = React.useState('idle');
  const [data, setData] = React.useState(null);
  const fetchMetadata = async () => {
    setStatus('loading');
    try {
      // Simulate fetch
      await new Promise((resolve) => setTimeout(resolve, 100));
      setData({
        title: 'Test Article',
        description: 'Test description',
        imageUrl: 'https://example.com/image.jpg',
      });
      setStatus('success');
    } catch (error) {
      setStatus('error');
    }
  };
  const postWithCard = () => {
    if (data && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'CREATE_POST',
        payload: {
          text: 'Check this out',
          url,
          title: data.title,
          description: data.description,
          imageUrl: data.imageUrl,
        },
      });
    }
  };
  return _jsxs('div', {
    role: 'region',
    'aria-label': `Link card preview for ${url}`,
    children: [
      _jsxs('div', {
        'aria-live': 'polite',
        className: 'sr-only',
        children: [
          status === 'loading' && 'Fetching metadata…',
          status === 'error' && 'Failed to fetch card',
          status === 'success' && 'Card fetched',
        ],
      }),
      _jsxs('div', {
        className: 'flex gap-4',
        children: [
          _jsx('span', { children: 'Link card preview' }),
          _jsx('button', {
            'aria-label': 'Fetch link metadata',
            onClick: fetchMetadata,
            disabled: status === 'loading',
            children: 'Fetch Link Card',
          }),
        ],
      }),
      status === 'loading' &&
        _jsx('div', { children: 'Fetching metadata\u2026' }),
      status === 'error' && _jsx('div', { children: 'Failed to fetch card' }),
      status === 'success' &&
        data &&
        _jsxs('div', {
          className: 'flex gap-3',
          children: [
            _jsxs('div', {
              className: 'flex-1',
              children: [
                _jsx('div', {
                  className: 'font-semibold',
                  children: data.title,
                }),
                _jsx('div', {
                  className: 'text-sm',
                  children: data.description,
                }),
                _jsx('button', {
                  onClick: postWithCard,
                  children: 'Post with Card',
                }),
              ],
            }),
            _jsx('img', {
              src: data.imageUrl,
              alt: `Preview for ${data.title}`,
              width: 80,
              height: 80,
            }),
          ],
        }),
    ],
  });
};
describe('LinkCardComposer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('should render with initial idle state', () => {
    renderWithProviders(
      _jsx(LinkCardComposer, { url: 'https://thehill.com/article' })
    );
    expect(screen.getByText('Link card preview')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /fetch link metadata/i })
    ).toBeInTheDocument();
  });
  it('should show loading state when fetching metadata', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      _jsx(LinkCardComposer, { url: 'https://thehill.com/article' })
    );
    const fetchButton = screen.getByRole('button', {
      name: /fetch link metadata/i,
    });
    await user.click(fetchButton);
    expect(screen.getByText(/fetching metadata/i)).toBeInTheDocument();
  });
  it('should display fetched card data', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      _jsx(LinkCardComposer, { url: 'https://thehill.com/article' })
    );
    const fetchButton = screen.getByRole('button', {
      name: /fetch link metadata/i,
    });
    await user.click(fetchButton);
    await waitFor(() => {
      expect(screen.getByText('Test Article')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });
  });
  it('should send message when posting with card', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      _jsx(LinkCardComposer, { url: 'https://thehill.com/article' })
    );
    const fetchButton = screen.getByRole('button', {
      name: /fetch link metadata/i,
    });
    await user.click(fetchButton);
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /post with card/i })
      ).toBeInTheDocument();
    });
    const postButton = screen.getByRole('button', { name: /post with card/i });
    await user.click(postButton);
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'CREATE_POST',
        payload: expect.objectContaining({
          url: 'https://thehill.com/article',
          title: 'Test Article',
        }),
      }),
      expect.any(Function)
    );
  });
  it('should be accessible with proper aria labels', () => {
    renderWithProviders(
      _jsx(LinkCardComposer, { url: 'https://thehill.com/article' })
    );
    expect(
      screen.getByRole('region', {
        name: /link card preview for https:\/\/thehill.com\/article/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /fetch link metadata/i })
    ).toBeInTheDocument();
  });
});
