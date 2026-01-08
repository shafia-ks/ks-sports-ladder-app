/**
 * Error logging utility
 * Logs errors to console in development and can be extended to send to external services
 */

interface ErrorContext {
    userId?: string;
    userRole?: string;
    route?: string;
    action?: string;
    [key: string]: any;
}

export class ErrorLogger {
    private static instance: ErrorLogger;
    private isDevelopment = process.env.NODE_ENV === "development";

    private constructor() { }

    static getInstance(): ErrorLogger {
        if (!ErrorLogger.instance) {
            ErrorLogger.instance = new ErrorLogger();
        }
        return ErrorLogger.instance;
    }

    /**
     * Log an error with context
     */
    log(error: Error, context?: ErrorContext) {
        const errorData = {
            message: error.message,
            name: error.name,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            ...context
        };

        if (this.isDevelopment) {
            console.error("Error logged:", errorData);
        }

        // TODO: Send to external error tracking service
        // this.sendToSentry(errorData);
        // this.sendToLogRocket(errorData);
    }

    /**
     * Log a warning
     */
    warn(message: string, context?: ErrorContext) {
        const warnData = {
            message,
            level: "warning",
            timestamp: new Date().toISOString(),
            ...context
        };

        if (this.isDevelopment) {
            console.warn("Warning logged:", warnData);
        }

        // TODO: Send to external service
    }

    /**
     * Log an info message
     */
    info(message: string, context?: ErrorContext) {
        const infoData = {
            message,
            level: "info",
            timestamp: new Date().toISOString(),
            ...context
        };

        if (this.isDevelopment) {
            console.info("Info logged:", infoData);
        }

        // TODO: Send to external service
    }

    /**
     * Get user-friendly error message
     */
    getUserMessage(error: Error): string {
        // Network errors
        if (error.message.includes("fetch") || error.message.includes("network")) {
            return "Network error. Please check your connection and try again.";
        }

        // Authentication errors
        if (error.message.includes("unauthorized") || error.message.includes("401")) {
            return "Your session has expired. Please sign in again.";
        }

        // Permission errors
        if (error.message.includes("forbidden") || error.message.includes("403")) {
            return "You don't have permission to perform this action.";
        }

        // Not found errors
        if (error.message.includes("not found") || error.message.includes("404")) {
            return "The requested resource was not found.";
        }

        // Server errors
        if (error.message.includes("500") || error.message.includes("server")) {
            return "Server error. Please try again later.";
        }

        // Validation errors
        if (error.message.includes("validation") || error.message.includes("invalid")) {
            return error.message; // Show validation message as-is
        }

        // Default message
        return "Something went wrong. Please try again.";
    }

    /**
     * Check if error should be retried
     */
    shouldRetry(error: Error): boolean {
        const retryableErrors = [
            "fetch",
            "network",
            "timeout",
            "500",
            "502",
            "503",
            "504"
        ];

        return retryableErrors.some(keyword =>
            error.message.toLowerCase().includes(keyword)
        );
    }

    // TODO: Implement external service integrations
    // private sendToSentry(errorData: any) {
    //   if (typeof window !== 'undefined' && window.Sentry) {
    //     window.Sentry.captureException(errorData);
    //   }
    // }
}

// Export singleton instance
export const errorLogger = ErrorLogger.getInstance();

// Convenience functions
export const logError = (error: Error, context?: ErrorContext) => {
    errorLogger.log(error, context);
};

export const logWarning = (message: string, context?: ErrorContext) => {
    errorLogger.warn(message, context);
};

export const logInfo = (message: string, context?: ErrorContext) => {
    errorLogger.info(message, context);
};

export const getUserErrorMessage = (error: Error): string => {
    return errorLogger.getUserMessage(error);
};

export const shouldRetryError = (error: Error): boolean => {
    return errorLogger.shouldRetry(error);
};
