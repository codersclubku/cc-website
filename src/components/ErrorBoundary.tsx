import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  title?: string;
  description?: string;
  resetLabel?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env?.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      const title = this.props.title || 'Something went wrong';
      const description = this.props.description || 'An unexpected error occurred while loading this view. You can reload this section or return home.';
      const resetLabel = this.props.resetLabel || 'Try again';

      return (
        <div className="w-full min-h-[40vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full p-6 sm:p-8 bg-[var(--surface-1)] border border-[var(--border)] rounded-md shadow-2 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[var(--danger-surface)] border border-[var(--danger-border)] flex items-center justify-center text-[var(--danger-text)]">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-strong)] m-0">
              {title}
            </h2>

            <p className="text-sm text-[var(--text-muted)] leading-relaxed m-0">
              {description}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full">
              <button
                type="button"
                onClick={this.handleReset}
                className="cc-btn cc-btn--primary w-full sm:flex-1 min-h-[42px] text-xs font-mono font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{resetLabel}</span>
              </button>

              <a
                href="/"
                className="cc-btn cc-btn--secondary w-full sm:flex-1 min-h-[42px] text-xs font-mono font-semibold"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Go to home</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
