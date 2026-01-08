"use client";

import React, { Component, ReactNode } from "react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error to console in development
        if (process.env.NODE_ENV === "development") {
            console.error("ErrorBoundary caught an error:", error, errorInfo);
        }

        // Call custom error handler if provided
        this.props.onError?.(error, errorInfo);

        // TODO: Send to error tracking service (Sentry, etc.)
        // logErrorToService(error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                    <div className="card p-8 max-w-md w-full text-center">
                        <div className="mb-4">
                            <div className="h-16 w-16 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg
                                    className="h-8 w-8 text-danger-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-slate-900 mb-2">
                                Something went wrong
                            </h2>
                            <p className="text-sm text-slate-600 mb-4">
                                We encountered an unexpected error. Please try again.
                            </p>
                            {process.env.NODE_ENV === "development" && this.state.error && (
                                <details className="text-left mb-4">
                                    <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">
                                        Error details (dev only)
                                    </summary>
                                    <pre className="mt-2 text-xs bg-slate-100 p-2 rounded overflow-auto max-h-32">
                                        {this.state.error.toString()}
                                    </pre>
                                </details>
                            )}
                        </div>
                        <div className="flex gap-2 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="btn btn-primary"
                            >
                                Try again
                            </button>
                            <button
                                onClick={() => window.location.href = "/"}
                                className="btn btn-secondary"
                            >
                                Go home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
