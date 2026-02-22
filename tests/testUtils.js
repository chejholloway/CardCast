import { jsx as _jsx } from 'react/jsx-runtime';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, trpcClient } from '../src/trpcClient';
/**
 * Custom render function that includes necessary providers
 */
export const renderWithProviders = (
  ui,
  {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    }),
    ...renderOptions
  } = {}
) => {
  const Wrapper = ({ children }) =>
    _jsx(QueryClientProvider, {
      client: queryClient,
      children: _jsx(trpc.Provider, {
        client: trpcClient,
        queryClient: queryClient,
        children: children,
      }),
    });
  return render(ui, { wrapper: Wrapper, ...renderOptions });
};
export { screen } from '@testing-library/react';
export { userEvent } from '@testing-library/user-event';
