import { logger } from './logger';

/**
 * Address Audit Logger
 * 
 * Logs all address operations for security and compliance.
 * Uses existing logger.security() function for consistent audit trail.
 */

export type AddressOperation = 'ADD' | 'UPDATE' | 'DELETE' | 'VIEW' | 'EXPORT' | 'SET_DEFAULT';

export interface AddressAuditLog {
    userId: string;
    operation: AddressOperation;
    addressId?: string;
    addressLabel?: string;
    ipAddress?: string;
    timestamp: string;
    success: boolean;
    errorMessage?: string;
}

/**
 * Log an address operation for audit trail
 * 
 * @param userId - User ID performing the operation
 * @param operation - Type of operation (ADD/UPDATE/DELETE/etc)
 * @param addressId - ID of the address (if applicable)
 * @param options - Additional metadata
 */
export function logAddressOperation(
    userId: string,
    operation: AddressOperation,
    success: boolean,
    options?: {
        addressId?: string;
        addressLabel?: string;
        ipAddress?: string;
        errorMessage?: string;
    }
): void {
    const auditLog: AddressAuditLog = {
        userId,
        operation,
        addressId: options?.addressId,
        addressLabel: options?.addressLabel,
        ipAddress: options?.ipAddress,
        timestamp: new Date().toISOString(),
        success,
        errorMessage: options?.errorMessage,
    };

    // Use existing security logger
    logger.security(`Address ${operation}`, {
        ...auditLog,
        // Redact sensitive data (PII)
        userId: userId.substring(0, 8) + '***', // Show first 8 chars only
    });
}

/**
 * Log successful address add
 */
export function logAddressAdded(userId: string, addressId: string, label: string): void {
    logAddressOperation(userId, 'ADD', true, { addressId, addressLabel: label });
}

/**
 * Log successful address update
 */
export function logAddressUpdated(userId: string, addressId: string, label: string): void {
    logAddressOperation(userId, 'UPDATE', true, { addressId, addressLabel: label });
}

/**
 * Log successful address delete
 */
export function logAddressDeleted(userId: string, addressId: string, label: string): void {
    logAddressOperation(userId, 'DELETE', true, { addressId, addressLabel: label });
}

/**
 * Log default address changed
 */
export function logDefaultAddressSet(userId: string, addressId: string, label: string): void {
    logAddressOperation(userId, 'SET_DEFAULT', true, { addressId, addressLabel: label });
}

/**
 * Log GDPR data export
 */
export function logDataExported(userId: string): void {
    logAddressOperation(userId, 'EXPORT', true);
}

/**
 * Log failed operation
 */
export function logAddressOperationFailed(
    userId: string,
    operation: AddressOperation,
    error: string,
    addressId?: string
): void {
    logAddressOperation(userId, operation, false, {
        addressId,
        errorMessage: error,
    });
}
