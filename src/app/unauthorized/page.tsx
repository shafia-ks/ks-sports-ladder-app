"use client";

import Link from "next/link";
import { ShieldAlert, Home, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="card p-8 text-center">
                    {/* Icon */}
                    <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                        <ShieldAlert className="h-10 w-10 text-red-600" />
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-bold text-slate-900 mb-3">
                        Access Denied
                    </h1>

                    {/* Description */}
                    <p className="text-slate-600 mb-8">
                        You don't have permission to access this page. This area is restricted to administrators and organizers only.
                    </p>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={() => router.back()}
                            className="btn btn-secondary flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Go Back
                        </button>
                        <Link href="/dashboard" className="btn btn-primary flex items-center justify-center gap-2">
                            <Home className="h-4 w-4" />
                            Go to Dashboard
                        </Link>
                    </div>

                    {/* Help Text */}
                    <p className="text-sm text-slate-500 mt-8">
                        If you believe you should have access, please contact your ladder administrator.
                    </p>
                </div>
            </div>
        </div>
    );
}
