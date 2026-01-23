import React from 'react';

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({
    size = 'md',
}) => {
    const sizes = {
        sm: 'h-6 w-6',
        md: 'h-12 w-12',
        lg: 'h-16 w-16',
    };

    return (
        <div className="flex items-center justify-center">
            <div
                className={`${sizes[size]} border-4 border-primary/20 border-t-primary rounded-full animate-spin`}
            ></div>
        </div>
    );
};

export const PageLoader: React.FC = () => {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-text-secondary">Loading...</p>
            </div>
        </div>
    );
};
