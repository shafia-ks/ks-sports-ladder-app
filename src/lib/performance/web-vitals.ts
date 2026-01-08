/**
 * Web Vitals tracking for performance monitoring
 * Tracks Core Web Vitals and sends to analytics
 * 
 * To enable: npm install web-vitals
 */

interface Metric {
    name: string;
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    delta: number;
    id: string;
}

/**
 * Report Web Vitals to analytics
 * Note: Requires 'web-vitals' package
 */
export function reportWebVitals() {
    if (typeof window === 'undefined') return;

    console.log('[Web Vitals] To enable, run: npm install web-vitals');

    // Uncomment after installing web-vitals package:
    /*
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(sendToAnalytics);
      getFID(sendToAnalytics);
      getFCP(sendToAnalytics);
      getLCP(sendToAnalytics);
      getTTFB(sendToAnalytics);
    }).catch(err => {
      console.warn('[Web Vitals] Failed to load:', err);
    });
    */
}

/**
 * Send metric to analytics endpoint
 */
function sendToAnalytics(metric: Metric) {
    const body = JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
        timestamp: Date.now(),
    });

    // Log in development
    if (process.env.NODE_ENV === 'development') {
        console.log('[Web Vitals]', metric.name, {
            value: `${Math.round(metric.value)}ms`,
            rating: metric.rating,
        });
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
        if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/analytics/vitals', body);
        } else {
            fetch('/api/analytics/vitals', {
                method: 'POST',
                body,
                keepalive: true,
                headers: {
                    'Content-Type': 'application/json',
                },
            }).catch(err => {
                console.warn('[Web Vitals] Failed to send:', err);
            });
        }
    }

    // Also send to Google Analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', metric.name, {
            event_category: 'Web Vitals',
            value: Math.round(metric.value),
            event_label: metric.id,
            non_interaction: true,
        });
    }
}

/**
 * Custom performance tracking
 */
export function trackPerformance(name: string, startTime: number) {
    const duration = performance.now() - startTime;

    if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${name}: ${Math.round(duration)}ms`);
    }

    // Send to analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'timing_complete', {
            name,
            value: Math.round(duration),
            event_category: 'Performance',
        });
    }
}

/**
 * React hook for performance tracking
 */
export function usePerformanceTracking(name: string) {
    const startTime = performance.now();

    return () => {
        trackPerformance(name, startTime);
    };
}
