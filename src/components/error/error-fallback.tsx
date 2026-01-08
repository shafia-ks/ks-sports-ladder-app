"use client";

import { AlertCircle, RefreshCw, Home } from "lucide-react";

interface ErrorFallbackProps {
    error?: Error;
    resetError?: () => void;
    title?: string;
    message?: string;
}

export function ErrorFallback({
    error,
    resetError,
    title = "Something went wrong",
    message = "We encountered an unexpected error. Please try again."
}: ErrorFallbackProps) {
    return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
            <div className="card p-8 max-w-md w-full text-center">
                <div className="mb-6">
                    <div className="h-16 w-16 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="h-8 w-8 text-danger-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">
                        {title}
                    </h2>
                    <p className="text-sm text-slate-600">
                        {message}
                    </p>

                    {process.env.NODE_ENV === "development" && error && (
                        <details className="mt-4 text-left">
                            <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700 mb-2">
                                Error details (development only)
                            </summary>
                            <div className="bg-slate-100 p-3 rounded text-xs overflow-auto max-h-32">
                                <p className="font-semibold text-danger-700 mb-1">{error.name}</p>
                                <p className="text-slate-700 mb-2">{error.message}</p>
                                {error.stack && (
                                    <pre className="text-[10px] text-slate-600 whitespace-pre-wrap">
                                        {error.stack}
                                    </pre>
                                )}
                            </div>
                        </details>
                    )}
                </div>

                <div className="flex gap-2 justify-center">
                    {resetError && (
                        <button
                            onClick={resetError}
                            className="btn btn-primary flex items-center gap-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Try again
                        </button>
                    )}
                    <button
                        onClick={() => window.location.href = "/"}
                        className="btn btn-secondary flex items-center gap-2"
                    >
                        <Home className="h-4 w-4" />
                        Go home
                    </button>
                </div>
            </div>
        </div>
    );
}

interface ErrorMessageProps {
    title?: string;
    message: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function ErrorMessage({ title, message, action }: ErrorMessageProps) {
    return (
        <div className="card p-6 border-l-4 border-danger-500 bg-danger-50">
            <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-danger-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                    {title && (
                        <h3 className="text-sm font-semibold text-danger-900 mb-1">
                            {title}
                        </h3>
                    )}
                    <p className="text-sm text-danger-800">
                        {message}
                    </p>
                    {action && (
                        <button
                            onClick={action.onClick}
                            className="mt-3 text-sm font-semibold text-danger-700 hover:text-danger-900 underline"
                        >
                            {action.label}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
