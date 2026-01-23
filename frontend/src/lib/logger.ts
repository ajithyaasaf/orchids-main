/**
 * Simple Logger for Frontend
 * Used for audit logging and debugging
 */

interface LogDetails {
    [key: string]: any;
}

export const logger = {
    /**
     * Security event logging
     * Used for audit trails
     */
    security: (event: string, details?: LogDetails) => {
        const timestamp = new Date().toISOString();
        console.log(`[SECURITY] ${timestamp} - ${event}`, details || {});
    },

    /**
     * Error logging
     */
    error: (message: string, error?: any) => {
        console.error(`[ERROR] ${message}`, error);
    },

    /**
     * Info logging
     */
    info: (message: string, details?: LogDetails) => {
        console.log(`[INFO] ${message}`, details || {});
    },
};
