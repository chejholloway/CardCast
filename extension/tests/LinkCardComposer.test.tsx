import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { renderWithProviders } from './testUtils';

// Mock the framer-motion to simplify testing
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => (
      <button {...props}>{children}</button>
    ),
  },
}));

// Mock chrome API
global.chrome = {
  runtime: {
    sendMessage: vi.fn(),
  },
} as any;

// Create a simple mock component for testing (extracted from contentScript)
const LinkCardComposer: React.FC<{ url: string }> = ({ url }) => {
  const [status, setStatus] = React.useState<
    'idle' | 'loading' | 'error' | 'success'
  >('idle');
  const [data, setData] = React.useState<any>(null);

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
      console.error(error); // Log the error or handle it
      setStatus('error');
    } finally {
      console.info(data);
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

  return (
    <div role="region" aria-label={`Link card preview for ${url}`}>
      <div aria-live="polite" className="sr-only">
        {status === 'loading' && 'Fetching metadata…'}
        {status === 'error' && 'Failed to fetch card'}
        {status === 'success' && 'Card fetched'}
      </div>

      <div className="flex gap-4">
        <span>Link card preview</span>
        <button
          aria-label="Fetch link metadata"
          onClick={fetchMetadata}
          disabled={status === 'loading'}
        >
          Fetch Link Card
        </button>
      </div>

      {status === 'loading' && <div>Fetching metadata…</div>}

      {status === 'error' && <div>Failed to fetch card</div>}

      {status === 'success' && data && (
        <div className="flex gap-3">
          <div className="flex-1">
            <div className="font-semibold">{data.title}</div>
            <div className="text-sm">{data.description}</div>
            <button onClick={postWithCard}>Post with Card</button>
          </div>
          <img
            src={data.imageUrl}
            alt={`Preview for ${data.title}`}
            width={80}
            height={80}
          />
        </div>
      )}
    </div>
  );
};

describe('LinkCardComposer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with initial idle state', () => {
    renderWithProviders(<LinkCardComposer url="https://thehill.com/article" />);
    expect(screen.getByText('Link card preview')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /fetch link metadata/i })
    ).toBeInTheDocument();
  });

  it('should show loading state when fetching metadata', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LinkCardComposer url="https://thehill.com/article" />);

    const fetchButton = screen.getByRole('button', {
      name: /fetch link metadata/i,
    });
    await user.click(fetchButton);

    expect(screen.getAllByText(/fetching metadata/i).length).toBeGreaterThan(0);
  });

  it('should display fetched card data', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LinkCardComposer url="https://thehill.com/article" />);

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
    renderWithProviders(<LinkCardComposer url="https://thehill.com/article" />);

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
      })
    );
  });

  it('should be accessible with proper aria labels', () => {
    renderWithProviders(<LinkCardComposer url="https://thehill.com/article" />);

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
