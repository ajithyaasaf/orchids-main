'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    type = 'info'
}) => {
    if (!isOpen) return null;

    const typeConfig = {
        danger: {
            icon: AlertTriangle,
            iconClass: 'bg-red-100 text-red-600',
            buttonClass: 'bg-red-600 hover:bg-red-700 shadow-red-200'
        },
        warning: {
            icon: AlertTriangle,
            iconClass: 'bg-amber-100 text-amber-600',
            buttonClass: 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
        },
        info: {
            icon: AlertTriangle,
            iconClass: 'bg-indigo-100 text-indigo-600',
            buttonClass: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
        }
    };

    const config = typeConfig[type];
    const Icon = config.icon;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
                    >
                        <div className="p-8">
                            {/* Close Button */}
                            <button
                                onClick={onCancel}
                                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Icon & Title */}
                            <div className="flex flex-col items-center text-center">
                                <div className={`p-4 rounded-2xl mb-6 ${config.iconClass}`}>
                                    <Icon className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
                                <p className="text-gray-500 leading-relaxed">{message}</p>
                            </div>

                            {/* Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 mt-8">
                                <button
                                    onClick={onCancel}
                                    className="flex-1 px-6 py-3.5 rounded-2xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all active:scale-95"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className={`flex-1 px-6 py-3.5 rounded-2xl font-bold text-white transition-all shadow-lg active:scale-95 ${config.buttonClass}`}
                                >
                                    {confirmText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
