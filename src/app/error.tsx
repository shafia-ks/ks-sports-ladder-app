'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold text-slate-900">Something went wrong!</h1>
                    <p className="text-slate-600">
                        We encountered an unexpected error. Please try again.
                    </p>
                </div>

                <div className="flex gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="btn btn-primary"
                    >
                        Try again
                    </button>
                    <Link href="/" className="btn btn-secondary">
                        Go home
                    </Link>
                </div>
            </div>
        </div>
    );
}
