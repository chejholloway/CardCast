/**
 * Error Boundary component for graceful error handling in the extension UI
 *
 * Catches React errors and displays a user-friendly error message with retry option.
 * Prevents the entire extension UI from crashing on unhandled errors.
 *
 * @module ErrorBoundary
 */

import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary component that catches React errors in child components
 *
 * @component
 * @example
 * <ErrorBoundary>
 *   <LinkCardComposer url={url} />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('Extension error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-900 text-white rounded-xl">
          <h2 className="font-bold">Something went wrong</h2>
          <p className="text-sm mt-2">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 px-3 py-1 bg-red-700 hover:bg-red-600 rounded"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
