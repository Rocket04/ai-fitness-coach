// js/ui/components/ErrorBoundary.jsx
// Error boundary with retry support — catches render errors and allows in-place recovery

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught error:', error, info?.componentStack);
    this.setState({ errorInfo: info });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback from parent
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? this.props.fallback({ error: this.state.error, retry: this.handleRetry })
          : this.props.fallback;
      }

      return React.createElement(
        'div',
        {
          className: 'card',
          style: {
            textAlign: 'center',
            padding: 'var(--spacing-xl)',
            margin: 'var(--spacing-md)',
          },
        },
        React.createElement(
          'div',
          {
            style: {
              fontSize: '2rem',
              marginBottom: 'var(--spacing-md)',
              color: 'var(--red)',
            },
          },
          React.createElement(AlertTriangle, { size: 32 })
        ),
        React.createElement(
          'h3',
          {
            style: {
              margin: '0 0 var(--spacing-sm) 0',
              fontSize: 'var(--font-size-title)',
            },
          },
          'Что-то пошло не так'
        ),
        React.createElement(
          'p',
          {
            style: {
              color: 'var(--text2)',
              marginBottom: 'var(--spacing-md)',
              fontSize: 'var(--font-size-body)',
            },
          },
          this.state.error?.message ||
            'Произошла непредвиденная ошибка. Попробуйте повторить.'
        ),
        React.createElement(
          'div',
          { style: { display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'center' } },
          React.createElement(
            'button',
            {
              className: 'btn',
              onClick: () => window.location.reload(),
            },
            'Перезагрузить страницу'
          ),
          React.createElement(
            'button',
            {
              className: 'btn btn-accent',
              onClick: this.handleRetry,
            },
            React.createElement(
              'span',
              {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-xs)',
                },
              },
              React.createElement(RefreshCw, { size: 16 }),
              'Повторить'
            )
          )
        ),
        // Error details in development (collapsible)
        this.state.error?.stack &&
          React.createElement(
            'details',
            {
              style: {
                marginTop: 'var(--spacing-md)',
                textAlign: 'left',
                fontSize: 'var(--font-size-caption)',
                color: 'var(--text3)',
              },
            },
            React.createElement(
              'summary',
              {
                style: { cursor: 'pointer', marginBottom: 'var(--spacing-xs)' },
              },
              'Техническая информация'
            ),
            React.createElement(
              'pre',
              {
                style: {
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  backgroundColor: 'var(--surface2)',
                  padding: 'var(--spacing-sm)',
                  borderRadius: 'var(--radius-sm)',
                  maxHeight: '200px',
                  overflow: 'auto',
                },
              },
              this.state.error.stack
            )
          )
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
