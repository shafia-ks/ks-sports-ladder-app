/**
 * Production-ready logger utility
 * Logs to console in development, silent in production (unless error)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
    private isDevelopment = process.env.NODE_ENV === 'development';

    private log(level: LogLevel, message: string, meta?: any) {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

        switch (level) {
            case 'debug':
                if (this.isDevelopment) {
                    console.log(prefix, message, meta || '');
                }
                break;
            case 'info':
                if (this.isDevelopment) {
                    console.info(prefix, message, meta || '');
                }
                break;
            case 'warn':
                console.warn(prefix, message, meta || '');
                break;
            case 'error':
                console.error(prefix, message, meta || '');
                break;
        }
    }

    debug(message: string, meta?: any) {
        this.log('debug', message, meta);
    }

    info(message: string, meta?: any) {
        this.log('info', message, meta);
    }

    warn(message: string, meta?: any) {
        this.log('warn', message, meta);
    }

    error(message: string, error?: Error | any) {
        this.log('error', message, error);
    }
}

export const logger = new Logger();
