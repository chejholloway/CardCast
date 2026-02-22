import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterEach,
  afterAll,
} from 'vitest';
import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { renderWithProviders } from './testUtils';
import { server } from './server';
import { LinkCardComposer } from '../src/LinkCardComposer';

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

beforeAll(() => server.listen());
afterAll(() => server.close());

describe('LinkCardComposer', () => {
  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });

  it.skip('should show error state when fetching metadata fails', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LinkCardComposer url="https://error.com" />);

    const fetchButton = screen.getByRole('button', {
      name: /fetch link metadata/i,
    });
    await user.click(fetchButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch card/i)).toBeInTheDocument();
    });
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

  it.skip('should display fetched card data', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LinkCardComposer url="https://thehill.com/article" />);

    const fetchButton = screen.getByRole('button', {
      name: /fetch link metadata/i,
    });
    await user.click(fetchButton);

    await waitFor(() => {
      expect(screen.getByText('Mocked Title')).toBeInTheDocument();
      expect(screen.getByText('Mocked Description')).toBeInTheDocument();
    });
  });

  it.skip('should send message when posting with card', async () => {
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
          title: 'Mocked Title',
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
