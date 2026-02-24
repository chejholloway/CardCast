/** @vitest-environment jsdom */
import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterEach,
  afterAll,
} from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { renderWithProviders } from './testUtils';
import { server } from './server';
import { http, HttpResponse } from 'msw';
import { LinkCardComposer } from '../src/LinkCardComposer';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      initial,
      animate,
      exit,
      transition,
      whileHover,
      whileTap,
      whileInView,
      variants,
      ...props
    }: any) => React.createElement('div', props, children),
    button: ({
      children,
      initial,
      animate,
      exit,
      transition,
      whileHover,
      whileTap,
      whileInView,
      variants,
      ...props
    }: any) => React.createElement('button', props, children),
  },
}));

vi.mock('../src/useTheme', () => ({
  useTheme: () => false,
}));

(globalThis as any).chrome = {
  runtime: {
    sendMessage: vi.fn((payload, callback) => {
      if (callback) callback({ ok: true });
    }),
  },
} as any;

beforeAll(() => server.listen());
afterAll(() => server.close());

describe('LinkCardComposer', () => {
  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });

  it('should render with initial idle state', () => {
    renderWithProviders(<LinkCardComposer url="https://thehill.com/article" />);
    expect(
      screen.getByRole('button', { name: /fetch link metadata/i })
    ).toBeInTheDocument();
  });

  it('should display fetched card data', async () => {
    server.use(
      http.get('*/api/trpc/og.fetch*', () => {
        return HttpResponse.json([
          {
            result: {
              data: {
                title: 'Mocked Title',
                description: 'Mocked Description',
                imageUrl: 'https://example.com/image.png',
              },
            },
          },
        ]);
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<LinkCardComposer url="https://thehill.com/article" />);

    const fetchButton = screen.getByRole('button', {
      name: /fetch link metadata/i,
    });
    await user.click(fetchButton);

    await waitFor(
      () => {
        expect(screen.getByText('Mocked Title')).toBeInTheDocument();
        expect(screen.getByText('Mocked Description')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('should send message when posting with card', async () => {
    server.use(
      http.get('*/api/trpc/og.fetch*', () => {
        return HttpResponse.json([
          {
            result: {
              data: {
                title: 'Mocked Title',
                description: 'Mocked Description',
              },
            },
          },
        ]);
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<LinkCardComposer url="https://thehill.com/article" />);

    const fetchButton = screen.getByRole('button', {
      name: /fetch link metadata/i,
    });
    await user.click(fetchButton);

    const postButton = await screen.findByRole('button', {
      name: /post with card/i,
    });
    await user.click(postButton);

    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'CREATE_POST',
        payload: expect.objectContaining({
          title: 'Mocked Title',
        }),
      }),
      expect.any(Function)
    );
  });
});
