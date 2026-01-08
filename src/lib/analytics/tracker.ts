/**
 * Analytics tracking utility
 * Supports Google Analytics and custom event tracking
 */

interface AnalyticsEvent {
    action: string;
    category: string;
    label?: string;
    value?: number;
}

class Analytics {
    private isDevelopment: boolean;

    constructor() {
        this.isDevelopment = process.env.NODE_ENV === 'development';
    }

    /**
     * Track page view
     */
    pageView(url: string) {
        if (this.isDevelopment) {
            console.log('[Analytics] Page view:', url);
            return;
        }

        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
                page_path: url,
            });
        }
    }

    /**
     * Track custom event
     */
    event({ action, category, label, value }: AnalyticsEvent) {
        if (this.isDevelopment) {
            console.log('[Analytics] Event:', { action, category, label, value });
            return;
        }

        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', action, {
                event_category: category,
                event_label: label,
                value: value,
            });
        }
    }

    /**
     * Track user action
     */
    trackAction(action: string, metadata?: Record<string, any>) {
        this.event({
            action,
            category: 'User Action',
            label: JSON.stringify(metadata),
        });
    }

    /**
     * Track ladder interaction
     */
    trackLadder(action: 'join' | 'leave' | 'view', ladderId: string) {
        this.event({
            action: `ladder_${action}`,
            category: 'Ladder',
            label: ladderId,
        });
    }

    /**
     * Track challenge interaction
     */
    trackChallenge(action: 'create' | 'accept' | 'reject' | 'complete', challengeId: string) {
        this.event({
            action: `challenge_${action}`,
            category: 'Challenge',
            label: challengeId,
        });
    }

    /**
     * Track match interaction
     */
    trackMatch(action: 'submit' | 'confirm' | 'dispute', matchId: string) {
        this.event({
            action: `match_${action}`,
            category: 'Match',
            label: matchId,
        });
    }

    /**
     * Track error
     */
    trackError(error: Error, context?: Record<string, any>) {
        if (this.isDevelopment) {
            console.error('[Analytics] Error:', error, context);
            return;
        }

        this.event({
            action: 'error',
            category: 'Error',
            label: `${error.name}: ${error.message}`,
        });

        // Send to error tracking service
        // TODO: Integrate with Sentry or similar
    }

    /**
     * Track performance metric
     */
    trackPerformance(metric: string, value: number) {
        if (this.isDevelopment) {
            console.log('[Analytics] Performance:', metric, value);
            return;
        }

        this.event({
            action: 'performance',
            category: 'Performance',
            label: metric,
            value: Math.round(value),
        });
    }
}

export const analytics = new Analytics();

/**
 * React hook for analytics
 */
export function useAnalytics() {
    return {
        trackPageView: analytics.pageView.bind(analytics),
        trackEvent: analytics.event.bind(analytics),
        trackAction: analytics.trackAction.bind(analytics),
        trackLadder: analytics.trackLadder.bind(analytics),
        trackChallenge: analytics.trackChallenge.bind(analytics),
        trackMatch: analytics.trackMatch.bind(analytics),
        trackError: analytics.trackError.bind(analytics),
        trackPerformance: analytics.trackPerformance.bind(analytics),
    };
}
