"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./Footer";

export function ConditionalFooter() {
    const pathname = usePathname();

    // List of paths where the footer should be HIDDEN
    // Basically all "app" pages.
    // Public pages: "/", "/login", "/register", "/contact", "/legal/*", "/help(maybe)"
    // App pages: "/dashboard", "/ladders", "/profile", "/admin", "/organizer", "/notifications"

    // Simpler logic: Hide if path starts with known app routes.
    const hiddenPrefixes = [
        "/dashboard",
        "/ladders",
        "/profile",
        "/organizer",
        "/admin",
        "/notifications",
        "/settings",
        "/messages" // hypothetical
    ];

    const shouldHide = hiddenPrefixes.some(prefix => pathname?.startsWith(prefix));

    if (shouldHide) {
        return null;
    }

    return <Footer />;
}
