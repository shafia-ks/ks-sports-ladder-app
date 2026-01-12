"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, Inbox } from "lucide-react";
import Link from "next/link";
import { useNotifications } from "@/hooks/useNotifications";

export function NotificationBell() {
    // Only fetch if dropdown is open to save bandwidth? No, we need count. Hook handles fetch.
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleNotificationClick = (id: string) => {
        markAsRead(id);
        setIsOpen(false);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative flex items-center justify-center rounded-lg p-2 text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Notifications"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-[90vw] sm:w-96 max-w-md rounded-xl border border-slate-200 bg-white shadow-xl z-[100] overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-3">
                        <h3 className="text-sm font-semibold text-slate-900 flex-shrink-0">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllAsRead()}
                                className="text-xs font-medium text-brand-600 hover:text-brand-700"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                                <Inbox className="mb-3 h-10 w-10 opacity-20" />
                                <p className="text-sm">No notifications</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {notifications.map((notification) => (
                                    <li
                                        key={notification.id}
                                        className={`group relative flex gap-4 px-4 py-3 transition-colors hover:bg-slate-50 ${!notification.read_at ? 'bg-blue-50/50' : ''
                                            }`}
                                    >
                                        <div className="mt-1 shrink-0">
                                            <div className={`h-2 w-2 rounded-full ${!notification.read_at ? 'bg-brand-500' : 'bg-transparent'}`} />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className={`text-sm leading-tight ${!notification.read_at ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-slate-500 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-1">
                                                {formatDate(notification.created_at)}
                                            </p>
                                        </div>
                                        {notification.link_url && (
                                            <Link
                                                href={notification.link_url as any}
                                                onClick={() => handleNotificationClick(notification.id)}
                                                className="absolute inset-0 z-10"
                                                aria-label={`View ${notification.title}`}
                                            >
                                                <span className="sr-only">View</span>
                                            </Link>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                markAsRead(notification.id);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-brand-600 relative z-20 transition-opacity"
                                            title="Mark as read"
                                        >
                                            <Check className="h-4 w-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
