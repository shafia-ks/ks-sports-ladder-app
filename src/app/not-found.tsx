import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="space-y-2">
                    <h1 className="text-6xl font-bold text-brand-600">404</h1>
                    <h2 className="text-2xl font-semibold text-slate-900">Page not found</h2>
                    <p className="text-slate-600">
                        The page you're looking for doesn't exist or has been moved.
                    </p>
                </div>

                <Link href="/" className="btn btn-primary inline-flex">
                    Go home
                </Link>
            </div>
        </div>
    );
}
