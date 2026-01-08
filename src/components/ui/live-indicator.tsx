"use client";

import { useEffect, useState } from 'react';

interface LiveIndicatorProps {
    show?: boolean;
    className?: string;
}

export function LiveIndicator({ show = true, className = '' }: LiveIndicatorProps) {
    const [pulse, setPulse] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setPulse(prev => !prev);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    if (!show) return null;

    return (
        <div className={`inline-flex items-center gap-2 ${className}`}>
            <div className="relative flex h-3 w-3">
                {pulse && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75"></span>
                )}
                <span className="relative inline-flex rounded-full h-3 w-3 bg-success-500"></span>
            </div>
            <span className="text-xs font-medium text-success-700">Live</span>
        </div>
    );
}

/**
 * Connection status indicator
 */
export function ConnectionStatus() {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        setIsOnline(navigator.onLine);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline) {
        return <LiveIndicator />;
    }

    return (
        <div className="inline-flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-danger-500"></div>
            <span className="text-xs font-medium text-danger-700">Offline</span>
        </div>
    );
}
