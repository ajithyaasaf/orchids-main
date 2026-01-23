'use client';

import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { ToastType } from '@/context/ToastContext';

interface ToastProps {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
    onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger enter animation
        requestAnimationFrame(() => {
            setIsVisible(true);
        });
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        // Wait for exit animation to finish before removing from DOM
        setTimeout(onClose, 300);
    };

    const styles = {
        success: 'bg-white border-l-4 border-success text-text-primary shadow-lg',
        error: 'bg-white border-l-4 border-error text-text-primary shadow-lg',
        info: 'bg-white border-l-4 border-primary text-text-primary shadow-lg',
        warning: 'bg-white border-l-4 border-yellow-500 text-text-primary shadow-lg',
    };

    const icons = {
        success: <CheckCircle className="w-5 h-5 text-success" />,
        error: <AlertCircle className="w-5 h-5 text-error" />,
        info: <Info className="w-5 h-5 text-primary" />,
        warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    };

    return (
        <div
            className={`
                pointer-events-auto
                flex items-center gap-3 min-w-[300px] max-w-md p-4 rounded-lg shadow-soft
                transition-all duration-300 ease-in-out transform
                ${styles[type]}
                ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
            `}
            role="alert"
        >
            <div className="flex-shrink-0">
                {icons[type]}
            </div>
            <p className="flex-1 text-sm font-medium">{message}</p>
            <button
                onClick={handleClose}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};
