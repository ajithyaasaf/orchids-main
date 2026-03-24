/**
 * Date utility for handling Firestore Timestamps and plain dates uniformly.
 * Firestore returns Timestamps as objects with { seconds, nanoseconds }
 * but they can also arrive as ISO strings or JS Date objects.
 */

/**
 * Convert any Firestore Timestamp, Date, or string to a JS Date.
 */
export function toDate(value: any): Date | null {
    if (!value) return null;

    // Firestore Timestamp (has .seconds or ._seconds property)
    if (value && typeof value === 'object') {
        if ('seconds' in value) return new Date(value.seconds * 1000);
        if ('_seconds' in value) return new Date(value._seconds * 1000);
    }

    // JS Date
    if (value instanceof Date) {
        return value;
    }

    // ISO string or timestamp number
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Format a Firestore Timestamp or date value for display.
 * Returns 'N/A' if the value is missing or invalid.
 */
export function formatDate(
    value: any,
    options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }
): string {
    const date = toDate(value);
    if (!date) return 'N/A';

    return date.toLocaleString('en-IN', options);
}

/**
 * Format just the date portion (no time).
 */
export function formatDateOnly(value: any): string {
    const date = toDate(value);
    if (!date) return 'N/A';

    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

/**
 * Format as relative time (e.g., "2 hours ago").
 */
export function formatRelative(value: any): string {
    const date = toDate(value);
    if (!date) return 'N/A';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return formatDateOnly(value);
}
