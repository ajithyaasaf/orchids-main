/**
 * Structured Security Logger
 * 
 * Provides environment-aware logging with automatic PII redaction
 * and security event tracking.
 */

const isProduction = process.env.NODE_ENV === 'production';

interface SecurityEventDetails {
    uid?: string;
    email?: string;
    ip?: string;
    [key: string]: any;
}

/**
 * Redact sensitive information from log data
 */
const redactPII = (data: any): any => {
    if (!data) return data;

    const redacted = { ...data };

    // Redact email addresses
    if (redacted.email) {
        const [local, domain] = redacted.email.split('@');
        redacted.email = `${local.substring(0, 2)}***@***${domain ? `.${domain.split('.').pop()}` : ''}`;
    }

    // Redact UIDs (show first 8 chars only)
    if (redacted.uid && typeof redacted.uid === 'string') {
        redacted.uid = `${redacted.uid.substring(0, 8)}***`;
    }

    // Redact IP addresses (show first 2 octets only)
    if (redacted.ip) {
        const parts = redacted.ip.split('.');
        redacted.ip = parts.length === 4
            ? `${parts[0]}.${parts[1]}.***:***`
            : '***:***:***';
    }

    return redacted;
};

export const logger = {
    /**
     * Debug logging - only enabled in development
     */
    debug: (message: string, data?: any) => {
        if (!isProduction) {
            console.log(`[DEBUG] ${message}`, data || '');
        }
    },

    /**
     * Informational logging
     */
    info: (message: string, data?: any) => {
        console.log(`[INFO] ${message}`, data || '');
    },

    /**
     * Warning logging
     */
    warn: (message: string, data?: any) => {
        console.warn(`[WARN] ${message}`, data || '');
    },

    /**
     * Error logging with stack trace (server-side only)
     */
    error: (message: string, error?: any) => {
        if (isProduction) {
            // In production, log error message but sanitize stack traces
            console.error(`[ERROR] ${message}`, error?.message || error);
        } else {
            // In development, log full error details
            console.error(`[ERROR] ${message}`, error);
        }
    },

    /**
     * Security event logging with automatic PII redaction
     */
    security: (event: string, details?: SecurityEventDetails) => {
        const sanitized = details ? redactPII(details) : {};
        const timestamp = new Date().toISOString();

        console.log(`[SECURITY] ${timestamp} - ${event}`, sanitized);
    },

    /**
     * Request logging with request ID
     */
    request: (requestId: string, method: string, path: string, statusCode?: number) => {
        const status = statusCode ? ` - ${statusCode}` : '';
        console.log(`[REQUEST] [${requestId}] ${method} ${path}${status}`);
    },

    /**
     * Performance logging
     */
    perf: (operation: string, duration: number, requestId?: string) => {
        const reqId = requestId ? `[${requestId}] ` : '';
        console.log(`[PERF] ${reqId}${operation} completed in ${duration}ms`);
    },
};

export default logger;
