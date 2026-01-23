import { Request, Response, NextFunction } from 'express';

/**
 * Validation middleware for product creation/update
 */
export const validateProduct = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const { title, basePrice, price, category } = req.body;

    const errors: string[] = [];

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
        errors.push('Title is required');
    }

    // Check for basePrice (new system) or price (backward compatibility)
    const productPrice = basePrice || price;
    if (!productPrice || typeof productPrice !== 'number' || productPrice <= 0) {
        errors.push('Valid product price is required');
    }

    if (!category || typeof category !== 'string' || category.trim().length === 0) {
        errors.push('Category is required');
    }

    if (errors.length > 0) {
        res.status(400).json({
            success: false,
            error: 'Validation failed',
            errors,
        });
        return;
    }

    next();
};

/**
 * Validation middleware for order creation
 * SECURITY: Enhanced with strict patterns and HTML sanitization
 */
export const validateOrder = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const { items, address, totalAmount } = req.body;

    const errors: string[] = [];

    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
        errors.push('Order must contain at least one item');
    }

    // Validate address object exists
    if (!address || typeof address !== 'object') {
        errors.push('Shipping address is required');
    } else {
        // Required fields check
        const requiredFields = ['name', 'phone', 'addressLine1', 'city', 'state', 'pincode', 'country'];
        for (const field of requiredFields) {
            if (!address[field]) {
                errors.push(`Address ${field} is required`);
            }
        }

        // SECURITY: Strict phone validation (Indian mobile: 10 digits, starts with 6-9)
        const phoneRegex = /^[6-9]\d{9}$/;
        if (address.phone && !phoneRegex.test(address.phone)) {
            errors.push('Phone number must be 10 digits starting with 6-9');
        }

        // SECURITY: Strict pincode validation (6 digits)
        const pincodeRegex = /^\d{6}$/;
        if (address.pincode && !pincodeRegex.test(address.pincode)) {
            errors.push('Pincode must be exactly 6 digits');
        }

        // SECURITY: Name validation (2-100 characters, letters and spaces only)
        const nameRegex = /^[a-zA-Z\s]{2,100}$/;
        if (address.name && !nameRegex.test(address.name)) {
            errors.push('Name must be 2-100 characters, letters and spaces only');
        }

        // SECURITY: Sanitize text inputs to prevent XSS
        if (address.name) {
            address.name = address.name.replace(/[<>]/g, '').trim();
        }
        if (address.addressLine1) {
            address.addressLine1 = address.addressLine1.replace(/[<>]/g, '').trim();
        }
        if (address.addressLine2) {
            address.addressLine2 = address.addressLine2.replace(/[<>]/g, '').trim();
        }
        if (address.city) {
            address.city = address.city.replace(/[<>]/g, '').trim();
        }
        if (address.state) {
            address.state = address.state.replace(/[<>]/g, '').trim();
        }

        // Validate field lengths
        if (address.name && address.name.length > 100) {
            errors.push('Name must not exceed 100 characters');
        }
        if (address.addressLine1 && address.addressLine1.length > 200) {
            errors.push('Address line 1 must not exceed 200 characters');
        }
        if (address.addressLine2 && address.addressLine2.length > 200) {
            errors.push('Address line 2 must not exceed 200 characters');
        }
        if (address.city && address.city.length > 100) {
            errors.push('City must not exceed 100 characters');
        }
        if (address.state && address.state.length > 100) {
            errors.push('State must not exceed 100 characters');
        }
    }

    // Validate total amount
    if (!totalAmount || typeof totalAmount !== 'number' || totalAmount <= 0) {
        errors.push('Valid total amount is required');
    }

    // Validate amount is reasonable (prevent overflow attacks)
    if (totalAmount && totalAmount > 10000000) { // 1 crore max
        errors.push('Total amount exceeds maximum allowed');
    }

    if (errors.length > 0) {
        res.status(400).json({
            success: false,
            error: 'Validation failed',
            errors,
        });
        return;
    }

    next();
};
